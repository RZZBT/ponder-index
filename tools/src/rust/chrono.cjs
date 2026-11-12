// chrono: 14 animations (#58-71). Dates are NaiveDate (no time zone).
const { pick, cells, lines } = require('./scene.cjs');
const R = String.raw;
const A = [];
const add = (key, title, description, build, rs, expect, claim) => A.push({ key, title, description, build, rs, expect, claim });
const D = (y, m, d) => `NaiveDate::from_ymd_opt(${y}, ${m}, ${d}).unwrap()`;

add('from-ymd-opt', 'How NaiveDate::from_ymd_opt() works', 'Builds a date from year, month and day; impossible dates give None.', () => lines({
  call: 'NaiveDate::from_ymd_opt(2024, 2, 29)  and  (2024, 2, 30)', note: 'Option: Some(date) or None for a date that does not exist',
  lines: ['2024 is divisible by 4 → leap year', 'February 2024 has 29 days', '(2024, 2, 29) → day 29 ≤ 29 → Some(2024-02-29)', '(2024, 2, 30) → day 30 > 29 → None'],
  intro: 'from_ymd_opt() checks that the month is 1 to 12 and that the day exists in that month of that year.',
  steps: [
    { cap: 'Leap years: divisible by 4, except century years, which must be divisible by 400 (2000 was a leap year, 1900 was not). 2024 is a leap year.', show: [0] },
    { cap: 'So February 2024 has 29 days.', show: [1] },
    { cap: 'Day 29 exists: the result is Some(2024-02-29).', show: [2] },
    { cap: 'Day 30 does not exist in February, so the result is None instead of a panic or a silently corrected date.', show: [3] },
  ],
  result: 'Some(2024-02-29) / None', resultCap: 'Use from_ymd_opt() with user input and handle None. from_ymd() (no _opt) panics on bad dates and is deprecated.',
}), 'format!("{:?} / {:?}", NaiveDate::from_ymd_opt(2024, 2, 29), NaiveDate::from_ymd_opt(2024, 2, 30))', 'Some(2024-02-29) / None');

add('parse-from-str', 'How NaiveDate::parse_from_str() works', 'Reads a date from text using a format string.', () => cells({
  call: 'NaiveDate::parse_from_str("15/03/2024", "%d/%m/%Y")', note: '%d = day, %m = month, %Y = 4-digit year', text: '15/03/2024', outs: ['day 15', 'month 3', 'year 2024'],
  intro: 'parse_from_str() walks the text and the format side by side. %-codes read a field; other characters must appear exactly.',
  steps: [
    { cap: '%d reads the day: 15.', mark: [[0, 2, 'warning']], out: [0], eq: '%d → 15' },
    { cap: 'The / in the format must match a / in the text. It does.', mark: [[2, 3, 'muted']], eq: '/ = /' },
    { cap: '%m reads the month: 03, which is 3.', mark: [[3, 5, 'accent2']], out: [1], eq: '%m → 3' },
    { cap: 'Another /, then %Y reads the year: 2024. The date is checked like from_ymd_opt().', mark: [[5, 6, 'muted'], [6, 10, 'success']], out: [2], eq: '%Y → 2024' },
  ],
  result: 'Ok(2024-03-15)', resultCap: 'The result is Ok(2024-03-15). Text that does not fit the format, like "2024-03-15", gives Err(ParseError).',
}), 'd(NaiveDate::parse_from_str("15/03/2024", "%d/%m/%Y"))', 'Ok(2024-03-15)');

add('format', 'How NaiveDate::format() works', 'Writes a date as text using a format string.', () => pick({
  call: 'date.format("%A %d %B %Y").to_string()', note: 'date = 2024-03-15', rows: [['%A', '%d', '%B', '%Y']], rowFills: ['surface'], outs: ['Friday', '15', 'March', '2024'],
  intro: 'format() replaces every %-code with part of the date. Other characters, here the spaces, are copied as they are.',
  steps: [
    { cap: '%A is the full weekday name: 2024-03-15 is a Friday.', src: ['a0'], out: [0] },
    { cap: '%d is the day of the month with 2 digits: 15.', src: ['a1'], out: [1] },
    { cap: '%B is the full month name: March.', src: ['a2'], out: [2] },
    { cap: '%Y is the year: 2024.', src: ['a3'], out: [3] },
  ],
  result: '"Friday 15 March 2024"', resultCap: 'format() returns a DelayedFormat; to_string() (or {} in format!) produces "Friday 15 March 2024". Names are in English.',
}), `${D(2024, 3, 15)}.format("%A %d %B %Y").to_string()`, 'Friday 15 March 2024');

add('checked-add-days', 'How NaiveDate::checked_add_days() works', 'Adds a number of days and moves into the next month when needed.', () => pick({
  call: 'date.checked_add_days(Days::new(3))', note: 'date = 2024-01-30', rows: [['Jan 30', 'Jan 31', 'Feb 1', 'Feb 2']],
  intro: 'checked_add_days() counts forward one calendar day at a time. January has 31 days.',
  steps: [
    { cap: 'Start at January 30.', src: ['a0'] },
    { cap: '+1: January 31, the last day of January.', src: ['a1'], eq: '+1' },
    { cap: '+2: there is no January 32, so the month changes: February 1.', src: ['a2'], eq: '+2' },
    { cap: '+3: February 2.', src: ['a3'], mark: { success: ['a3'] }, eq: '+3' },
  ],
  result: 'Some(2024-02-02)', resultCap: 'The result is Some(2024-02-02). It is None only if the date would leave chrono\'s range (about ±262,000 years).',
}), `d(${D(2024, 1, 30)}.checked_add_days(Days::new(3)))`, 'Some(2024-02-02)');

add('checked-sub-days', 'How NaiveDate::checked_sub_days() works', 'Subtracts days and moves into the previous month when needed.', () => pick({
  call: 'date.checked_sub_days(Days::new(1))', note: 'date = 2024-03-01', rows: [['Feb 28', 'Feb 29', 'Mar 1']],
  intro: 'checked_sub_days() counts back. The day before the 1st of a month is the last day of the previous month.',
  steps: [
    { cap: 'Start at March 1.', src: ['a2'] },
    { cap: 'One day back leaves March. February 2024 has 29 days (leap year), so the day before is February 29.', src: ['a1'], mark: { success: ['a1'] }, eq: '−1 → Feb 29' },
    { cap: 'In 2023, not a leap year, the same step would give February 28.', mark: { dim: ['a0'] }, eq: '2023-03-01 − 1 day → 2023-02-28' },
  ],
  result: 'Some(2024-02-29)', resultCap: 'The result is Some(2024-02-29). The calendar decides; you never have to know how long a month is.',
}), `d(${D(2024, 3, 1)}.checked_sub_days(Days::new(1)))`, 'Some(2024-02-29)');

add('checked-add-months', 'How NaiveDate::checked_add_months() works', 'Adds months; a day that does not exist is clamped to the end of the month.', () => lines({
  call: 'date.checked_add_months(Months::new(1))', note: 'date = 2024-01-31',
  lines: ['2024-01-31 + 1 month', '→ month 2, day 31: 2024-02-31?', 'February 2024 has only 29 days', '→ day clamped to 29: 2024-02-29'],
  intro: 'checked_add_months() changes the month number and keeps the day, if that day exists.',
  steps: [
    { cap: 'January + 1 month is February. The day would stay 31.', show: [0, 1] },
    { cap: 'But February 31 does not exist.', show: [2] },
    { cap: 'chrono clamps the day to the last day of the month instead of rolling over into March.', show: [3] },
    { cap: 'Clamping means the steps do not add up: 2024-01-31 + 1 month + 1 month is 2024-03-29, but + 2 months is 2024-03-31.', set: {} },
  ],
  result: 'Some(2024-02-29)', resultCap: 'The result is Some(2024-02-29). Use checked_add_days() when you need an exact number of days instead.',
}), `d(${D(2024, 1, 31)}.checked_add_months(Months::new(1)))`, 'Some(2024-02-29)');

add('signed-duration-since', 'How NaiveDate::signed_duration_since() works', 'The time between two dates, as a TimeDelta.', () => lines({
  call: 'mar1.signed_duration_since(feb1).num_days()', note: 'mar1 = 2024-03-01, feb1 = 2024-02-01',
  lines: ['2024-03-01 − 2024-02-01', '= all the days of February 2024', '= 29 days (leap year)', 'feb1.signed_duration_since(mar1) → −29 days'],
  intro: 'signed_duration_since() subtracts the argument from self and returns a TimeDelta (called Duration in older versions).',
  steps: [
    { cap: 'From February 1 to March 1 is exactly the length of February.', show: [0, 1] },
    { cap: 'February 2024 has 29 days, so the difference is 29 days. num_days() reads that as a number.', show: [2] },
    { cap: '"Signed" means the order matters: the other way round gives −29 days.', show: [3] },
  ],
  result: '29 days', resultCap: 'mar1 − feb1 = 29 days. The - operator does the same: (mar1 - feb1).num_days() is 29.',
}), `format!("{} days", ${D(2024, 3, 1)}.signed_duration_since(${D(2024, 2, 1)}).num_days())`, '29 days');

add('weekday', 'How Datelike::weekday() works', 'Gives the day of the week of a date.', () => pick({
  call: 'date.weekday()', note: 'date = 2024-03-15', rows: [['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']], rowFills: ['surface'],
  intro: 'weekday() comes from the Datelike trait (use chrono::Datelike). It returns a Weekday value.',
  steps: [
    { cap: 'chrono stores enough about each year to know which weekday its days fall on, so no counting from a fixed date is needed.', eq: 'year 2024 + day of the year' },
    { cap: '2024-03-15 falls on a Friday.', src: ['a4'], mark: { success: ['a4'] }, eq: 'Weekday::Fri' },
    { cap: 'Weekday has helpers: number_from_monday() is 5, num_days_from_sunday() is 5, succ() is Sat.', eq: 'number_from_monday() = 5' },
  ],
  result: 'Fri', resultCap: 'date.weekday() is Weekday::Fri; it prints as "Fri". Weeks start on Monday in chrono.',
}), `d(${D(2024, 3, 15)}.weekday())`, 'Fri');

add('ordinal', 'How Datelike::ordinal() works', 'The day of the year, from 1 to 365 (or 366).', () => lines({
  call: 'date.ordinal()', note: 'date = 2024-03-01',
  lines: ['January: 31 days', 'February 2024: 29 days', 'March 1: day 1 of March', '31 + 29 + 1 = 61'],
  intro: 'ordinal() counts the days from January 1 (day 1) up to the date.',
  steps: [
    { cap: 'All of January comes before the date: 31 days.', show: [0] },
    { cap: 'All of February: 29 days, because 2024 is a leap year.', show: [1] },
    { cap: 'Then March 1 itself.', show: [2] },
    { cap: 'Added up: 61. In 2023 the same date would be day 60.', show: [3] },
  ],
  result: '61', resultCap: 'ordinal() is 61 (1-based); ordinal0() is 60. Datelike is the trait; NaiveDate implements it.',
}), `d(${D(2024, 3, 1)}.ordinal())`, '61');

add('iso-week', 'How Datelike::iso_week() works', 'The ISO 8601 week number; a date can belong to a week of the next year.', () => pick({
  call: 'date.iso_week()', note: 'date = 2024-12-30, a Monday', rows: [['Mon 30', 'Tue 31', 'Wed 1', 'Thu 2', 'Fri 3', 'Sat 4', 'Sun 5']],
  intro: 'ISO weeks run Monday to Sunday. Week 1 of a year is the week that holds that year\'s first Thursday.',
  steps: [
    { cap: 'The week that starts on Monday 30 December 2024 runs until Sunday 5 January 2025.', src: ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'] },
    { cap: 'Its Thursday is 2 January 2025, so this whole week is week 1 of 2025.', src: ['a3'], mark: { warning: ['a3'] }, eq: 'first Thursday of 2025' },
    { cap: 'So 30 December 2024 is in week 1 of 2025, even though its calendar year is 2024.', src: ['a0'], mark: { success: ['a0'] }, eq: 'ISO year 2025, week 1' },
  ],
  result: 'week 1 of 2025', resultCap: 'iso_week() returns an IsoWeek; .week() is 1 and .year() is 2025. Use .year() from the IsoWeek, not date.year(), for week-based reports.',
}), `let w = ${D(2024, 12, 30)}.iso_week(); format!("week {} of {}", w.week(), w.year())`, 'week 1 of 2025');

add('succ-opt', 'How NaiveDate::succ_opt() works', 'The next day.', () => pick({
  call: 'date.succ_opt()', note: 'date = 2024-02-28', rows: [['Feb 27', 'Feb 28', 'Feb 29', 'Mar 1']],
  intro: 'succ_opt() gives the following day ("successor"). pred_opt() gives the day before.',
  steps: [
    { cap: 'Start at February 28.', src: ['a1'] },
    { cap: '2024 is a leap year, so February has a 29th day: that is the next day.', src: ['a2'], mark: { success: ['a2'] }, eq: 'Feb 28 → Feb 29' },
    { cap: 'In 2023, the next day after February 28 would be March 1.', mark: { dim: ['a3'] }, eq: '2023-02-28 → 2023-03-01' },
  ],
  result: 'Some(2024-02-29)', resultCap: 'succ_opt() is Some(2024-02-29). It is None only at the very last date chrono can represent.',
}), `d(${D(2024, 2, 28)}.succ_opt())`, 'Some(2024-02-29)');

add('iter-days', 'How NaiveDate::iter_days() works', 'An endless iterator over the following days, starting with the date itself.', () => pick({
  call: 'date.iter_days().take(4)', note: 'date = 2024-02-27', rows: [['2024-02-27']], outs: ['2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01'],
  intro: 'iter_days() yields the date, then the day after, and so on, forever. take(4) stops after 4 dates.',
  steps: [
    { cap: 'The first item is the start date itself.', src: ['a0'], out: [0] },
    { cap: 'Then February 28.', out: [1] },
    { cap: 'Then February 29: the iterator knows 2024 is a leap year.', out: [2] },
    { cap: 'Then March 1. take(4) has its 4 items, so iteration stops.', out: [3] },
  ],
  result: '2024-02-27, 2024-02-28, 2024-02-29, 2024-03-01', resultCap: 'Without take() the loop would only stop at the end of chrono\'s range. iter_weeks() steps by 7 days.',
}), `j(${D(2024, 2, 27)}.iter_days().take(4))`, '2024-02-27, 2024-02-28, 2024-02-29, 2024-03-01');

add('time-from-hms-opt', 'How NaiveTime::from_hms_opt() works', 'Builds a time of day; impossible times give None.', () => lines({
  call: 'NaiveTime::from_hms_opt(14, 30, 0)  and  (25, 0, 0)', note: 'hour 0–23, minute 0–59, second 0–59',
  lines: ['(14, 30, 0): hour 14 ≤ 23, minute 30 ≤ 59, second 0', '→ Some(14:30:00)', '(25, 0, 0): hour 25 > 23', '→ None'],
  intro: 'from_hms_opt() checks each part of the time before building it.',
  steps: [
    { cap: 'Every part is in range.', show: [0] },
    { cap: 'So the result is Some(14:30:00), half past two in the afternoon.', show: [1] },
    { cap: 'A day has hours 0 to 23. 25 is out of range.', show: [2] },
    { cap: 'The result is None. It does not wrap around to 01:00 of the next day.', show: [3] },
  ],
  result: 'Some(14:30:00) / None', resultCap: 'NaiveTime has no date and no time zone. Combine it with a date using date.and_time(t) or and_hms_opt().',
}), 'format!("{:?} / {:?}", NaiveTime::from_hms_opt(14, 30, 0), NaiveTime::from_hms_opt(25, 0, 0))', 'Some(14:30:00) / None', null);

add('and-hms-opt', 'How NaiveDate::and_hms_opt() works', 'Combines a date with a time of day into a NaiveDateTime.', () => pick({
  call: 'date.and_hms_opt(14, 30, 0)', note: 'date = 2024-03-15', rows: [['2024-03-15'], ['14:30:00']], outs: ['2024-03-15 14:30:00'],
  intro: 'and_hms_opt() checks the time like NaiveTime::from_hms_opt() and attaches it to the date.',
  steps: [
    { cap: 'The date part: 15 March 2024.', src: ['a0'] },
    { cap: 'The time part: 14:30:00 is valid.', src: ['b0'] },
    { cap: 'Together they make a NaiveDateTime: a date and a time, still without a time zone.', src: ['a0', 'b0'], out: [0] },
  ],
  result: 'Some(2024-03-15 14:30:00)', resultCap: 'The result is Some(2024-03-15 14:30:00). To fix it to a time zone, use .and_utc() or a TimeZone such as Local.',
}), `format!("Some({})", ${D(2024, 3, 15)}.and_hms_opt(14, 30, 0).unwrap())`, 'Some(2024-03-15 14:30:00)');

module.exports = A;
