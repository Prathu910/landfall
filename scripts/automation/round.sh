#!/usr/bin/env bash
# The 189 round job (spec 6.10), run by .github/workflows/round-189.yml.
#
#   bash scripts/automation/round.sh prepare          clear old state and record the run's date
#   bash scripts/automation/round.sh run              import any new rounds and open the pull request
#   bash scripts/automation/round.sh collect-failure  save a failed run's git status and raw files
#   bash scripts/automation/round.sh report-failure   open or comment on the failure issue
#
# Environment:
#   BASE_REF         the published branch (default origin/main). Local dry
#                    runs use HEAD (R15).
#   DRY_RUN=1        every git push and gh call is printed, not run; gh reads
#                    return nothing, except DRY_RUN_OPEN_PRS (JSON for
#                    `gh pr list`, read by gh.ts) and DRY_RUN_PR_BODY (a file
#                    for `gh pr view`), for local tests.
#   ROUNDS_HTML_DIR  dry runs only: the folder of saved invitation-rounds.html
#                    and previous-rounds.html that stands in for the official
#                    pages (detect-round.ts and the import's --rounds-html).
#   TODAY            optional YYYY-MM-DD for the run's Sydney date (reproducible
#                    local runs); Actions leaves it unset.
#   RUNNER_TEMP      where the logs, import report and PR body go (Actions sets it).
#   GH_TOKEN         for gh (Actions sets it from github.token).
#
# Any failure stops the script before anything is pushed. Decisions live in
# the tested TypeScript helpers; this file only runs them in order.
set -euo pipefail

# shellcheck source=scripts/automation/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

readonly DATE_RE='^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'

WORK="${RUNNER_TEMP:-${TMPDIR:-/tmp}/round-189}"
STATE="$WORK/round-state"

STATUS=""        # detect-round.ts: new or none
NEWEST=""        # the round date on the current invitation rounds page
NEW_ROUNDS=()    # the rounds the import added, oldest first
ROUND_MONTHS=()  # each new round's data month (round-info.ts)
ROUND_DAYS=()    # each new round's "15 Oct 2026"
ROUND_ON_BASE=() # yes when BASE_REF already has the round's section

# The failure issue's date: the run's date until the round's is known.
remember_round() { printf '%s\n' "$1" >"$STATE/round"; }

check_inputs() {
  [[ -z ${ROUNDS_HTML_DIR:-} || $DRY_RUN == 1 ]] ||
    fail "ROUNDS_HTML_DIR is for dry runs (DRY_RUN=1) only"
}

# Idempotent: the workflow runs it before the Chrome step, and `run` again.
prepare() {
  mkdir -p "$STATE"
  rm -f "$STATE/step" "$STATE/round" "$WORK/import.json" "$WORK/build.log" \
    "$WORK/pr-body.md" "$WORK/pr-body.next.md" "$WORK/existing-body.md" \
    "$WORK/previous-manifest.json"
  remember_round "$TODAY"
}

# Spec 6.10 "Detect", against the checked-out branch's src/data/rounds.json.
detect() {
  step "$1"
  local out
  out="$(run_tsx scripts/automation/detect-round.ts)"
  printf '%s\n' "$out"
  STATUS="$(sed -n 's/^status=//p' <<<"$out")"
  NEWEST="$(sed -n 's/^newest=//p' <<<"$out")"
  [[ $STATUS == new || $STATUS == none ]] || fail "detect-round.ts printed no status"
  [[ $NEWEST =~ $DATE_RE ]] || fail "detect-round.ts printed no round date"
}

import_rounds() {
  step "Import the 189 rounds"
  local args=(--rounds-only --checked-at "$TODAY" --report-file "$WORK/import.json")
  if [[ -n ${ROUNDS_HTML_DIR:-} ]]; then
    args+=(--rounds-html "$ROUNDS_HTML_DIR")
  elif [[ $DRY_RUN == 1 ]]; then
    fail "A dry run imports saved round pages only; set ROUNDS_HTML_DIR"
  fi
  npm run data:import -- "${args[@]}"
}

# The import report's new round dates, oldest first, with their info.
load_new_rounds() {
  local dates date info
  dates="$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).newRounds.sort().join("\n")' \
    "$WORK/import.json")"
  [[ -n $dates ]] || fail "The import added no round, but the page has $NEWEST"
  NEW_ROUNDS=()
  while IFS= read -r date; do
    [[ $date =~ $DATE_RE ]] || fail "The import report has a bad round date: $date"
    NEW_ROUNDS+=("$date")
  done <<<"$dates"
  [[ " ${NEW_ROUNDS[*]} " == *" $NEWEST "* ]] || fail "The import did not add the $NEWEST round"
  echo "New rounds, oldest first: ${NEW_ROUNDS[*]}"
  ROUND_MONTHS=()
  ROUND_DAYS=()
  ROUND_ON_BASE=()
  for date in "${NEW_ROUNDS[@]}"; do
    info="$(run_tsx scripts/automation/round-info.ts --round "$date")"
    ROUND_MONTHS+=("$(sed -n 's/^month=//p' <<<"$info")")
    ROUND_DAYS+=("$(sed -n 's/^day=//p' <<<"$info")")
    ROUND_ON_BASE+=("$(sed -n 's/^on_base=//p' <<<"$info")")
  done
}

# Each section is frozen once merged: one already on main is not regenerated.
generate_and_render() {
  local i date month regenerated
  for i in "${!NEW_ROUNDS[@]}"; do
    date="${NEW_ROUNDS[$i]}"
    month="${ROUND_MONTHS[$i]}"
    regenerated=0
    if [[ ${ROUND_ON_BASE[$i]} == yes ]]; then
      echo "The $date round section is on $BASE_REF already; not regenerating it."
    else
      step "Write the $date round recap facts"
      npm run updates:generate -- --month "$month" --section round --round "$date" --today "$TODAY"
      regenerated=1
    fi
    if [[ $regenerated == 0 && -f public/social/$month/round-$date/set.json ]]; then
      echo "The $date round set is there already; not re-rendering it."
      continue
    fi
    step "Render the $date round set"
    npm run social:render -- --month "$month" --set round --round "$date"
  done
}

# One section per round, oldest first, each appended to the body so far.
write_summary() {
  step "Write the pull request summary"
  local i body="" args
  if [[ -n $PR ]]; then
    gh_read pr view "$PR" --json body --jq .body >"$WORK/existing-body.md"
    body="$WORK/existing-body.md"
  fi
  for i in "${!NEW_ROUNDS[@]}"; do
    args=(--month "${ROUND_MONTHS[$i]}" --kind round --round "${NEW_ROUNDS[$i]}"
      --previous-manifest "$WORK/previous-manifest.json" --import-report "$WORK/import.json"
      --build-log "$WORK/build.log" --branch "$BRANCH" --today "$TODAY")
    if [[ -n $body ]]; then args+=(--append-to "$body"); fi
    run_tsx scripts/updates/summary.ts "${args[@]}" >"$WORK/pr-body.next.md"
    mv "$WORK/pr-body.next.md" "$WORK/pr-body.md"
    body="$WORK/pr-body.md"
  done
  echo "Wrote $WORK/pr-body.md ($(wc -c <"$WORK/pr-body.md" | tr -d ' ') bytes)"
}

# "15 Oct 2026", "1 Oct 2026 and 15 Oct 2026", or "1 Oct 2026, 8 Oct 2026 and 15 Oct 2026".
days_text() {
  local i last=$((${#ROUND_DAYS[@]} - 1)) text=""
  for i in "${!ROUND_DAYS[@]}"; do
    if ((i == 0)); then
      text="${ROUND_DAYS[i]}"
    elif ((i == last)); then
      text="$text and ${ROUND_DAYS[i]}"
    else
      text="$text, ${ROUND_DAYS[i]}"
    fi
  done
  echo "$text"
}

# Round PRs are not held (summary publish line): a closed round PR's branch is
# replaced, but only while origin still has the tip this run saw.
push_round_branch() {
  if [[ -n $PR || $HELD != yes ]]; then
    push_branch
    return
  fi
  local old
  old="$(git ls-remote --heads origin "refs/heads/$BRANCH" | cut -f1)"
  [[ -n $old ]] || fail "origin has no $BRANCH to replace"
  step "Replace $BRANCH, the branch of a closed pull request"
  local args=("--force-with-lease=refs/heads/$BRANCH:$old" origin "HEAD:refs/heads/$BRANCH")
  if [[ $DRY_RUN == 1 ]]; then print_dry git push "${args[@]}"; else git push "${args[@]}"; fi
}

resolve_round_failures() {
  resolve_failure --round "$NEWEST"
  # A failure before the page was read is filed under the run's date.
  if [[ $TODAY != "$NEWEST" ]]; then resolve_failure --round "$TODAY"; fi
}

run_round() {
  install
  fetch_main
  detect "Look for a new 189 round"
  remember_round "$NEWEST"
  if [[ $STATUS == none ]]; then
    echo "The $NEWEST round on the Home Affairs page is in src/data/rounds.json already. Nothing to do."
    resolve_round_failures
    return
  fi
  choose_base "data/round-$NEWEST"
  if [[ -n $PR ]]; then
    detect "Look for the round on $BRANCH"
    if [[ $STATUS == none ]]; then
      echo "Pull request #$PR has the $NEWEST round already. Nothing to do."
      resolve_round_failures
      return
    fi
  else
    git switch -C "$BRANCH"
  fi
  cp src/data/manifest.json "$WORK/previous-manifest.json"
  import_rounds
  load_new_rounds
  generate_and_render
  check_and_build
  write_summary
  step "Commit"
  local days plural="" each="it"
  days="$(days_text)"
  if ((${#NEW_ROUNDS[@]} > 1)); then
    plural=s
    each=each
  fi
  commit_paths "data: 189 round$plural of $days" \
    data/raw src/data ':(exclude)src/data/updates'
  commit_paths "feat(updates): $days round recap$plural and cards" \
    src/data/updates public/social
  require_clean_tree
  if [[ ${#COMMITS[@]} == 0 ]]; then
    echo "No changes to publish."
  else
    push_round_branch
    open_or_update_pr "189 round$plural of $days" \
      "Added the 189 round$plural of $days; the summary has a new section for $each. New commits:"
  fi
  resolve_round_failures
}

report_failure() {
  local round
  round="$(cat "$STATE/round" 2>/dev/null || true)"
  if [[ ! $round =~ $DATE_RE ]]; then
    echo "The run failed before it recorded a date, so no failure issue was opened." >&2
    return
  fi
  report_failure_issue --round "$round" failure_title "$WORK/round.log"
}

# failure-issue.ts's title, for reporting without tsx.
# shellcheck disable=SC2329 # called by report_failure_issue
failure_title() {
  local day
  day="$(node -p '
    const [y, m, d] = process.argv[1].split("-");
    Number(d) + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1] + " " + y' "$1")" || return
  echo "189 round import failed ($day)"
}

main() {
  check_inputs
  case "${1:-}" in
    prepare) prepare ;;
    run)
      prepare
      run_round
      ;;
    collect-failure) collect_failure ;;
    report-failure) report_failure ;;
    *) fail "Usage: round.sh prepare|run|collect-failure|report-failure" ;;
  esac
}

# One line, so bash never reads this file again after a checkout changes it.
main "$@"; exit
