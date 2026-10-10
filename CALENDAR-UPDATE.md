# MeowTools — Custom Neon Calendar Update

This update replaces native browser date/date-time popups with one shared custom glassmorphism calendar so the controls look consistent across tools and browsers.

## Included

- Neon pink/violet/cyan calendar popup with month navigation and a 42-cell month grid.
- Selected-date glow, current-day marker, Today and Clear actions.
- Keyboard Escape close, focus state, outside-click close, and viewport-aware above/below placement.
- Styled date-time picker with a time control for time-zone tools.
- Shared calendar runtime loaded on all 113 generated tool pages.
- Optional start-date field on EMI, home-loan EMI, car-loan EMI, personal-loan EMI and education-loan EMI calculators; the result includes the estimated final payment date when a start date is supplied.
- Existing direct navigation, dashboard, category pages, tool URLs and tool calculations preserved apart from adding the optional EMI date output.

## QA performed

- `node --check assets/app.js` — passed.
- `node --check assets/calendar.js` — passed.
- Browser interaction smoke test using Chromium: open calendar, render 42 days, select a date, month navigation, clear action, and date-time selection — passed with no page/console errors.
- Local relative links: 0 missing across 127 HTML pages.
- Calendar script included on all 113 tool pages.

This is not a claim that every tool on the full site has completed end-to-end testing. Please test each tool on the deployed GitHub Pages site before public launch.
