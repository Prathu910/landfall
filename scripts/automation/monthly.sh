#!/usr/bin/env bash
# The monthly SkillSelect job (spec 6.9), run by .github/workflows/monthly-data.yml.
#
#   bash scripts/automation/monthly.sh prepare          clear old state and record the likely month
#   bash scripts/automation/monthly.sh run              import a new month, or swap the spotlight
#   bash scripts/automation/monthly.sh collect-failure  save a failed run's git status and raw files
#   bash scripts/automation/monthly.sh report-failure   open or comment on the failure issue
#
# Environment:
#   MONTH        optional YYYY-MM. Import this month instead of probing (the
#                rehearsal); with SPOTLIGHT, the open pull request's month.
#   SPOTLIGHT    optional six-digit code: swap the open data PR's spotlight (spec 6.8).
#   BASE_REF     the published branch (default origin/main). Local dry runs
#                use HEAD (R15).
#   DRY_RUN=1    no dashboard import (data:generate instead), and every git
#                push and gh call is printed, not run; gh reads return nothing,
#                except DRY_RUN_OPEN_PRS (JSON for `gh pr list`, read by gh.ts)
#                and DRY_RUN_PR_BODY (a file for `gh pr view`), for local tests.
#   TODAY        optional YYYY-MM-DD for the run's Sydney date (reproducible
#                local runs); Actions leaves it unset.
#   RUNNER_TEMP  where the logs, import report and PR body go (Actions sets it).
#   GH_TOKEN     for gh (Actions sets it from github.token).
#
# Any failure stops the script before anything is pushed. Decisions live in
# the tested TypeScript helpers; this file only runs them in order.
set -euo pipefail

# shellcheck source=scripts/automation/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

readonly MONTH_RE='^[0-9]{4}-(0[1-9]|1[0-2])$'
readonly CODE_RE='^[0-9]{6}$'

WORK="${RUNNER_TEMP:-${TMPDIR:-/tmp}/monthly-data}"
STATE="$WORK/monthly-state"

INFO=""      # month-info.ts output for the target month
TARGET=""    # the as-at month this run imports
REGENERATED=0

field() { sed -n "s/^$1=//p" <<<"$INFO"; }

as_at_of() { node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).asAt' "$1"; }

remember_month() { printf '%s\n' "$1" >"$STATE/month"; }

# Needs only node, so a failure before or during `npm ci` still has a month.
early_month() {
  if [[ -n ${MONTH:-} ]]; then
    echo "$MONTH"
    return
  fi
  node -p 'const [y, m] = JSON.parse(require("fs").readFileSync("src/data/manifest.json", "utf8")).asAt.split("-").map(Number);
    m === 12 ? y + 1 + "-01" : y + "-" + String(m + 1).padStart(2, "0")'
}

load_info() { INFO="$(run_tsx scripts/automation/month-info.ts "$@")"; }

check_inputs() {
  [[ -z ${MONTH:-} || ${MONTH} =~ $MONTH_RE ]] || fail "MONTH must be YYYY-MM, got \"${MONTH}\""
  [[ -z ${SPOTLIGHT:-} || ${SPOTLIGHT} =~ $CODE_RE ]] || fail "SPOTLIGHT must be a six-digit code, got \"${SPOTLIGHT}\""
}

# Idempotent: the workflow runs it before the Chrome step, and `run` again.
prepare() {
  mkdir -p "$STATE"
  rm -f "$STATE/step" "$STATE/month" "$WORK/import.json" "$WORK/build.log" \
    "$WORK/pr-body.md" "$WORK/existing-body.md" "$WORK/previous-manifest.json"
  remember_month "$(early_month)"
}

# Spec 6.9 steps 2 and 3. Sets TARGET to empty when there is nothing new.
probe() {
  if [[ -n ${MONTH:-} ]]; then
    echo "MONTH=$MONTH given; not probing the dashboard."
    TARGET="$MONTH"
    return
  fi
  step "Probe the dashboard"
  local out newest
  out="$(run_tsx scripts/import/cli.ts --probe)"
  printf '%s\n' "$out"
  newest="$(sed -nE 's/^Newest As At Month: ([0-9]{4}-[0-9]{2})$/\1/p' <<<"$out")"
  [[ $newest =~ $MONTH_RE ]] || fail "The probe printed no As At Month"
  TARGET="$(run_tsx scripts/automation/next-month.ts --newest "$newest")"
}

import_month() {
  step "Import $TARGET"
  local common=(--as-at "$TARGET" --checked-at "$TODAY" --report-file "$WORK/import.json")
  if [[ $DRY_RUN == 1 ]]; then
    echo "DRY_RUN: regenerating from data/raw instead of importing."
    npm run data:generate -- "${common[@]}"
  else
    # --keep-rounds: the monthly job adds no rounds (spec 6.9 step 4).
    npm run data:import -- "${common[@]}" --keep-rounds
  fi
}

# Spec decision 3: a data section already on main is never regenerated.
generate_recap() {
  if [[ $(field data_on_base) == yes ]]; then
    echo "The $TARGET data section is on $BASE_REF already; not regenerating it."
    return
  fi
  step "Write the $TARGET recap facts"
  local args=(--month "$TARGET" --section data --today "$TODAY")
  # updates:generate takes only last month's manifest.
  if [[ $(field manifest_month) == "$(field previous_month)" ]]; then
    args+=(--previous-manifest "$WORK/previous-manifest.json")
  fi
  npm run updates:generate -- "${args[@]}"
  REGENERATED=1
}

render_month_set() {
  if [[ $REGENERATED == 0 && -f public/social/$TARGET/month/set.json ]]; then
    echo "The $TARGET month set is there already; not re-rendering it."
    return
  fi
  step "Render the $TARGET month set"
  npm run social:render -- --month "$TARGET" --set month
}

prune_images() {
  step "Prune old Instagram sets"
  npm run updates:retention
}

write_summary() {
  step "Write the pull request summary"
  local args=(--month "$TARGET" --kind data --previous-manifest "$WORK/previous-manifest.json"
    --import-report "$WORK/import.json" --build-log "$WORK/build.log" --branch "$BRANCH"
    --today "$TODAY")
  if [[ -n $PR ]]; then
    gh_read pr view "$PR" --json body --jq .body >"$WORK/existing-body.md"
    args+=(--append-to "$WORK/existing-body.md")
  fi
  run_tsx scripts/updates/summary.ts "${args[@]}" >"$WORK/pr-body.md"
  echo "Wrote $WORK/pr-body.md ($(wc -c <"$WORK/pr-body.md" | tr -d ' ') bytes)"
}

run_import() {
  install
  fetch_main
  # Before the base is known, main's next month names a fresh branch.
  load_info ${MONTH:+--month "$MONTH"}
  remember_month "$(field month)"
  choose_base "data/skillselect-$(field month)"
  # Controller ruling: closing a data PR holds the month (no import, no issue).
  if [[ $HELD == yes ]]; then
    echo "Held: the pull request for $(field long) was closed. Delete branch data/skillselect-$(field month) to import it again."
    return
  fi
  load_info ${MONTH:+--month "$MONTH"}
  remember_month "$(field month)"
  probe
  if [[ -z $TARGET ]]; then
    echo "The dashboard has nothing newer than $(field manifest_month). Nothing to do."
    resolve_failure --month "$(field month)"
    return
  fi
  [[ $TARGET == "$(field month)" ]] || fail "next-month.ts chose $TARGET, not $(field month)"
  if [[ -z $PR ]]; then git switch -C "$BRANCH"; fi
  # INFO's manifest_month is now the previous manifest's month.
  cp src/data/manifest.json "$WORK/previous-manifest.json"
  import_month
  generate_recap
  render_month_set
  prune_images
  check_and_build
  write_summary
  step "Commit"
  commit_paths "data: SkillSelect snapshot as at $(field short)" \
    data/raw src/data ':(exclude)src/data/updates'
  commit_paths "feat(updates): $(field long) recap and Instagram cards" \
    src/data/updates public/social
  require_clean_tree
  if [[ ${#COMMITS[@]} == 0 ]]; then
    echo "No changes to publish."
  else
    push_branch
    open_or_update_pr "SkillSelect data as at $(field short)" \
      "Added the SkillSelect data as at $(field short); the summary has a new section for it. New commits:"
  fi
  resolve_failure --month "$TARGET"
}

# Spec 6.8: rerun the data section with the founder's pick on the open PR.
run_swap() {
  install
  fetch_main
  load_info ${MONTH:+--month "$MONTH"}
  remember_month "$(field month)"
  choose_base "data/skillselect-$(field month)"
  [[ -n $PR ]] || fail "No open $LABEL pull request; a spotlight swap runs on the open one."
  load_info
  TARGET="${MONTH:-$(field manifest_month)}"
  [[ $TARGET == "$(field manifest_month)" ]] ||
    fail "Pull request #$PR has the data as at $(field manifest_month), not $TARGET"
  remember_month "$TARGET"
  load_info --month "$TARGET" --spotlight "$SPOTLIGHT"
  [[ $(field data_on_base) == no ]] ||
    fail "The $TARGET data section is on $BASE_REF and frozen; its spotlight can't change."
  step "Swap the spotlight to $(field spotlight_name)"
  local args=(--month "$TARGET" --section data --spotlight "$SPOTLIGHT")
  git show "$BASE_REF:src/data/manifest.json" >"$WORK/previous-manifest.json"
  if [[ $(as_at_of "$WORK/previous-manifest.json") == "$(field previous_month)" ]]; then
    args+=(--previous-manifest "$WORK/previous-manifest.json")
  fi
  npm run updates:generate -- "${args[@]}" --today "$TODAY"
  REGENERATED=1
  render_month_set
  check_and_build
  swap_summary
  step "Commit"
  commit_paths "feat(updates): spotlight $(field spotlight_name)" src/data/updates public/social
  require_clean_tree
  [[ ${#COMMITS[@]} -gt 0 ]] || fail "The swap changed nothing; is $SPOTLIGHT already the spotlight?"
  push_branch
  step "Update pull request #$PR"
  gh_write pr edit "$PR" --body-file - <"$WORK/pr-body.md"
  comment_on_pr "Swapped the $(field short) spotlight to $(field spotlight_name) ($SPOTLIGHT), re-rendered the month cards and updated the summary's spotlight, images and captions. New commits:"
  resolve_failure --month "$TARGET"
}

# The PR body with this month's spotlight, images and captions regenerated.
swap_summary() {
  step "Update the pull request summary"
  gh_read pr view "$PR" --json body --jq .body >"$WORK/existing-body.md"
  run_tsx scripts/updates/summary.ts --month "$TARGET" --kind data --branch "$BRANCH" \
    --today "$TODAY" --swap-into "$WORK/existing-body.md" >"$WORK/pr-body.md"
  echo "Wrote $WORK/pr-body.md ($(wc -c <"$WORK/pr-body.md" | tr -d ' ') bytes)"
}

report_failure() {
  local month
  month="$(cat "$STATE/month" 2>/dev/null || true)"
  if [[ ! $month =~ $MONTH_RE ]]; then
    echo "The run failed before it chose a month, so no failure issue was opened." >&2
    return
  fi
  report_failure_issue --month "$month" failure_title "$WORK/monthly.log"
}

# failure-issue.ts's title, for reporting without tsx.
# shellcheck disable=SC2329 # called by report_failure_issue
failure_title() {
  local month
  month="$(node -p '
    const [y, m] = process.argv[1].split("-");
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1] + " " + y' "$1")" || return
  echo "Monthly SkillSelect update failed ($month)"
}

main() {
  check_inputs
  case "${1:-}" in
    prepare) prepare ;;
    run)
      prepare
      if [[ -n ${SPOTLIGHT:-} ]]; then run_swap; else run_import; fi
      ;;
    collect-failure) collect_failure ;;
    report-failure) report_failure ;;
    *) fail "Usage: monthly.sh prepare|run|collect-failure|report-failure" ;;
  esac
}

# One line, so bash never reads this file again after a checkout changes it.
main "$@"; exit
