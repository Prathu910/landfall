#!/usr/bin/env bash
# The daily page watcher's job steps (spec 6.11), run by
# .github/workflows/page-watch.yml. The watch itself is scripts/page-watch/cli.ts.
#
#   bash scripts/automation/page-watch.sh prepare         clear old state
#   bash scripts/automation/page-watch.sh run             create the label and check the cited pages
#   bash scripts/automation/page-watch.sh resolve         close any "Page watch failed" issue
#   bash scripts/automation/page-watch.sh report-failure  open or comment on that issue
#
# Environment:
#   RUNNER_TEMP  where the state, step and log go (Actions sets it).
#   DRY_RUN=1    every gh call is printed, not run.
#   GH_TOKEN     for gh (Actions sets it from github.token).
set -euo pipefail

# shellcheck source=scripts/automation/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

WORK="${RUNNER_TEMP:-${TMPDIR:-/tmp}/page-watch-job}"
STATE="$WORK/page-watch-job"

# Records the first step, so a failed install still names it.
prepare() {
  mkdir -p "$STATE"
  rm -f "$STATE/step"
  step "Install dependencies"
}

run_watch() {
  # R18: the issues carry this label, so it must exist first.
  step "Create the source-watch label"
  gh_write label create source-watch --force --color FBCA04 \
    --description "An official page the site cites has changed or is unreachable"
  # The script stops requesting pages after 15 minutes, so it always plans and saves.
  step "Check the cited pages"
  npm run page-watch -- --state "$WORK/page-watch/state.json"
}

resolve() {
  step "Close any page watch failure issue"
  run_tsx scripts/automation/failure-issue.ts resolve --page-watch
}

# failure-issue.ts's title for `--page-watch`, for reporting without tsx.
# shellcheck disable=SC2329 # called by report_failure_issue
failure_title() { echo "Page watch failed"; }

main() {
  case "${1:-}" in
    prepare) prepare ;;
    run) run_watch ;;
    resolve) resolve ;;
    report-failure) report_failure_issue "$WORK/page-watch.log" failure_title --page-watch ;;
    *) fail "Usage: page-watch.sh prepare|run|resolve|report-failure" ;;
  esac
}

# One line, so bash never reads this file again after a checkout changes it.
main "$@"; exit
