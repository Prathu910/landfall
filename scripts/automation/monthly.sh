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

readonly FOUNDER="Prathu910"
readonly LABEL="data-update"
readonly BOT_NAME="github-actions[bot]"
readonly BOT_EMAIL="41898273+github-actions[bot]@users.noreply.github.com"
readonly MONTH_RE='^[0-9]{4}-(0[1-9]|1[0-2])$'
readonly CODE_RE='^[0-9]{6}$'

BASE_REF="${BASE_REF:-origin/main}"
DRY_RUN="${DRY_RUN:-0}"
export BASE_REF DRY_RUN
WORK="${RUNNER_TEMP:-${TMPDIR:-/tmp}/monthly-data}"
STATE="$WORK/monthly-state"
TODAY="${TODAY:-$(TZ=Australia/Sydney date +%F)}"

INFO=""      # month-info.ts output for the target month
TARGET=""    # the as-at month this run imports
BRANCH=""    # the branch the run commits to (base-branch.ts chooses it)
PR=""        # the open data PR's number when joining one
HELD=""      # yes when the fresh branch is on origin with no open PR (closed: held)
REGENERATED=0
COMMITS=()   # subjects of the commits this run made

fail() {
  echo "Error: $*" >&2
  exit 1
}

# The step name goes to the failure issue (FAILED_STEP).
step() {
  printf '%s\n' "$1" >"$STATE/step"
  printf '\n==> %s\n' "$1"
}

run_tsx() { node_modules/.bin/tsx "$@"; }

field() { sed -n "s/^$1=//p" <<<"$INFO"; }

as_at_of() { node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).asAt' "$1"; }

remember_month() { printf '%s\n' "$1" >"$STATE/month"; }

print_dry() {
  printf 'DRY_RUN:'
  printf ' %q' "$@"
  printf '\n'
}

gh_write() {
  if [[ $DRY_RUN == 1 ]]; then print_dry gh "$@"; else gh "$@"; fi
}

# A dry read prints to stderr and returns nothing (or DRY_RUN_PR_BODY for a PR body).
gh_read() {
  if [[ $DRY_RUN != 1 ]]; then
    gh "$@"
    return
  fi
  print_dry gh "$@" >&2
  if [[ $1 == pr && $2 == view && -n ${DRY_RUN_PR_BODY:-} ]]; then cat "$DRY_RUN_PR_BODY"; fi
}

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

# Install scripts never see the token. The real trust boundary is the pinned
# package-lock.json (checkout's persisted git credentials are still on disk).
install() {
  step "Install dependencies"
  env -u GH_TOKEN npm ci
}

# R17: the frozen check and the "already on main" tests read BASE_REF.
fetch_main() {
  step "Fetch main"
  git fetch --no-tags origin "+refs/heads/main:refs/remotes/origin/main"
}

# Spec 6.9 step 1: work on the open data PR's branch, else a fresh one.
choose_base() {
  step "Choose the base branch"
  local out lock_before
  out="$(run_tsx scripts/automation/base-branch.ts --fresh "$1")"
  BRANCH="$(sed -n 's/^branch=//p' <<<"$out")"
  PR="$(sed -n 's/^pr=//p' <<<"$out")"
  HELD="$(sed -n 's/^held=//p' <<<"$out")"
  [[ -n $BRANCH ]] || fail "base-branch.ts printed no branch"
  if [[ -z $PR ]]; then
    echo "No open $LABEL pull request; the run starts $BRANCH from main."
    return
  fi
  echo "Joining pull request #$PR on $BRANCH."
  lock_before="$(git rev-parse HEAD:package-lock.json)"
  git fetch --no-tags origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
  git switch -C "$BRANCH" "origin/$BRANCH"
  # R14: the installed packages match the branch the scripts now run from.
  if [[ $(git rev-parse HEAD:package-lock.json) != "$lock_before" ]]; then install; fi
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

check_and_build() {
  step "npm run check"
  npm run check
  step "npm run build"
  npm run build 2>&1 | tee "$WORK/build.log"
  step "Frozen-section check"
  npm run updates:frozen-check -- --base "$BASE_REF"
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

# Commits the paths with the message, unless they hold no change.
commit_paths() {
  local message="$1"
  shift
  git add -A -- "$@"
  if git diff --cached --quiet; then
    echo "Nothing to commit for: $message"
    return
  fi
  git -c user.name="$BOT_NAME" -c user.email="$BOT_EMAIL" -c commit.gpgsign=false \
    commit --quiet -m "$message"
  COMMITS+=("$message")
  echo "Committed: $message"
}

# Anything left over would be an unreviewed change outside the data paths.
require_clean_tree() {
  local left
  left="$(git status --porcelain)"
  [[ -z $left ]] || fail "Unexpected changes outside the committed paths:
$left"
}

push_branch() {
  step "Push $BRANCH"
  if [[ $DRY_RUN == 1 ]]; then
    print_dry git push origin "HEAD:refs/heads/$BRANCH"
  else
    git push origin "HEAD:refs/heads/$BRANCH"
  fi
}

# A comment on the joined PR saying what this run added.
comment_on_pr() {
  gh_write pr comment "$PR" --body "$1

$(printf -- '- %s\n' "${COMMITS[@]}")"
}

# Spec 6.9 step 8: a new PR for the founder, or the joined PR's appended body.
open_or_update_pr() {
  step "Open or update the pull request"
  if [[ -n $PR ]]; then
    gh_write pr edit "$PR" --body-file "$WORK/pr-body.md"
    comment_on_pr "Added the SkillSelect data as at $(field short); the summary has a new section for it. New commits:"
    return
  fi
  # Spec 6.16 item 4: the label exists before the first PR uses it.
  gh_write label create "$LABEL" --force --color 0e8a16 \
    --description "Automated SkillSelect data update"
  gh_write pr create --base main --head "$BRANCH" --label "$LABEL" \
    --reviewer "$FOUNDER" --title "SkillSelect data as at $(field short)" \
    --body-file "$WORK/pr-body.md"
}

resolve_failure() {
  step "Close any failure issue for $1"
  run_tsx scripts/automation/failure-issue.ts resolve --month "$1"
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
    echo "Held: the pull request for $(field long) was closed. Delete branch $BRANCH to import it again."
    return
  fi
  load_info ${MONTH:+--month "$MONTH"}
  remember_month "$(field month)"
  probe
  if [[ -z $TARGET ]]; then
    echo "The dashboard has nothing newer than $(field manifest_month). Nothing to do."
    resolve_failure "$(field month)"
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
    open_or_update_pr
  fi
  resolve_failure "$TARGET"
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
  resolve_failure "$TARGET"
}

# The PR body with this month's spotlight, images and captions regenerated.
swap_summary() {
  step "Update the pull request summary"
  gh_read pr view "$PR" --json body --jq .body >"$WORK/existing-body.md"
  run_tsx scripts/updates/summary.ts --month "$TARGET" --kind data --branch "$BRANCH" \
    --today "$TODAY" --swap-into "$WORK/existing-body.md" >"$WORK/pr-body.md"
  echo "Wrote $WORK/pr-body.md ($(wc -c <"$WORK/pr-body.md" | tr -d ' ') bytes)"
}

# R20: the artifact holds the git status and any raw files the run fetched.
collect_failure() {
  mkdir -p "$WORK/failure-raw"
  git status --porcelain >"$WORK/git-status.log" || true
  git ls-files --modified --others --exclude-standard -z -- data/raw |
    tar --null -T - -cf - | tar -xf - -C "$WORK/failure-raw" || true
}

report_failure() {
  local month
  month="$(cat "$STATE/month" 2>/dev/null || true)"
  if [[ ! $month =~ $MONTH_RE ]]; then
    echo "The run failed before it chose a month, so no failure issue was opened." >&2
    return
  fi
  touch "$WORK/monthly.log"
  FAILED_STEP="$(cat "$STATE/step" 2>/dev/null || echo unknown)"
  export FAILED_STEP
  if [[ -x node_modules/.bin/tsx ]]; then
    run_tsx scripts/automation/failure-issue.ts report --month "$month" --log "$WORK/monthly.log"
  else
    report_failure_with_gh "$month"
  fi
}

# Without node_modules (npm ci failed): failure-issue.ts's title, author
# filter and stdin body, with gh directly.
report_failure_with_gh() {
  local title number body fence run_url
  title="Monthly SkillSelect update failed ($(node -p '
    const [y, m] = process.argv[1].split("-");
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1] + " " + y' "$1"))"
  number="$(gh_read issue list --state open --author app/github-actions --limit 200 \
    --json number,title --jq ".[] | select(.title == \"$title\") | .number" | head -n 1)"
  run_url="${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
  fence="$(tail -n 50 "$WORK/monthly.log" | grep -o '`*' | awk '{ if (length > n) n = length } END { s = "```"; while (length(s) <= n) s = s "`"; print s }')"
  body="$(printf 'Failing step: %s\nRun: %s\n\nLast 50 log lines:\n\n%s\n%s\n%s\n' \
    "$FAILED_STEP" "$run_url" "$fence" "$(tail -n 50 "$WORK/monthly.log")" "$fence" | head -c 60000)"
  if [[ -n $number ]]; then
    gh_write issue comment "$number" --body-file - <<<"$body"
  else
    gh_write issue create --title "$title" --body-file - --assignee "$FOUNDER" <<<"$body"
  fi
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
