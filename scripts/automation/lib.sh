# Shared by monthly.sh and round.sh, which source it; not run on its own.
# Bash reads a sourced file whole, so a later checkout that changes this file
# never changes a running job.
#
# The caller sets WORK (logs, reports, PR body) and STATE (the failing step
# and the issue key) before calling anything here. The functions read and set
# these globals:
#   BASE_REF, DRY_RUN, TODAY   set below from the environment
#   BRANCH, PR, HELD           set by choose_base
#   COMMITS                    commit_paths appends each subject
# shellcheck shell=bash

readonly FOUNDER="Prathu910"
readonly LABEL="data-update"
readonly BOT_NAME="github-actions[bot]"
readonly BOT_EMAIL="41898273+github-actions[bot]@users.noreply.github.com"

BASE_REF="${BASE_REF:-origin/main}"
DRY_RUN="${DRY_RUN:-0}"
export BASE_REF DRY_RUN
TODAY="${TODAY:-$(TZ=Australia/Sydney date +%F)}"

BRANCH=""  # the branch the run commits to (base-branch.ts chooses it)
PR=""      # the open data PR's number when joining one
HELD=""    # yes when the fresh branch is on origin with no open PR (closed)
COMMITS=() # subjects of the commits this run made

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
  # shellcheck disable=SC2034 # read by the sourcing script
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

check_and_build() {
  step "npm run check"
  npm run check
  step "npm run build"
  npm run build 2>&1 | tee "$WORK/build.log"
  step "Frozen-section check"
  npm run updates:frozen-check -- --base "$BASE_REF"
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

# Spec 6.9 step 8: a new PR titled $1 for the founder, or the joined PR's
# appended body and a comment that starts with $2.
open_or_update_pr() {
  step "Open or update the pull request"
  if [[ -n $PR ]]; then
    gh_write pr edit "$PR" --body-file "$WORK/pr-body.md"
    comment_on_pr "$2"
    return
  fi
  # Spec 6.16 item 4: the label exists before the first PR uses it.
  gh_write label create "$LABEL" --force --color 0e8a16 \
    --description "Automated SkillSelect data update"
  gh_write pr create --base main --head "$BRANCH" --label "$LABEL" \
    --reviewer "$FOUNDER" --title "$1" --body-file "$WORK/pr-body.md"
}

# resolve_failure --month YYYY-MM | --round YYYY-MM-DD
resolve_failure() {
  step "Close any failure issue for $2"
  run_tsx scripts/automation/failure-issue.ts resolve "$1" "$2"
}

# R20: the artifact holds the git status and any raw files the run fetched.
collect_failure() {
  mkdir -p "$WORK/failure-raw"
  git status --porcelain >"$WORK/git-status.log" || true
  git ls-files --modified --others --exclude-standard -z -- data/raw |
    tar --null -T - -cf - | tar -xf - -C "$WORK/failure-raw" || true
}

# report_failure_issue FLAG KEY TITLE_FUNCTION LOG: failure-issue.ts with
# `FLAG KEY` (--month YYYY-MM or --round YYYY-MM-DD), or gh directly under the
# title that `TITLE_FUNCTION KEY` prints.
report_failure_issue() {
  local flag="$1" key="$2" title_function="$3" log="$4" title
  touch "$log"
  FAILED_STEP="$(cat "$STATE/step" 2>/dev/null || echo unknown)"
  export FAILED_STEP
  # A partial install can leave tsx in place and still fail, so fall back then too.
  if [[ -x node_modules/.bin/tsx ]] &&
    run_tsx scripts/automation/failure-issue.ts report "$flag" "$key" --log "$log"; then
    return
  fi
  echo "failure-issue.ts is unavailable; reporting with gh directly." >&2
  title="$("$title_function" "$key")"
  report_failure_with_gh "$title" "$log"
}

# The issue body's log text is capped here, before formatting, so no pipe is
# cut short (SIGPIPE would end the script with no issue).
readonly LOG_CAP=59000

# Without a working tsx (npm ci failed): failure-issue.ts's author filter,
# fenced log tail and stdin body, with gh directly. $1 is the title, $2 the log.
report_failure_with_gh() {
  local title="$1" number body fence run_url log
  number="$(gh_read issue list --state open --author app/github-actions --limit 200 \
    --json number,title --jq ".[] | select(.title == \"$title\") | .number" | head -n 1)"
  run_url="${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
  tail -n 50 "$2" >"$STATE/log-tail"
  log="$(head -c "$LOG_CAP" "$STATE/log-tail")"
  # An empty log has no backticks; grep's exit 1 must not end the script.
  fence="$({ grep -o '`*' <<<"$log" || true; } |
    awk '{ if (length > n) n = length } END { s = "```"; while (length(s) <= n) s = s "`"; print s }')"
  body="$(printf 'Failing step: %s\nRun: %s\n\nLast 50 log lines:\n\n%s\n%s\n%s\n' \
    "$FAILED_STEP" "$run_url" "$fence" "$log" "$fence")"
  if (($(wc -c <"$STATE/log-tail") > LOG_CAP)); then
    body="$body
(truncated)"
  fi
  if [[ -n $number ]]; then
    gh_write issue comment "$number" --body-file - <<<"$body"
  else
    gh_write issue create --title "$title" --body-file - --assignee "$FOUNDER" <<<"$body"
  fi
}
