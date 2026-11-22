## Review Focus

1. **Occupation data still loading or failed** (`ReportOccupation` `loading` / `unavailable`): the report shows "Loading published data…" (loading) or the no-core path (unavailable), never a stamp built from nothing. Test in Task 10.
2. **Points-only check** (no occupation, `profile.occupation === ""`): the outlook section shows the points and a plain line inviting the reader to choose an occupation; no stamp, no charts. Test in Task 10.
3. **Detail file failed while core loaded** (`DetailLoad` not ready): the lodged pace and cohort evidence are omitted with a plain sentence; labels still compute from the core. Test in Task 5.
4. **Unconfirmed dates** (`eligible === null`, `uncheckedDates` not empty): the 189 label is computed (only `eligible === false` means Not eligible yet) and the why line adds "Confirm your English and skills assessment dates." Test in Task 2.
5. **EOI date after the snapshot month or in the future**: no pace estimate; the wait uses the planner text and the queue uses the pool variant. Test in Task 5.

