# Test case register (auto-generated from the last run)

Result column: PASS = behaviour matches expectation. XFAIL = known defect, test asserts the correct behaviour and is expected to fail until the code is fixed.

Total test cases: **249**


## Black-box tests


### `tests/blackbox/auth.blackbox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | BB-AUTH  POST /auth/login TC-A01 valid credentials -> 200 with token, account, business, flags | PASS |
| 2 | BB-AUTH  POST /auth/login TC-A02 response never leaks the password hash | PASS |
| 3 | BB-AUTH  POST /auth/login TC-A03 correct email + wrong password -> 401 | PASS |
| 4 | BB-AUTH  POST /auth/login TC-A04 unknown email -> 401 with the SAME message (no user enumeration) | PASS |
| 5 | BB-AUTH  POST /auth/login TC-A05 empty body -> 400 | PASS |
| 6 | BB-AUTH  POST /auth/login TC-A05 missing password -> 400 | PASS |
| 7 | BB-AUTH  POST /auth/login TC-A05 missing email -> 400 | PASS |
| 8 | BB-AUTH  POST /auth/login TC-A05 empty-string email -> 400 | PASS |
| 9 | BB-AUTH  POST /auth/login TC-A05 empty-string password -> 400 | PASS |
| 10 | BB-AUTH  POST /auth/login TC-A06 password is case-sensitive | PASS |
| 11 | BB-AUTH  POST /auth/login TC-A07 SQL-injection style input is treated as plain data -> 401 | PASS |
| 12 | BB-AUTH  POST /auth/login TC-A08 token issued at login is accepted by a protected endpoint | PASS |
| 13 | BB-AUTH  GET /auth/me  (session / token validation) TC-A09 valid token -> 200 with account, business and flags | PASS |
| 14 | BB-AUTH  GET /auth/me  (session / token validation) TC-A10 no Authorization header -> 401 | PASS |
| 15 | BB-AUTH  GET /auth/me  (session / token validation) TC-A10 wrong scheme (Basic) -> 401 | PASS |
| 16 | BB-AUTH  GET /auth/me  (session / token validation) TC-A10 Bearer with no token -> 401 | PASS |
| 17 | BB-AUTH  GET /auth/me  (session / token validation) TC-A10 garbage token -> 401 | PASS |
| 18 | BB-AUTH  GET /auth/me  (session / token validation) TC-A10 token signed with another secret -> 401 | PASS |
| 19 | BB-AUTH  GET /auth/me  (session / token validation) TC-A11 expired token -> 401 "Invalid or expired token" | PASS |
| 20 | BB-AUTH  GET /auth/me  (session / token validation) TC-A12 valid token for an account that no longer exists -> 401 | PASS |
| 21 | BB-AUTH  GET /auth/me  (session / token validation) TC-A13 "logout" = client discards token; without a token access is refused | PASS |
| 22 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E0x directory=true attendance=true -> dir 200 / attendance 200 | PASS |
| 23 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E0x directory=true attendance=false -> dir 200 / attendance 403 | PASS |
| 24 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E0x directory=false attendance=true -> dir 403 / attendance 200 | PASS |
| 25 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E0x directory=false attendance=false -> dir 403 / attendance 403 | PASS |
| 26 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E05 blocked module returns reason "not-purchased" and a readable message | PASS |
| 27 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E06 business with no flags row at all -> 403 | PASS |
| 28 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E07 unauthenticated request to a gated module -> 401 (auth is checked before entitlement) | PASS |
| 29 | BB-ENTITLEMENT  Decision table (flag combination -> HTTP access) TC-E08 enabling a flag takes effect on the next request (no re-login needed) | PASS |

### `tests/blackbox/staffAttendance.blackbox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | BB-ATT  Register  GET /register TC-T01 staff with no record default to ABSENT with no times | PASS |
| 2 | BB-ATT  Register  GET /register TC-T02 row shows the working schedule for THAT weekday only | PASS |
| 3 | BB-ATT  Register  GET /register TC-T03 a day marked OFF is reported as { isOff: true } | PASS |
| 4 | BB-ATT  Register  GET /register TC-T04 search by first/last name (case-insensitive) | PASS |
| 5 | BB-ATT  Register  GET /register TC-T05 filter by status | PASS |
| 6 | BB-ATT  Register  GET /register TC-T06 archived staff are not listed | PASS |
| 7 | BB-ATT  Register  GET /register TC-T07 other businesses' staff are never listed | PASS |
| 8 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T08 check-in creates a record, default status PRESENT, stay time not yet known | PASS |
| 9 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T09 check-out after check-in calculates stay time (Practical-10 example: 09:15 -> 18:05 = 8.83 h) | PASS |
| 10 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T10 check-in and check-out in one request | PASS |
| 11 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T11 marking the same staff+date twice updates ONE record (no duplicates) | PASS |
| 12 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T12 BVA stay time: check-out == check-in -> 0 minutes | PASS |
| 13 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T13 BVA stay time: 1 minute | PASS |
| 14 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T14 check-out BEFORE check-in never produces a negative stay time | PASS |
| 15 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T15 stay time is rounded to whole minutes | PASS |
| 16 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T16 unknown staff -> 404 | PASS |
| 17 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T17 staff of another business -> 404 | PASS |
| 18 | BB-ATT  Check-in / check-out  PATCH /register/:staffId TC-T18 records for different dates are independent | PASS |
| 19 | BB-ATT  Attendance status (Present / Absent / Leave / Off) TC-T19 manager can set status PRESENT | PASS |
| 20 | BB-ATT  Attendance status (Present / Absent / Leave / Off) TC-T19 manager can set status ABSENT | PASS |
| 21 | BB-ATT  Attendance status (Present / Absent / Leave / Off) TC-T19 manager can set status LEAVE | PASS |
| 22 | BB-ATT  Attendance status (Present / Absent / Leave / Off) TC-T19 manager can set status OFF | PASS |
| 23 | BB-ATT  Attendance status (Present / Absent / Leave / Off) TC-T20 status can be corrected afterwards | PASS |
| 24 | BB-ATT  Attendance status (Present / Absent / Leave / Off) TC-T21 an explicit status is kept when times are added later | PASS |
| 25 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T22 check-in 08:59 -> lateCheckIn=false | PASS |
| 26 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T22 check-in 09:00 -> lateCheckIn=false | PASS |
| 27 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T22 check-in 09:01 -> lateCheckIn=true | PASS |
| 28 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T22 check-in 09:15 -> lateCheckIn=true | PASS |
| 29 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T23 check-out 16:59 -> earlyCheckOut=true | PASS |
| 30 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T23 check-out 17:00 -> earlyCheckOut=false | PASS |
| 31 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T23 check-out 17:01 -> earlyCheckOut=false | PASS |
| 32 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T23 check-out 12:00 -> earlyCheckOut=true | PASS |
| 33 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T24 staff with NO schedule for that day is never late / early | PASS |
| 34 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T25 a day marked OFF has no working window -> not late / early | PASS |
| 35 | BB-ATT  Late check-in / early check-out (BVA around schedule 09:00-17:00) TC-T26 late AND early in the same request | PASS |
| 36 | BB-ATT  Today's summary  GET /summary TC-T27 staff with no record today count as ABSENT | PASS |
| 37 | BB-ATT  Today's summary  GET /summary TC-T28 counts every status and late / early totals | PASS |
| 38 | BB-ATT  Today's summary  GET /summary TC-T29 archived staff are excluded from the summary | PASS |
| 39 | BB-ATT  Today's summary  GET /summary TC-T30 summary is scoped to the caller's business | PASS |
| 40 | BB-ATT  Attendance history  GET /staff/:staffId/history TC-T31 returns the month's records in ascending date order with stay time | PASS |
| 41 | BB-ATT  Attendance history  GET /staff/:staffId/history TC-T32 BVA month edges: 1st and last day included, previous / next month excluded | PASS |
| 42 | BB-ATT  Attendance history  GET /staff/:staffId/history TC-T33 month with no records -> empty array | PASS |
| 43 | BB-ATT  Attendance history  GET /staff/:staffId/history TC-T34 no month given -> defaults to the current month (200) | PASS |
| 44 | BB-ATT  Attendance history  GET /staff/:staffId/history TC-T35 unknown staff -> 404 | PASS |
| 45 | BB-ATT  Attendance history  GET /staff/:staffId/history TC-T36 history of another business's staff -> 404 | PASS |
| 46 | BB-ATT  Access control TC-T37 get /summary without token -> 401 | PASS |
| 47 | BB-ATT  Access control TC-T37 get /register without token -> 401 | PASS |
| 48 | BB-ATT  Access control TC-T37 patch /register/x without token -> 401 | PASS |
| 49 | BB-ATT  Access control TC-T37 get /staff/x/history without token -> 401 | PASS |
| 50 | BB-ATT  Access control TC-T38 Staff Attendance not purchased -> 403 with reason | PASS |
| 51 | BB-ATT  Access control TC-T39 buying ONLY Staff Directory does not unlock attendance | PASS |

### `tests/blackbox/staffDirectory.blackbox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | BB-STAFF  Invite / create staff  POST /staff TC-S01 invite with accountId -> 201, status PENDING, empty profile | PASS |
| 2 | BB-STAFF  Invite / create staff  POST /staff TC-S02 missing accountId -> 400 | PASS |
| 3 | BB-STAFF  Invite / create staff  POST /staff TC-S02 empty accountId -> 400 | PASS |
| 4 | BB-STAFF  Invite / create staff  POST /staff TC-S02 null accountId -> 400 | PASS |
| 5 | BB-STAFF  Invite / create staff  POST /staff TC-S03 staff is created inside the caller's business only | PASS |
| 6 | BB-STAFF  List / search / filter  GET /staff TC-S04 default list excludes archived staff, newest first | PASS |
| 7 | BB-STAFF  List / search / filter  GET /staff TC-S05 list item exposes id, name, title, employmentType, status, responsibilitiesCount | PASS |
| 8 | BB-STAFF  List / search / filter  GET /staff TC-S06 search first name (case-insensitive) | PASS |
| 9 | BB-STAFF  List / search / filter  GET /staff TC-S06 search last name | PASS |
| 10 | BB-STAFF  List / search / filter  GET /staff TC-S06 search by account id | PASS |
| 11 | BB-STAFF  List / search / filter  GET /staff TC-S06 search with no match | PASS |
| 12 | BB-STAFF  List / search / filter  GET /staff TC-S06 filter title (partial) | PASS |
| 13 | BB-STAFF  List / search / filter  GET /staff TC-S06 filter status | PASS |
| 14 | BB-STAFF  List / search / filter  GET /staff TC-S06 filter employment type | PASS |
| 15 | BB-STAFF  List / search / filter  GET /staff TC-S06 filter responsibility | PASS |
| 16 | BB-STAFF  List / search / filter  GET /staff TC-S06 archived=true shows only archived | PASS |
| 17 | BB-STAFF  List / search / filter  GET /staff TC-S06 combined filters (AND) | PASS |
| 18 | BB-STAFF  List / search / filter  GET /staff TC-S07 staff of another business are never returned (tenant isolation) | PASS |
| 19 | BB-STAFF  View profile  GET /staff/:id TC-S08 existing id -> 200 full detail incl. schedule + responsibility defaults | PASS |
| 20 | BB-STAFF  View profile  GET /staff/:id TC-S09 unknown id -> 404 | PASS |
| 21 | BB-STAFF  View profile  GET /staff/:id TC-S10 staff that belongs to another business -> 404 (not 403, no existence leak) | PASS |
| 22 | BB-STAFF  Update profile  PATCH /staff/:id TC-S11 update general + professional details (PENDING -> ACTIVE) | PASS |
| 23 | BB-STAFF  Update profile  PATCH /staff/:id TC-S12 dates are accepted as ISO strings | PASS |
| 24 | BB-STAFF  Update profile  PATCH /staff/:id TC-S13 BVA yearsOfExperience = 0 is stored (falsy but valid) | PASS |
| 25 | BB-STAFF  Update profile  PATCH /staff/:id TC-S14 partial update leaves other fields untouched | PASS |
| 26 | BB-STAFF  Update profile  PATCH /staff/:id TC-S15 empty body is a no-op -> 200, unchanged | PASS |
| 27 | BB-STAFF  Update profile  PATCH /staff/:id TC-S16 protected fields (id, businessId, accountId) cannot be changed | PASS |
| 28 | BB-STAFF  Update profile  PATCH /staff/:id TC-S17 unknown id -> 404 | PASS |
| 29 | BB-STAFF  Update profile  PATCH /staff/:id TC-S18 cannot update staff of another business -> 404 | PASS |
| 30 | BB-STAFF  Working schedule  (PATCH workingSchedule) TC-S19 set Mon-Fri 09:00-17:00 and a day off on Sat | PASS |
| 31 | BB-STAFF  Working schedule  (PATCH workingSchedule) TC-S20 a day may have several windows (split shift) | PASS |
| 32 | BB-STAFF  Working schedule  (PATCH workingSchedule) TC-S21 saving a new schedule REPLACES the old one | PASS |
| 33 | BB-STAFF  Working schedule  (PATCH workingSchedule) TC-S22 empty schedule array clears the schedule | PASS |
| 34 | BB-STAFF  Assign responsibility TC-S23 work-responsibility checklist is saved and counted | PASS |
| 35 | BB-STAFF  Assign responsibility TC-S24 updating the checklist again changes the existing row (upsert) | PASS |
| 36 | BB-STAFF  Assign responsibility TC-S25 workspace/resource responsibilities are IGNORED when Resource Directory is not purchased | PASS |
| 37 | BB-STAFF  Assign responsibility TC-S26 workspace/resource responsibilities are saved when Resource Directory IS purchased | PASS |
| 38 | BB-STAFF  Assign responsibility TC-S27 empty id arrays clear previously assigned responsibilities | PASS |
| 39 | BB-STAFF  Archive, delete and summary TC-S28 archive hides a member from the default list; unarchive restores | PASS |
| 40 | BB-STAFF  Archive, delete and summary TC-S29 delete -> 204, then GET -> 404 | PASS |
| 41 | BB-STAFF  Archive, delete and summary TC-S30 delete unknown id -> 404; delete twice -> 404 the second time | PASS |
| 42 | BB-STAFF  Archive, delete and summary TC-S31 cannot delete staff of another business -> 404 and record survives | PASS |
| 43 | BB-STAFF  Archive, delete and summary TC-S32 summary: totalStaff excludes archived, pendingInvitations counts PENDING | PASS |
| 44 | BB-STAFF  Archive, delete and summary TC-S33 summary of an empty business is zeros | PASS |
| 45 | BB-STAFF  Access control TC-S34 get /summary without token -> 401 | PASS |
| 46 | BB-STAFF  Access control TC-S34 get /staff without token -> 401 | PASS |
| 47 | BB-STAFF  Access control TC-S34 post /staff without token -> 401 | PASS |
| 48 | BB-STAFF  Access control TC-S34 get /staff/x without token -> 401 | PASS |
| 49 | BB-STAFF  Access control TC-S34 patch /staff/x without token -> 401 | PASS |
| 50 | BB-STAFF  Access control TC-S34 delete /staff/x without token -> 401 | PASS |
| 51 | BB-STAFF  Access control TC-S35 business without the Staff Directory flag -> 403 on every route | PASS |
| 52 | BB-STAFF  Access control TC-S36 second tenant with the flag enabled sees an empty directory (no cross-over) | PASS |

## White-box tests


### `tests/whitebox/attendanceHelpers.whitebox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-20 -> SUN | PASS |
| 2 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-21 -> MON | PASS |
| 3 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-22 -> TUE | PASS |
| 4 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-23 -> WED | PASS |
| 5 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-24 -> THU | PASS |
| 6 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-25 -> FRI | PASS |
| 7 | WB-ATT  dayOfWeekForDate — all 7 array indexes 2026-09-26 -> SAT | PASS |
| 8 | WB-ATT  startOfDay — both branches of the ternary with a date string -> that day at 00:00:00.000 | PASS |
| 9 | WB-ATT  startOfDay — both branches of the ternary without an argument -> today at 00:00:00.000 | PASS |
| 10 | WB-ATT  startOfDay — both branches of the ternary returns a NEW Date each call (no shared mutable state) | PASS |
| 11 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max no checkIn -> null | PASS |
| 12 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max no checkOut -> null | PASS |
| 13 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max neither -> null | PASS |
| 14 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max positive duration | PASS |
| 15 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max negative duration clamps to 0 (Math.max branch) | PASS |
| 16 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max rounds 29 s down / 30 s up | PASS |
| 17 | WB-ATT  stayTimeMinutes — branches of (!checkIn \|\| !checkOut) and Math.max accepts Date objects and ISO strings interchangeably | PASS |
| 18 | WB-ATT  computeLateEarly — condition coverage C1 no working window -> both false, regardless of times (early return) | PASS |
| 19 | WB-ATT  computeLateEarly — condition coverage C2 checkIn absent -> lateCheckIn false (falsy branch of the ternary) | PASS |
| 20 | WB-ATT  computeLateEarly — condition coverage C3 checkOut absent -> earlyCheckOut false | PASS |
| 21 | WB-ATT  computeLateEarly — condition coverage C4 late only | PASS |
| 22 | WB-ATT  computeLateEarly — condition coverage C5 early only | PASS |
| 23 | WB-ATT  computeLateEarly — condition coverage C6 late and early | PASS |
| 24 | WB-ATT  computeLateEarly — condition coverage C7 on time both ends -> neither | PASS |
| 25 | WB-ATT  computeLateEarly — condition coverage C8 zero-padding in formatTime: 9:05 is "09:05" and compares correctly with "09:00" | PASS |
| 26 | WB-ATT  computeLateEarly — condition coverage C9 only the FIRST window of the day is consulted (documents current behaviour, see DEF-03) | PASS |

### `tests/whitebox/entitlements.whitebox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | WB-ENT  resolveModuleAccess — basis paths P01 flags === null/undefined -> not-purchased (guard clause) | PASS |
| 2 | WB-ENT  resolveModuleAccess — basis paths P02/P03 simple flag staffDirectory: true -> allowed, false -> not-purchased | PASS |
| 3 | WB-ENT  resolveModuleAccess — basis paths P02/P03 simple flag staffAttendance: true -> allowed, false -> not-purchased | PASS |
| 4 | WB-ENT  resolveModuleAccess — basis paths P02/P03 simple flag resourceDirectory: true -> allowed, false -> not-purchased | PASS |
| 5 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING (3 paths) P04 own flag off -> not-purchased | PASS |
| 6 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING (3 paths) P05 prerequisite directory missing -> requires-staff-and-resource-directory (condition coverage of the \|\|) | PASS |
| 7 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING (3 paths) P05 prerequisite resource directory missing -> requires-staff-and-resource-directory (condition coverage of the \|\|) | PASS |
| 8 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING (3 paths) P05 prerequisite both missing -> requires-staff-and-resource-directory (condition coverage of the \|\|) | PASS |
| 9 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING (3 paths) P06 own flag + both prerequisites -> allowed | PASS |
| 10 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING_PREMIUM (3 paths, recursive) P07 base module blocked -> returns the base reason unchanged | PASS |
| 11 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING_PREMIUM (3 paths, recursive) P08 base allowed, premium flag off -> not-purchased | PASS |
| 12 | WB-ENT  resolveModuleAccess — basis paths OPERATIONAL_SCHEDULING_PREMIUM (3 paths, recursive) P09 base allowed + premium on -> allowed | PASS |
| 13 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P10 own flag off -> not-purchased | PASS |
| 14 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P11-P16 model=B2C verification=ENHANCED -> allowed=true | PASS |
| 15 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P11-P16 model=B2C verification=BASIC -> allowed=false | PASS |
| 16 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P11-P16 model=BOTH verification=ENHANCED -> allowed=true | PASS |
| 17 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P11-P16 model=BOTH verification=BASIC -> allowed=false | PASS |
| 18 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P11-P16 model=INTERNAL verification=BASIC -> allowed=true | PASS |
| 19 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P11-P16 model=INTERNAL verification=ENHANCED -> allowed=true | PASS |
| 20 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P17 INTERNAL path with an unknown verification level -> requires-enhanced-verification | PASS |
| 21 | WB-ENT  resolveModuleAccess — basis paths STAFF_RECRUITMENT (verification-level matrix) P18 business undefined (optional chaining) -> falls to INTERNAL branch, denied | PASS |
| 22 | WB-ENT  resolveModuleAccess — basis paths P19 unknown module key -> unknown-module | PASS |
| 23 | WB-ENT  frontend <-> backend parity both copies return identical results for every flag combination | PASS |

### `tests/whitebox/knownDefects.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | DEF  Staff Attendance DEF-01 late flag must survive a later check-out-only update (lateCheckIn is recomputed from an undefined checkIn and reset to false) | XFAIL (known defect) |
| 2 | DEF  Staff Attendance DEF-02 (mirror) early flag must survive a later check-in-only update | XFAIL (known defect) |
| 3 | DEF  Staff Attendance DEF-03 split shift: leaving at 15:00 during the 14:00-18:00 window is an early check-out (code compares only against the FIRST window end 13:00) | XFAIL (known defect) |
| 4 | DEF  Staff Attendance DEF-04 invalid ?date must be rejected with 400 (currently RangeError -> 500) | XFAIL (known defect) |
| 5 | DEF  Staff Attendance DEF-05 register date must echo the requested calendar day in non-UTC servers (Asia/Kolkata gives the previous day) | XFAIL (known defect) |
| 6 | DEF  Staff Attendance DEF-06 an unknown attendance status must be rejected with 400 (fake DB stores it; real Prisma enum would surface a 500) | XFAIL (known defect) |
| 7 | DEF  Staff Directory / role & entitlement rules from the spec DEF-07 spec §5 "Holder role: Staff Manager" — an account with role STAFF must not be able to delete staff | XFAIL (known defect) |
| 8 | DEF  Staff Directory / role & entitlement rules from the spec DEF-08 spec §7 "Holder role: Attendance Manager" — an account with role STAFF must not be able to edit attendance | XFAIL (known defect) |
| 9 | DEF  Staff Directory / role & entitlement rules from the spec DEF-09 spec §5 Work-Responsibility checklist is subscription-gated — "Staff Recruitment" must not be assignable when staff_recruitment is not purchased | XFAIL (known defect) |
| 10 | DEF  Staff Directory / role & entitlement rules from the spec DEF-10 the same account_id should not be invitable twice in one business | XFAIL (known defect) |

### `tests/whitebox/middleware.whitebox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | WB-MW  requireAuth — every branch B1 no Authorization header -> 401 "Missing bearer token", next NOT called | PASS |
| 2 | WB-MW  requireAuth — every branch B2 header present but not "Bearer " prefix -> treated as missing | PASS |
| 3 | WB-MW  requireAuth — every branch B3 jwt.verify throws -> 401 "Invalid or expired token" | PASS |
| 4 | WB-MW  requireAuth — every branch B4 valid JWT but account row missing -> 401 "Account no longer exists" | PASS |
| 5 | WB-MW  requireAuth — every branch B5 success -> req.account + req.businessId populated, next() called once with no args | PASS |
| 6 | WB-MW  requireAuth — every branch B6 the JWT payload carries only accountId (no role / flags baked into the token) | PASS |
| 7 | WB-MW  requireAuth — every branch B7 a database failure is forwarded to Express error middleware via next(err) | PASS |
| 8 | WB-MW  requireFlag — every branch B1 business not found -> 404 | PASS |
| 9 | WB-MW  requireFlag — every branch B2 flag denied with a known reason -> 403 + mapped message + reason | PASS |
| 10 | WB-MW  requireFlag — every branch B3 operationalScheduling -> reason-specific message | PASS |
| 11 | WB-MW  requireFlag — every branch B3 staffRecruitment -> reason-specific message | PASS |
| 12 | WB-MW  requireFlag — every branch B4 unknown reason falls back to the generic "Access denied" message | PASS |
| 13 | WB-MW  requireFlag — every branch B5 allowed -> req.business & req.flags attached, next() called | PASS |
| 14 | WB-MW  asyncHandler resolves normally -> next not called | PASS |
| 15 | WB-MW  asyncHandler rejection is passed to next(err) | PASS |

### `tests/whitebox/paths.whitebox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P1 not found -> early return, nothing written | PASS |
| 2 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P2 empty body -> Object.keys(data).length === 0 branch: tx.staff.update is skipped | PASS |
| 3 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P3 scalar fields -> tx.staff.update called exactly once with ONLY whitelisted keys | PASS |
| 4 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P4 dateOfBirth / dateOfJoining truthy -> converted to Date objects before saving | PASS |
| 5 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P4b dateOfBirth explicitly null -> falsy branch: stored as null (not converted to epoch) | PASS |
| 6 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P5 all child updates happen inside ONE $transaction (atomicity) | PASS |
| 7 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P6 schedule: isOff day -> ONE row with isOff=true and no times (true side of the ternary) | PASS |
| 8 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P7 schedule: working day -> one row PER window (false side of the ternary, flatMap) | PASS |
| 9 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P8 schedule: working day with zero windows and empty array -> rows.length === 0 branch: createMany skipped | PASS |
| 10 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P9 workingSchedule omitted -> existing schedule is NOT deleted | PASS |
| 11 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P10 workResponsibility: first call -> upsert CREATE path, second call -> UPDATE path | PASS |
| 12 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P11 flag OFF, ids sent  (condition coverage of `flags.resourceDirectory && ids`) | PASS |
| 13 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P11 flag ON, ids omitted  (condition coverage of `flags.resourceDirectory && ids`) | PASS |
| 14 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P11 flag ON, empty arrays (delete, no create)  (condition coverage of `flags.resourceDirectory && ids`) | PASS |
| 15 | WB-PATH  PATCH /staff-directory/staff/:id  (cyclomatic complexity ≈ 14) P11 flag ON, non-empty arrays  (condition coverage of `flags.resourceDirectory && ids`) | PASS |
| 16 | WB-PATH  GET /staff-directory/staff  (each optional spread is a branch) no query -> where contains only businessId + archived:false | PASS |
| 17 | WB-PATH  GET /staff-directory/staff  (each optional spread is a branch) all query params -> every spread clause is present | PASS |
| 18 | WB-PATH  GET /staff-directory/staff  (each optional spread is a branch) archived=anything-but-"true" is treated as false | PASS |
| 19 | WB-PATH  GET /staff-directory/staff  (each optional spread is a branch) businessId in the query string cannot override the tenant scope | PASS |
| 20 | WB-PATH  PATCH /staff-attendance/register/:staffId create branch: status defaults to PRESENT when body.status is undefined (?? branch) | PASS |
| 21 | WB-PATH  PATCH /staff-attendance/register/:staffId create branch: null checkIn / checkOut stored as null, not as a Date | PASS |
| 22 | WB-PATH  PATCH /staff-attendance/register/:staffId update branch: `checkIn !== undefined` guard — omitted key keeps the stored value | PASS |
| 23 | WB-PATH  PATCH /staff-attendance/register/:staffId update branch: explicit null clears a previously stored checkOut | PASS |
| 24 | WB-PATH  PATCH /staff-attendance/register/:staffId update branch: explicit null clears a previously stored checkIn | PASS |
| 25 | WB-PATH  PATCH /staff-attendance/register/:staffId register row: invited staff without a name -> name is null (\|\| null branch) | PASS |
| 26 | WB-PATH  PATCH /staff-attendance/register/:staffId update branch: falsy status is ignored (`...(status && {status})`) | PASS |
| 27 | WB-PATH  PATCH /staff-attendance/register/:staffId record is always stored with the caller's businessId | PASS |
| 28 | WB-PATH  PATCH /staff-attendance/register/:staffId schedule lookup uses ONLY isOff:false windows of that weekday, ordered by startTime | PASS |
| 29 | WB-PATH  GET /staff-attendance/staff/:id/history — month arithmetic builds [start, end) with end = start + 1 month (incl. December -> January rollover) | PASS |

### `tests/whitebox/staffHelpers.whitebox.test.js`

| # | Test case | Result |
|---|---|---|
| 1 | WB-STAFF  serializeStaffListItem.name first + last | PASS |
| 2 | WB-STAFF  serializeStaffListItem.name first only | PASS |
| 3 | WB-STAFF  serializeStaffListItem.name last only | PASS |
| 4 | WB-STAFF  serializeStaffListItem.name neither (invited, not yet filled) -> null | PASS |
| 5 | WB-STAFF  serializeStaffListItem.name empty strings -> null | PASS |
| 6 | WB-STAFF  responsibilitiesCount — every term of the sum no workResponsibility row and no lists -> 0 (undefined lists hit the ?? 0 branches) | PASS |
| 7 | WB-STAFF  responsibilitiesCount — every term of the sum workResponsibility with 0 / 1 / 2 / 3 true flags | PASS |
| 8 | WB-STAFF  responsibilitiesCount — every term of the sum adds workspace and resource responsibilities | PASS |
| 9 | WB-STAFF  responsibilitiesCount — every term of the sum sums all three sources | PASS |
| 10 | WB-STAFF  serializeStaffDetail null workResponsibility -> all-false default object (?? branch) | PASS |
| 11 | WB-STAFF  serializeStaffDetail flattens workspace / resource relations to {id,name} | PASS |
| 12 | WB-STAFF  serializeStaffDetail includes every list-item field plus the detail fields | PASS |
| 13 | WB-STAFF  serializeStaffDetail never exposes businessId (internal tenant key) | PASS |
| 14 | WB-STAFF  serializeStaffDetail STAFF_DETAIL_INCLUDE requests all four relations | PASS |
