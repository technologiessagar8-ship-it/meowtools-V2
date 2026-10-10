/* MeowTools custom neon calendar — shared by all date and date/time tools. */
(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pad = n => String(n).padStart(2, '0');
  const today = () => new Date();
  const localParts = date => ({ y: date.getFullYear(), m: date.getMonth(), d: date.getDate(), h: date.getHours(), min: date.getMinutes() });
  const parseValue = (value, isDateTime) => {
    if (!value) return null;
    const re = isDateTime ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/ : /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = re.exec(value);
    if (!match) return null;
    return new Date(+match[1], +match[2] - 1, +match[3], isDateTime ? +match[4] : 12, isDateTime ? +match[5] : 0, 0, 0);
  };
  const dateValue = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dateTimeValue = date => `${dateValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const dateLabel = date => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  const monthLabel = date => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  const safeTimeNow = () => {
    const d = new Date();
    d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Also enhance native date fields on any page where a tool may add them directly.
  function enhanceNativeInputs() {
    $$('input[type="date"], input[type="datetime-local"]').forEach(input => {
      if (input.dataset.mtCalendarEnhanced === '1') return;
      const isDateTime = input.type === 'datetime-local';
      const originalValue = input.value;
      input.dataset.mtCalendarEnhanced = '1';
      input.type = 'hidden';
      input.classList.add('date-value');
      input.dataset.calendarValue = isDateTime ? 'datetime-local' : 'date';
      const shell = document.createElement('div');
      shell.className = 'date-control custom-date-control';
      shell.dataset.calendarWrap = input.id || `mt-date-${Math.random().toString(36).slice(2)}`;
      const icon = document.createElement('span');
      icon.className = 'date-leading-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = isDateTime ? clockSvg : calendarSvg;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'date-trigger';
      trigger.id = `${input.id || 'mt-date'}-trigger`;
      trigger.dataset.calendarTarget = input.id;
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = `<span data-date-label="${input.id}"></span><span class="date-end-icon" aria-hidden="true">${calendarSvg}</span>`;
      input.insertAdjacentElement('beforebegin', shell);
      shell.append(icon, input, trigger);
      if (originalValue) input.value = originalValue;
      const label = input.id ? $(`label[for="${CSS.escape(input.id)}"]`) : null;
      if (label) label.htmlFor = trigger.id;
    });
  }
  const calendarSvg = '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></svg>';
  const clockSvg = '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2M8 2.8l-2 2M16 2.8l2 2"/></svg>';

  enhanceNativeInputs();

  const pop = document.createElement('div');
  pop.className = 'mt-calendar-popover';
  pop.id = 'mt-calendar-popover';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Choose a date');
  pop.innerHTML = `
    <div class="mt-cal-topline"><span class="mt-cal-kicker"><span class="mt-cal-dot"></span> SELECT A DATE</span><span class="mt-cal-mini-brand">MEOWTOOLS</span></div>
    <div class="mt-cal-header"><button class="mt-cal-month-button" type="button" data-cal-prev aria-label="Previous month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><strong class="mt-cal-month-label" aria-live="polite"></strong><button class="mt-cal-month-button" type="button" data-cal-next aria-label="Next month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div>
    <div class="mt-cal-weekdays" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
    <div class="mt-cal-days" role="grid" aria-label="Calendar days"></div>
    <div class="mt-cal-time-row" hidden><span class="mt-cal-time-icon">◷</span><label for="mt-cal-time-input">Time</label><input id="mt-cal-time-input" type="time" value="09:00"></div>
    <div class="mt-cal-footer"><button type="button" class="mt-cal-today" data-cal-today>Today</button><button type="button" class="mt-cal-clear" data-cal-clear>Clear</button></div>
    <div class="mt-cal-footnote"><span>✦</span> Your date stays on this device</div>`;
  document.body.appendChild(pop);

  let activeInput = null;
  let activeTrigger = null;
  let activeDateTime = false;
  let viewYear = today().getFullYear();
  let viewMonth = today().getMonth();
  let chosenDate = null;
  const labelFor = id => $(`[data-date-label="${CSS.escape(id)}"]`);

  function setTriggerLabel(input) {
    const triggerLabel = labelFor(input.id);
    const button = $(`[data-calendar-target="${CSS.escape(input.id)}"]`);
    if (!triggerLabel || !button) return;
    const date = parseValue(input.value, input.dataset.calendarValue === 'datetime-local');
    triggerLabel.textContent = date ? `${dateLabel(date)}${input.dataset.calendarValue === 'datetime-local' ? ` · ${pad(date.getHours())}:${pad(date.getMinutes())}` : ''}` : (input.dataset.calendarValue === 'datetime-local' ? 'Choose date & time' : 'Choose a date');
    button.classList.toggle('has-value', !!date);
  }

  function fireChange(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    setTriggerLabel(input);
  }

  function writeDate(date, clear = false) {
    if (!activeInput) return;
    if (clear) {
      activeInput.value = '';
      chosenDate = null;
    } else {
      if (activeDateTime) {
        const time = $('#mt-cal-time-input').value || safeTimeNow();
        const [h, min] = time.split(':').map(Number);
        date.setHours(h || 0, min || 0, 0, 0);
        activeInput.value = dateTimeValue(date);
      } else {
        activeInput.value = dateValue(date);
      }
      chosenDate = date;
    }
    fireChange(activeInput);
  }

  function renderDays() {
    const grid = $('.mt-cal-days', pop);
    $('.mt-cal-month-label', pop).textContent = monthLabel(new Date(viewYear, viewMonth, 1));
    const first = new Date(viewYear, viewMonth, 1);
    const start = new Date(viewYear, viewMonth, 1 - first.getDay());
    const now = today();
    grid.innerHTML = '';
    for (let i = 0; i < 42; i++) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mt-cal-day';
      b.setAttribute('role', 'gridcell');
      b.textContent = day.getDate();
      b.dataset.calDate = dateValue(day);
      b.setAttribute('aria-label', dateLabel(day));
      if (day.getMonth() !== viewMonth) b.classList.add('is-outside');
      if (sameDay(day, now)) b.classList.add('is-today');
      if (sameDay(day, chosenDate)) {
        b.classList.add('is-selected');
        b.setAttribute('aria-selected', 'true');
      }
      b.addEventListener('click', () => {
        const [y, m, d] = b.dataset.calDate.split('-').map(Number);
        writeDate(new Date(y, m - 1, d, 12), false);
        closeCalendar();
      });
      grid.appendChild(b);
    }
  }

  function placePopover() {
    if (!activeTrigger || pop.hidden) return;
    const rect = activeTrigger.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(348, window.innerWidth - margin * 2);
    pop.style.width = `${width}px`;
    // Temporarily measure visible popover before choosing above/below placement.
    const height = pop.offsetHeight || 430;
    let left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - margin && rect.top - height - 8 > margin) top = rect.top - height - 8;
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.dataset.placement = top < rect.top ? 'above' : 'below';
  }

  function openCalendar(trigger) {
    const id = trigger.dataset.calendarTarget;
    const input = document.getElementById(id);
    if (!input) return;
    if (activeTrigger === trigger && !pop.hidden) { closeCalendar(); return; }
    closeCalendar();
    activeInput = input;
    activeTrigger = trigger;
    activeDateTime = input.dataset.calendarValue === 'datetime-local';
    chosenDate = parseValue(input.value, activeDateTime);
    const base = chosenDate || today();
    viewYear = base.getFullYear();
    viewMonth = base.getMonth();
    $('.mt-cal-time-row', pop).hidden = !activeDateTime;
    $('#mt-cal-time-input').value = chosenDate && activeDateTime ? `${pad(chosenDate.getHours())}:${pad(chosenDate.getMinutes())}` : safeTimeNow();
    trigger.setAttribute('aria-expanded', 'true');
    pop.setAttribute('aria-label', activeDateTime ? 'Choose date and time' : 'Choose a date');
    renderDays();
    pop.hidden = false;
    placePopover();
    const selected = $('.mt-cal-day.is-selected', pop) || $('.mt-cal-day.is-today', pop);
    if (selected) selected.setAttribute('tabindex', '0');
  }

  function closeCalendar(returnFocus = false) {
    if (activeTrigger) activeTrigger.setAttribute('aria-expanded', 'false');
    pop.hidden = true;
    if (returnFocus && activeTrigger) activeTrigger.focus({ preventScroll: true });
    activeInput = null;
    activeTrigger = null;
    activeDateTime = false;
    chosenDate = null;
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-calendar-target]');
    if (trigger) { event.preventDefault(); openCalendar(trigger); return; }
    if (!pop.hidden && !pop.contains(event.target)) closeCalendar();
  });
  $('[data-cal-prev]', pop).addEventListener('click', () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderDays(); placePopover(); });
  $('[data-cal-next]', pop).addEventListener('click', () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderDays(); placePopover(); });
  $('[data-cal-today]', pop).addEventListener('click', () => {
    const d = today();
    if (activeDateTime) $('#mt-cal-time-input').value = safeTimeNow();
    writeDate(d, false);
    closeCalendar();
  });
  $('[data-cal-clear]', pop).addEventListener('click', () => { writeDate(null, true); closeCalendar(); });
  $('#mt-cal-time-input').addEventListener('change', () => {
    if (!activeInput || !activeDateTime) return;
    const d = chosenDate || today();
    writeDate(d, false);
  });
  document.addEventListener('keydown', event => {
    if (pop.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeCalendar(true); }
    if (event.key === 'ArrowLeft' && document.activeElement.classList.contains('mt-cal-day')) { event.preventDefault(); viewMonth--; if (viewMonth < 0) {viewMonth=11;viewYear--;} renderDays(); placePopover(); }
    if (event.key === 'ArrowRight' && document.activeElement.classList.contains('mt-cal-day')) { event.preventDefault(); viewMonth++; if (viewMonth > 11) {viewMonth=0;viewYear++;} renderDays(); placePopover(); }
  });
  window.addEventListener('resize', placePopover, { passive: true });
  window.addEventListener('scroll', placePopover, { passive: true, capture: true });

  function updateAllLabels() {
    $$('input.date-value').forEach(setTriggerLabel);
  }
  updateAllLabels();
})();
