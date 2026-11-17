# Task 4 report
Implemented invitations.ts, state-evidence.ts, similar-profile.ts (+ tests); extended fixtures with activityCoreFixture and profileDetailFixture (Task 3 fixtures unchanged).
RED: initial run had 1 failing test (my own over-broad regex, fixed to assert on state.invitedAtOrBelow). No separate pre-implementation RED run was captured; implementation was written alongside tests.
GREEN: `npm run check` passes, 11 files / 95 tests.
Peak ties resolve to the later month. INVITED is never summed across months.
