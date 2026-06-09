// ==========================================
// Calendar & Dashboard Logic
// ==========================================

window.agendaDirty = true;
window.myAgendaDirty = true;
window.isProgrammaticScroll = false;
window.progScrollTimeout = null;

window.isAgendaCollapsed = { dash: false, my: false };
window.isTopWidgetsHidden = { dash: false, my: false };

window.isDefaultDashAgendaSet = false;
window.isDefaultMyAgendaSet = false;

window.jumpToToday = function(ctx) {
const today = new Date();
today.setHours(0,0,0,0);
if (ctx === 'dash') {
dashDate = today;
dashMonth = new Date(today.getFullYear(), today.getMonth(), 1);
window.agendaDirty = true;
if (dashViewMode === 'month') toggleDashView('agenda');
else renderDashboard();
setTimeout(() => window.scrollToAgendaDate(ctx, dashDate), 100);
} else {
myDate = today;
myMonth = new Date(today.getFullYear(), today.getMonth(), 1);
window.myAgendaDirty = true;
if (dashViewMode === 'month') toggleDashView('agenda');
else renderMyLeaves();
setTimeout(() => window.scrollToAgendaDate(ctx, myDate), 100);
}
};

window.jumpToDate = function(ctx, targetDateObj) {
const targetDate = new Date(targetDateObj);
targetDate.setHours(0,0,0,0);
if (ctx === 'dash') {
dashDate = targetDate;
dashMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
window.agendaDirty = true;
if (dashViewMode === 'month') toggleDashView('agenda');
else renderDashboard();
setTimeout(() => window.scrollToAgendaDate(ctx, dashDate), 100);
} else {
myDate = targetDate;
myMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
window.myAgendaDirty = true;
if (dashViewMode === 'month') toggleDashView('agenda');
else renderMyLeaves();
setTimeout(() => window.scrollToAgendaDate(ctx, myDate), 100);
}
};

window.scrollToAgendaDate = function(ctx, targetDateObj) {
const container = document.getElementById(`${ctx}-agenda`);
if (!container) return;

// If the container is currently hidden (e.g. tab hasn't switched yet), wait and try again
if (container.offsetParent === null) {
setTimeout(() => window.scrollToAgendaDate(ctx, targetDateObj), 50);
return;
}

setProgrammaticScroll();
const group = ensureAgendaDateExists(ctx, targetDateObj);
if (group) {
const cRect = container.getBoundingClientRect();
const gRect = group.getBoundingClientRect();
container.scrollTop += (gRect.top - cRect.top);
}
};

window.toggleTopWidgets = function(ctx) {
window.isTopWidgetsHidden[ctx] = !window.isTopWidgetsHidden[ctx];
const container = document.getElementById(`${ctx}-top-widgets-container`);
const btn = document.getElementById(`${ctx}-toggle-widgets-btn`);

if (window.isTopWidgetsHidden[ctx]) {
if(container) container.classList.add('hidden-view');
if(btn) btn.innerHTML = `<svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg> Show Cal`;
} else {
if(container) container.classList.remove('hidden-view');
if(btn) btn.innerHTML = `<svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg> Hide Cal`;
}
};

window.toggleAgendaCard = function(headerEl) {
const card = headerEl.parentElement;
const body = card.querySelector('.agenda-card-body');
const chevron = card.querySelector('.chevron-icon');
if(!body) return;

if(body.classList.contains('hidden-view')) {
body.classList.remove('hidden-view');
if(chevron) chevron.classList.add('rotate-180');
} else {
body.classList.add('hidden-view');
if(chevron) chevron.classList.remove('rotate-180');
}
};

window.toggleAllAgendaCards = function(ctx) {
window.isAgendaCollapsed[ctx] = !window.isAgendaCollapsed[ctx];
const btn = document.getElementById(`${ctx}-expand-toggle-btn`);
if(btn) {
btn.innerText = window.isAgendaCollapsed[ctx] ? 'Expand All' : 'Collapse All';
}

const container = document.getElementById(`${ctx}-agenda`);
const infoAllContainer = document.getElementById(`${ctx}-infoall-list`);

const updateNodes = (parent) => {
if(!parent) return;
const cards = parent.querySelectorAll('.agenda-card-body');
const chevrons = parent.querySelectorAll('.chevron-icon');
if (window.isAgendaCollapsed[ctx]) {
 cards.forEach(b => b.classList.add('hidden-view'));
 chevrons.forEach(c => c.classList.remove('rotate-180'));
} else {
 cards.forEach(b => b.classList.remove('hidden-view'));
 chevrons.forEach(c => c.classList.add('rotate-180'));
}
};

updateNodes(container);
updateNodes(infoAllContainer);
};

function setProgrammaticScroll() {
window.isProgrammaticScroll = true;
clearTimeout(window.progScrollTimeout);
window.progScrollTimeout = setTimeout(() => { window.isProgrammaticScroll = false; }, 1000);
}

function applyAcronymsFront(text) {
if (!text || !window.appAcronyms) return text;
let result = text;

// Sort by length of full text descending to avoid partial replacements of nested words
const keys = Object.keys(window.appAcronyms).sort((a, b) => {
const fullA = typeof window.appAcronyms[a] === 'object' ? (window.appAcronyms[a].full || '') : (window.appAcronyms[a] || '');
const fullB = typeof window.appAcronyms[b] === 'object' ? (window.appAcronyms[b].full || '') : (window.appAcronyms[b] || '');
return fullB.length - fullA.length;
});

for (let key of keys) {
if (!key) continue;
let val = window.appAcronyms[key];
let full = typeof val === 'object' ? val.full : val;
let active = typeof val === 'object' ? val.active : true;

if (!active || !full) continue;

const escapedFull = full.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Safe boundary application. Avoids regex breaking when full phrases contain punctuation.
const prefix = /^[\w\u00C0-\u017F]/.test(full) ? "\\b" : "";
const suffix = /[\w\u00C0-\u017F]$/.test(full) ? "\\b" : "";

const regex = new RegExp(prefix + escapedFull + suffix, "gi");
result = result.replace(regex, key);
}
return result;
}

function toggleDashView(mode) {
dashViewMode = mode;
const btnAgenda = document.getElementById('btn-dash-agenda');
const btnMonth = document.getElementById('btn-dash-month');

const dashWrapAgenda = document.getElementById('dash-agenda-wrapper');
const dashWrapMonth = document.getElementById('dash-month-wrapper');
const myWrapAgenda = document.getElementById('my-agenda-wrapper');
const myWrapMonth = document.getElementById('my-month-wrapper');

const activeClass =['bg-white', 'dark:bg-darksurface', 'shadow', 'text-blue-600', 'dark:text-blue-400', 'font-bold'];
const inactiveClass =['text-gray-500', 'dark:text-darkmuted', 'hover:text-gray-800', 'dark:hover:text-gray-200', 'bg-transparent', 'font-semibold'];

if (mode === 'agenda') {
btnAgenda.classList.add(...activeClass); btnAgenda.classList.remove(...inactiveClass);
btnMonth.classList.remove(...activeClass); btnMonth.classList.add(...inactiveClass);

if (dashWrapAgenda) dashWrapAgenda.classList.remove('hidden-view');
if (dashWrapMonth) dashWrapMonth.classList.add('hidden-view');
if (myWrapAgenda) myWrapAgenda.classList.remove('hidden-view');
if (myWrapMonth) myWrapMonth.classList.add('hidden-view');
} else {
btnMonth.classList.add(...activeClass); btnMonth.classList.remove(...inactiveClass);
btnAgenda.classList.remove(...activeClass); btnAgenda.classList.add(...inactiveClass);

if (dashWrapMonth) {
dashWrapMonth.classList.remove('hidden-view');
dashWrapMonth.classList.add('flex');
}
if (dashWrapAgenda) dashWrapAgenda.classList.add('hidden-view');

if (myWrapMonth) {
myWrapMonth.classList.remove('hidden-view');
myWrapMonth.classList.add('flex');
}
if (myWrapAgenda) myWrapAgenda.classList.add('hidden-view');
}

window.agendaDirty = true;
window.myAgendaDirty = true;
renderDashboard();
renderMyLeaves();
}

async function loadLeavesData() {
try { 
allLeaves = await apiCall('getLeaves'); 
window.agendaDirty = true;
window.myAgendaDirty = true;

renderDashboard(); 
renderMyLeaves(); 

const paradeView = document.getElementById('view-parade-state');
if(paradeView && !paradeView.classList.contains('hidden-view') && typeof renderParadeState === 'function') {
renderParadeState(); 
}
} catch (err) { console.error("Error loading leaves data: ", err); }
}

function changeMonth(ctx, offset) {
setProgrammaticScroll();
if (ctx === 'dash') { 
dashMonth.setMonth(dashMonth.getMonth() + offset); 
dashDate = new Date(dashMonth.getFullYear(), dashMonth.getMonth(), 1);
window.agendaDirty = true;
renderDashboard(); 
} else { 
myMonth.setMonth(myMonth.getMonth() + offset); 
myDate = new Date(myMonth.getFullYear(), myMonth.getMonth(), 1);
window.myAgendaDirty = true;
renderMyLeaves(); 
}
}

function selectDate(ctx, y, m, d) {
setProgrammaticScroll();
if (ctx === 'dash') { 
dashDate = new Date(y, m, d); 
if (dashViewMode === 'month') {
toggleDashView('agenda');
} else {
renderDashboard(); 
}
} else { 
myDate = new Date(y, m, d); 
if (dashViewMode === 'month') {
toggleDashView('agenda');
} else {
renderMyLeaves();
}
}
}

function updateMiniCalendarSelection(ctx, d) {
const grid = document.getElementById(`${ctx}-cal-grid`);
if (!grid) return;
const cells = grid.querySelectorAll('.cal-day-cell');
cells.forEach(cell => {
const cellDay = parseInt(cell.dataset.day);
const isToday = cell.dataset.istoday === 'true';

let baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full cursor-pointer transition-colors text-xs md:text-sm font-medium ";
if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";

if (cellDay === d) {
baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full cursor-pointer transition-colors text-xs md:text-sm font-bold bg-blue-600 text-white shadow-md ";
}

cell.className = baseClass;

const hasEvent = cell.dataset.hasevent === 'true';
if (hasEvent) {
const dotColor = cellDay === d ? 'bg-white' : 'bg-blue-500';
cell.innerHTML = `${cellDay}<div class="absolute bottom-0.5 md:bottom-1 w-1 h-1 md:w-1.5 md:h-1.5 ${dotColor} rounded-full"></div>`;
} else {
cell.innerHTML = `${cellDay}`;
}
});
}

let scrollTimeoutDash, scrollTimeoutMy;

function handleAgendaScroll(ctx) {
if (window.isProgrammaticScroll) return; 

const isDash = ctx === 'dash';
clearTimeout(isDash ? scrollTimeoutDash : scrollTimeoutMy);

const timeout = setTimeout(() => {
const container = document.getElementById(`${ctx}-agenda`);
if (!container) return;
const groups = Array.from(container.querySelectorAll('.agenda-day-group'));
if (groups.length === 0) return;

const containerRect = container.getBoundingClientRect();
const containerTop = containerRect.top;
const containerBottom = containerRect.bottom;

const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;

let topDateStr = null;

if (isAtBottom) {
for (let i = groups.length - 1; i >= 0; i--) {
 const rect = groups[i].getBoundingClientRect();
 if (rect.top < containerBottom) {
     topDateStr = groups[i].dataset.date; 
     break;
 }
}
} else {
for (const group of groups) {
 const rect = group.getBoundingClientRect();
 if (rect.top >= containerTop && rect.top <= containerTop + 100) {
     topDateStr = group.dataset.date; break;
 } else if (rect.top < containerTop && rect.bottom > containerTop + 20) {
     topDateStr = group.dataset.date; break;
 }
}
}

if (topDateStr) {
const[y, m, d] = topDateStr.split('-').map(Number);
const targetDate = isDash ? dashDate : myDate;
const targetMonth = isDash ? dashMonth : myMonth;

if (targetDate.getDate() !== d || targetDate.getMonth() !== (m-1) || targetDate.getFullYear() !== y) {
 if (isDash) dashDate = new Date(y, m - 1, d);
 else myDate = new Date(y, m - 1, d);
 
 if (targetMonth.getMonth() !== (m-1) || targetMonth.getFullYear() !== y) {
     if (isDash) {
         dashMonth = new Date(y, m - 1, 1);
     } else {
         myMonth = new Date(y, m - 1, 1);
     }
     renderMiniCalendar(ctx);
     updateInfoAllDisplay(ctx);
 } else {
     updateMiniCalendarSelection(ctx, d);
 }
}
}
}, 50);

if (isDash) scrollTimeoutDash = timeout;
else scrollTimeoutMy = timeout;
}

function isEventOnDate(l, targetDate) {
if (l.Status === 'Cancelled') return false;
const s = new Date(l.StartDate); s.setHours(0,0,0,0);
const e = new Date(l.EndDate); e.setHours(0,0,0,0);

const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = typeObj ? typeObj.isEvent : false;

if (!isEvent || !l.HalfDay || l.HalfDay === 'NONE' || l.HalfDay === 'None') return targetDate >= s && targetDate <= e;

const untilStr = l.UntilDate;
const untilD = untilStr ? new Date(untilStr) : new Date(s.getTime() + 31536000000); 
untilD.setHours(23,59,59,999);

if (targetDate < s || targetDate > untilD) return false;
if (targetDate >= s && targetDate <= e) return true;

if (l.HalfDay === 'DAILY') return true;
if (l.HalfDay === 'WEEKDAY') return targetDate.getDay() !== 0 && targetDate.getDay() !== 6;

const diffTime = targetDate.getTime() - s.getTime();
const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

if (l.HalfDay === 'WEEKLY') return diffDays % 7 === 0;
if (l.HalfDay === 'MONTHLY') return targetDate.getDate() === s.getDate();
if (l.HalfDay === 'ANNUALLY') return targetDate.getMonth() === s.getMonth() && targetDate.getDate() === s.getDate();

return false;
}

function renderMiniCalendar(ctx) {
const monthDate = ctx === 'dash' ? dashMonth : myMonth;
const selDate = ctx === 'dash' ? dashDate : myDate;
const monthEl = document.getElementById(`${ctx}-cal-month`);
if (monthEl) monthEl.innerText = mos[monthDate.getMonth()] + ' ' + monthDate.getFullYear();

const y = monthDate.getFullYear(); const m = monthDate.getMonth();
const firstDay = new Date(y, m, 1).getDay(); 
const daysInMonth = new Date(y, m + 1, 0).getDate();

let html = ''; for(let i=0; i<firstDay; i++) html += `<div></div>`;

const data = ctx === 'dash' ? window.dashFilteredLeaves ||[] : window.myFilteredLeaves ||[];

for(let d=1; d<=daysInMonth; d++) {
const current = new Date(y, m, d); current.setHours(0,0,0,0);
const isSelected = current.toDateString() === selDate.toDateString();
const isToday = current.toDateString() === new Date().toDateString();
const hasEvent = data.some(l => isEventOnDate(l, current));

let baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full cursor-pointer transition-colors text-xs md:text-sm font-medium ";
if (isSelected) baseClass += "bg-blue-600 text-white font-bold shadow-md ";
else if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";

const dotColor = isSelected ? 'bg-white' : 'bg-blue-500';
const dot = hasEvent ? `<div class="absolute bottom-0.5 md:bottom-1 w-1 h-1 md:w-1.5 md:h-1.5 ${dotColor} rounded-full"></div>` : '';

html += `<div class="${baseClass}" data-day="${d}" data-istoday="${isToday}" data-hasevent="${hasEvent}" onclick="selectDate('${ctx}', ${y}, ${m}, ${d})">${d}${dot}</div>`;
}
const gridEl = document.getElementById(`${ctx}-cal-grid`);
if (gridEl) gridEl.innerHTML = html;
}

function buildFullMonthGrid(monthDate, data, ctx) {
const y = monthDate.getFullYear(); 
const m = monthDate.getMonth();
const firstDay = new Date(y, m, 1); 
const lastDay = new Date(y, m + 1, 0);

const startDate = new Date(firstDay);
startDate.setDate(startDate.getDate() - startDate.getDay()); 

const endDate = new Date(lastDay);
if (endDate.getDay() !== 6) {
endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
}

let instances =[];
data.forEach(l => {
if (l.Status === 'Cancelled') return;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = typeObj ? typeObj.isEvent : false;
const isLeave = !isEvent;
const isRepeating = isEvent && l.HalfDay && l.HalfDay !== 'NONE' && l.HalfDay !== 'None';

let evStart = new Date(l.StartDate); evStart.setHours(0,0,0,0);
let evEnd = new Date(l.EndDate); evEnd.setHours(0,0,0,0);

if (isRepeating) {
for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
if (isEventOnDate(l, d)) {
   instances.push({ l: l, start: new Date(d), end: new Date(d), isLeave: isLeave });
}
}
} else {
if (evStart <= endDate && evEnd >= startDate) {
let clampedStart = new Date(Math.max(evStart, startDate));
let clampedEnd = new Date(Math.min(evEnd, endDate));
instances.push({ l: l, start: clampedStart, end: clampedEnd, isLeave: isLeave });
}
}
});

let html = '<div class="flex flex-col flex-grow bg-gray-200 dark:bg-darkborder gap-px border border-gray-300 dark:border-darkborder rounded-xl overflow-hidden shadow-inner">';

for (let w = new Date(startDate); w <= endDate; w.setDate(w.getDate() + 7)) {
let weekEnd = new Date(w); weekEnd.setDate(weekEnd.getDate() + 6);
let weekInstances = instances.filter(inst => inst.start <= weekEnd && inst.end >= w);

let segments = weekInstances.map(inst => {
let sDay = Math.max(0, Math.floor((inst.start - w) / 86400000));
let eDay = Math.min(6, Math.floor((inst.end - w) / 86400000));
return { ...inst, sDay, eDay, len: eDay - sDay + 1 };
});

segments.sort((a, b) => b.len - a.len || a.sDay - b.sDay);

let slots =[];
segments.forEach(seg => {
let slotIdx = 0;
while (true) {
if (!slots[slotIdx]) slots[slotIdx] =[];
let conflict = false;
for (let i = seg.sDay; i <= seg.eDay; i++) {
   if (slots[slotIdx][i]) { conflict = true; break; }
}
if (!conflict) {
   for (let i = seg.sDay; i <= seg.eDay; i++) slots[slotIdx][i] = true;
   seg.slot = slotIdx;
   break;
}
slotIdx++;
}
});

let rowHeight = Math.max(90, (slots.length * 24) + 36);
html += `<div class="flex-1 relative bg-white dark:bg-darksurface flex min-h-[${rowHeight}px]">`;

for (let i = 0; i < 7; i++) {
let curD = new Date(w); curD.setDate(curD.getDate() + i);
let isToday = curD.toDateString() === new Date().toDateString();
let isCurMonth = curD.getMonth() === m;
let bg = isCurMonth ? '' : 'bg-gray-50/50 dark:bg-[#151515]';
html += `<div class="flex-1 border-r border-gray-200 last:border-r-0 dark:border-darkborder ${bg} p-1.5" onclick="selectDate('${ctx}', ${curD.getFullYear()}, ${curD.getMonth()}, ${curD.getDate()})">
<div class="text-xs font-bold ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 mx-auto flex items-center justify-center shadow-md' : 'text-gray-500 dark:text-darkmuted text-center'}">${curD.getDate()}</div>
</div>`;
}

html += `<div class="absolute top-9 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">`;
segments.forEach(seg => {
const isPublicHoliday = seg.l.LeaveType === 'Public Holiday';
const color = isPublicHoliday ? 'bg-indigo-500 dark:bg-indigo-600 text-white' : (seg.isLeave ? 'bg-[#e26d5c] dark:bg-[#c25a4a] text-white' : (seg.len > 1 ? 'bg-[#f4c264] dark:bg-[#d6a54d] text-gray-900' : 'bg-[#50b182] dark:bg-[#3d9369] text-white'));

let locStr = seg.l.Location || '';
if (seg.l.LocationDetails) locStr += ` - ${seg.l.LocationDetails}`;

const safeType = (seg.l.LeaveType || "").trim();
const displayType = safeType === 'Generic' && seg.l.Remarks ? `${safeType}: ${seg.l.Remarks.trim()}` : safeType;

let dispName = applyAcronymsFront(seg.l.Name || "");
if (dispName === (seg.l.Name || "")) {
dispName = dispName.split(' ')[0];
}

const titleRawStr = isPublicHoliday ? seg.l.Name : (seg.isLeave ? `${dispName} : ${displayType}` : displayType);
const appliedTitle = applyAcronymsFront(titleRawStr);

const left = (seg.sDay / 7) * 100;
const width = (seg.len / 7) * 100;
const topOffset = (seg.slot * 24) + 30; 

let rounded = 'rounded-md';
if (seg.len > 1) {
if (seg.sDay === 0 && seg.eDay === 6) rounded = 'rounded-none';
else if (seg.sDay === 0) rounded = 'rounded-r-md';
else if (seg.eDay === 6) rounded = 'rounded-l-md';
}

html += `<div class="absolute h-[22px] px-1.5 text-[11px] md:text-xs font-bold leading-snug truncate shadow-sm pointer-events-auto cursor-pointer border border-black/5 ${color} ${rounded}" style="left: calc(${left}% + 2px); width: calc(${width}% - 4px); top: ${topOffset}px;" onclick="selectDate('${ctx}', ${w.getFullYear()}, ${w.getMonth()}, ${w.getDate() + seg.sDay})" title="${appliedTitle}">${appliedTitle}</div>`;
});
html += `</div></div>`; 
}
html += '</div>';
return html;
}

function getBadgeClass(status, leaveType) {
if(leaveType === 'Public Holiday') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
const safeStatus = String(status || '');
if(safeStatus.includes('Pending')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
if(safeStatus.includes('Cancelled')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
}

function formatStatusBadge(status, leaveType) {
if(leaveType === 'Public Holiday') return 'Holiday';
let s = String(status || '').replace('Approved', 'Cal Updated');
if (s.includes('KAH Limit Crossed')) {
const match = s.match(/KAH Limit Crossed for (.*)\)/);
const dept = match ? match[1] : '';
return `Cal Updated<br><span class="text-[10px] font-bold text-red-600 dark:text-red-400 tracking-tight leading-tight block mt-1">KAH Limit Crossed</span><span class="text-[10px] font-bold text-red-600 dark:text-red-400 tracking-tight leading-none block mt-0.5">${dept}</span>`;
}
return s;
}

function parseAndCleanTemplate(templateStr, vars) {
if (templateStr == null) return '';
let lines = templateStr.split('\n');
let validLines =[];

for (let i = 0; i < lines.length; i++) {
let line = lines[i];

let hasVariables = false;
let hasPresentValue = false;

// Extract all variables in the line
const matches = line.match(/{.*?}/g) ||[];

for (let match of matches) {
hasVariables = true;
let varName = match.replace(/[{}]/g, '');
let val = vars[varName] !== undefined ? vars[varName] : '';

if (val && String(val).trim() !== '') {
  hasPresentValue = true;
}
line = line.replace(match, val);
}

// Only skip the line if it contained variables and ALL of them were empty
if (hasVariables && !hasPresentValue) continue;

if (line.trim() !== '') {
// Cleanup artifacts like trailing commas, stray hyphens, empty parens left by missing variables
line = line.replace(/,\s*(?=[,\)]|$)/g, "")  // Remove trailing commas
         .replace(/\(\s*\)/g, "")          // Remove empty parentheses
         .replace(/:\s*[,|-]\s*/g, ": ")   // Remove stray hyphens or commas immediately after a label colon
         .replace(/\s+/g, " ")             // Normalize spaces
         .trim();

if (line.endsWith('-')) line = line.slice(0, -1).trim();
if (line.endsWith(':')) line = line.slice(0, -1).trim();

if (line !== '') {
  validLines.push(`<p class="text-sm md:text-base text-gray-600 dark:text-darkmuted mt-1 leading-snug">${line}</p>`);
}
}
}
return validLines.join('');
}

function buildAgendaHtml(items, isMyCalendar, isInfoAllContext) {
if (!items || items.length === 0) return isInfoAllContext ? '' : `<p class="text-gray-500 dark:text-darkmuted text-center italic text-base mt-2">No records for this date.</p>`;

const ctx = isMyCalendar ? 'my' : 'dash';
const isCollapsed = window.isAgendaCollapsed[ctx];

return items.map(l => {
const isPublicHoliday = l.LeaveType === 'Public Holiday';
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = isPublicHoliday ? true : (typeObj ? typeObj.isEvent : false);

let timeStr = "";
let startTimeStr = "";
let endTimeStr = "";

if (isEvent) {
if (String(l.IsAllDay).toUpperCase() === 'TRUE') {
const sD = formatDisplayDate(new Date(l.StartDate));
const eD = formatDisplayDate(new Date(l.EndDate));
timeStr = sD === eD ? `${sD} (All Day)` : `${sD} to ${eD} (All Day)`;
startTimeStr = sD + " (All Day)";
endTimeStr = eD + " (All Day)";
} else {
timeStr = `${formatDisplayDateTime(new Date(l.StartDate))} to ${formatDisplayDateTime(new Date(l.EndDate))}`;
startTimeStr = formatDisplayDateTime(new Date(l.StartDate));
endTimeStr = formatDisplayDateTime(new Date(l.EndDate));
}
if (l.HalfDay && l.HalfDay !== 'NONE' && l.HalfDay !== 'None') {
timeStr += ` <span class="font-bold text-purple-600 dark:text-purple-400">↻ ${l.HalfDay}</span>`;
endTimeStr += ` <span class="font-bold text-purple-600 dark:text-purple-400">↻ ${l.HalfDay}</span>`;
if (l.UntilDate) {
timeStr += ` until ${formatDisplayDate(new Date(l.UntilDate))}`;
endTimeStr += ` until ${formatDisplayDate(new Date(l.UntilDate))}`;
}
}
} else {
timeStr = `${formatDisplayDate(new Date(l.StartDate))} to ${formatDisplayDate(new Date(l.EndDate))}`;
startTimeStr = formatDisplayDate(new Date(l.StartDate));
endTimeStr = formatDisplayDate(new Date(l.EndDate));
}

let actionBtns = '';
let compactActionBtns = '';
if ((String(l.Phone) === String(user.phone) || user.role === 'admin') && l.Status !== 'Cancelled' && !isPublicHoliday) {
actionBtns = `
<button onclick="triggerEdit('${l.ID}')" class="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition shrink-0" title="Edit Record">
<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-2.952.81a.375.375 0 01-.465-.465l.81-2.952a4.5 4.5 0 011.147-1.89L16.862 4.487z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L16.862 4.487" /></svg>
</button>
<button onclick="cancelLeave('${l.ID}', '${l.Phone}')" class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition shrink-0" title="Cancel Record">
<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
</button>`;

compactActionBtns = `
<button onclick="triggerEdit('${l.ID}')" class="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition shrink-0" title="Edit Record">
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.147l-2.952.81a.375.375 0 01-.465-.465l.81-2.952a4.5 4.5 0 011.147-1.89L16.862 4.487z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L16.862 4.487" /></svg>
</button>
<button onclick="cancelLeave('${l.ID}', '${l.Phone}')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition shrink-0" title="Cancel Record">
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
</button>`;
}

let attendeesDisplay = '';
if (l.Attendees) {
try {
const attArr = JSON.parse(l.Attendees);
if (attArr && attArr.length > 0) {
attendeesDisplay = attArr.map(a => {
 if (a.expandedNames) return a.expandedNames;
 
 if (a.type === 'group') {
     if (a.name.startsWith('zz KAH:')) {
         const dept = a.dept;
         if (dept === 'Custom') {
             const gName = a.name.replace('zz KAH: ', '').trim();
             const cGrp = window.appCustomKahGroups.find(g => g.name === gName);
             if (cGrp) {
                 return cGrp.members.map(ph => {
                     const c = companyContacts.find(x => String(x.phone) === String(ph));
                     return c ? c.name : ph;
                 }).join(', ');
             }
         } else {
             const kahMems = window.appKahList.filter(k => k.dept === dept).map(k => k.name);
             if (kahMems.length > 0) return kahMems.join(', ');
         }
     } else if (a.name.startsWith('zz All in ')) {
         return a.name.replace('zz ', '');
     }
     return a.name.replace('zz KAH: ', '').replace('zz ', '');
 }
 return a.name;
}).join(', ');
}
} catch(e) {}
}

let locStr = l.Location || '';

if (!isEvent && l.LeaveType === 'Overseas Leave' && l.Country) {
locStr = l.Country + (l.State ? ` (${l.State})` : "");
}

let safeType = (l.LeaveType || "").trim();
let displayType = safeType;

if (safeType === 'Generic' && l.Remarks) {
displayType = safeType + ": " + l.Remarks.trim();
}

let eventDesc = l.Remarks ? l.Remarks.trim() : displayType;

const tplVars = {
EventType: isPublicHoliday ? 'Public Holiday' : displayType,
Name: l.Name || "",
Department: l.Department || "",
Attendees: applyAcronymsFront(attendeesDisplay) || "",
Location: applyAcronymsFront(locStr) || "",
LocationDetails: applyAcronymsFront(l.LocationDetails || "") || "",
Time: timeStr || "",
StartTime: startTimeStr || "",
EndTime: endTimeStr || "",
Remarks: l.Remarks || "",
EventDescription: eventDesc,
Country: l.Country || "",
State: l.State || ""
};

let titleRaw = isInfoAllContext ? window.appInfoAllTemplate : window.appAgendaTemplate;
if (typeObj) {
if (isInfoAllContext && typeObj.infoAllTemplate) titleRaw = typeObj.infoAllTemplate;
else if (!isInfoAllContext && typeObj.agendaTemplate) titleRaw = typeObj.agendaTemplate;
}

if (isMyCalendar && !isInfoAllContext) titleRaw = '{EventType}'; 
if (isPublicHoliday) titleRaw = '🇸🇬 {Name}';

let titleStr = titleRaw
.replace(/{EventType}/g, tplVars.EventType)
.replace(/{Name}/g, tplVars.Name)
.replace(/{Department}/g, tplVars.Department)
.replace(/{Attendees}/g, tplVars.Attendees)
.replace(/{Location}/g, tplVars.Location)
.replace(/{LocationDetails}/g, tplVars.LocationDetails)
.replace(/{Time}/g, tplVars.Time)
.replace(/{StartTime}/g, tplVars.StartTime)
.replace(/{EndTime}/g, tplVars.EndTime)
.replace(/{Remarks}/g, tplVars.Remarks)
.replace(/{EventDescription}/g, tplVars.EventDescription)
.replace(/{Country}/g, tplVars.Country)
.replace(/{State}/g, tplVars.State);

titleStr = titleStr.replace(/,\s*(?=[,\)]|$)/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
if (titleStr.endsWith('-')) titleStr = titleStr.slice(0, -1).trim();

const finalTitle = applyAcronymsFront(titleStr);

let detailsRaw = isInfoAllContext ? window.appInfoAllDetailsTemplate : window.appAgendaDetailsTemplate;
if (typeObj) {
if (isInfoAllContext && typeObj.infoAllDetailsTemplate !== undefined) {
    detailsRaw = typeObj.infoAllDetailsTemplate;
} else if (!isInfoAllContext && typeObj.agendaDetailsTemplate !== undefined) {
    detailsRaw = typeObj.agendaDetailsTemplate;
}
}

if (isPublicHoliday) detailsRaw = '';

const finalDetailsHtml = detailsRaw ? parseAndCleanTemplate(detailsRaw, tplVars) : '';

const hasBody = finalDetailsHtml.trim() !== '' || (isInfoAllContext ? compactActionBtns !== '' : actionBtns !== '');

if (isInfoAllContext) {
return `<div class="p-3 md:p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm flex flex-col transition hover:shadow-md">
<div class="flex justify-between items-start ${hasBody ? 'cursor-pointer select-none' : ''}" ${hasBody ? 'onclick="toggleAgendaCard(this)"' : ''}>
<h3 class="font-bold text-sm md:text-base text-blue-900 dark:text-blue-300 flex-grow pr-2 leading-tight">${finalTitle}</h3>
${hasBody ? `<svg class="w-5 h-5 text-blue-500 transition-transform duration-300 chevron-icon shrink-0 ${isCollapsed ? '' : 'rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>` : ''}
</div>
${hasBody ? `
<div class="agenda-card-body ${isCollapsed ? 'hidden-view' : ''}">
<div class="flex justify-between items-end gap-3 mt-2">
${finalDetailsHtml ? `<div class="whitespace-pre-wrap flex-grow">${finalDetailsHtml}</div>` : '<div class="flex-grow"></div>'}
${compactActionBtns ? `<div class="flex shrink-0 space-x-1.5">${compactActionBtns}</div>` : ''}
</div>
</div>` : ''}
</div>`;
}

return `<div class="p-4 rounded-2xl bg-white dark:bg-darkinput shadow-sm flex flex-col transition hover:shadow-md border border-transparent dark:border-darkborder/50">
<div class="flex justify-between items-start ${hasBody ? 'cursor-pointer select-none' : ''}" ${hasBody ? 'onclick="toggleAgendaCard(this)"' : ''}>
<div class="flex-grow pr-2">
<h3 class="font-bold text-base md:text-lg text-gray-900 dark:text-gray-100 leading-tight">${finalTitle}</h3>
${!isMyCalendar && !isEvent && l.HalfDay !== 'None' && l.HalfDay !== 'NONE' ? `<p class="font-medium text-sm text-gray-700 dark:text-darktext mt-1">(${l.HalfDay})</p>` : ''}
</div>
<div class="flex items-center shrink-0">
<span class="text-xs md:text-sm font-bold px-2.5 py-1 rounded-lg text-center inline-block leading-tight shadow-sm ${getBadgeClass(l.Status, l.LeaveType)}">${formatStatusBadge(l.Status, l.LeaveType)}</span>
${hasBody ? `<svg class="w-6 h-6 ml-2 text-gray-400 dark:text-darkmuted transition-transform duration-300 chevron-icon shrink-0 ${isCollapsed ? '' : 'rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>` : ''}
</div>
</div>
${hasBody ? `
<div class="agenda-card-body ${isCollapsed ? 'hidden-view' : ''}">
<div class="flex justify-between items-end gap-3 mt-3">
${finalDetailsHtml ? `<div class="whitespace-pre-wrap flex-grow pt-2 border-t border-gray-100 dark:border-darkborder/50">${finalDetailsHtml}</div>` : '<div class="flex-grow"></div>'}
${actionBtns ? `<div class="flex shrink-0 space-x-2 pb-1">${actionBtns}</div>` : ''}
</div>
</div>` : ''}
</div>`;
}).join('');
}

function updateInfoAllDisplay(ctx) {
const infoAllContainer = document.getElementById(`${ctx}-infoall-container`);
const infoAllList = document.getElementById(`${ctx}-infoall-list`);

if (!infoAllContainer || !infoAllList) return;

const targetMonth = ctx === 'dash' ? dashMonth : myMonth;
const mStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
const mEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

const data = ctx === 'dash' ? window.dashFilteredLeaves : window.myFilteredLeaves;

const infoAllEvents = data.filter(l => {
if (String(l.InfoAll).toUpperCase() !== 'TRUE') return false;
for (let d = new Date(mStart); d <= mEnd; d.setDate(d.getDate() + 1)) {
if (isEventOnDate(l, d)) return true;
}
return false;
});

if (infoAllEvents.length > 0) {
infoAllEvents.sort((a, b) => new Date(a.StartDate) - new Date(b.StartDate));
infoAllList.innerHTML = buildAgendaHtml(infoAllEvents, ctx === 'my', true);
infoAllContainer.classList.remove('hidden-view');
} else {
infoAllContainer.classList.add('hidden-view');
}
}

function generateContinuousAgenda(ctx, data) {
const container = document.getElementById(`${ctx}-agenda`);
if (!container) return;

const targetDate = ctx === 'dash' ? dashDate : myDate;
const start = new Date(targetDate.getFullYear(), targetDate.getMonth() - 2, 1);
const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 6, 0);

let html = '';
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
const dayEvents = data.filter(l => isEventOnDate(l, d));

if (dayEvents.length > 0 || d.toDateString() === targetDate.toDateString()) {
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, '0');
const dd = String(d.getDate()).padStart(2, '0');

html += `
<div class="agenda-day-group mb-8" data-date="${yyyy}-${mm}-${dd}">
  <div class="sticky top-0 bg-gray-50/95 dark:bg-darkbase/95 backdrop-blur-md z-10 py-2 border-b border-gray-200 dark:border-darkborder mb-4">
      <h3 class="font-bold text-base md:text-lg text-blue-700 dark:text-blue-400 pl-1">${formatDisplayDate(d)}</h3>
  </div>
  <div class="space-y-4 px-1 md:px-2">
      ${buildAgendaHtml(dayEvents, ctx === 'my' || (ctx==='dash' && document.getElementById('dash-dept-nav').value==='MY_CALENDAR'), false)}
  </div>
</div>`;
}
}

container.innerHTML = html || `<p class="text-gray-500 dark:text-darkmuted text-center text-lg mt-10">No records found.</p>`;

container.removeEventListener('scroll', ctx === 'dash' ? () => handleAgendaScroll('dash') : () => handleAgendaScroll('my'));
container.addEventListener('scroll', ctx === 'dash' ? () => handleAgendaScroll('dash') : () => handleAgendaScroll('my'));
}

function ensureAgendaDateExists(ctx, targetDateObj) {
const y = targetDateObj.getFullYear();
const m = targetDateObj.getMonth();
const d = targetDateObj.getDate();
const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const container = document.getElementById(`${ctx}-agenda`);
if (!container) return null;

let group = container.querySelector(`.agenda-day-group[data-date="${dateStr}"]`);

if (!group) {
group = document.createElement('div');
group.className = 'agenda-day-group mb-8';
group.dataset.date = dateStr;
group.innerHTML = `
<div class="sticky top-0 bg-gray-50/95 dark:bg-darkbase/95 backdrop-blur-md z-10 py-2 border-b border-gray-200 dark:border-darkborder mb-4">
  <h3 class="font-bold text-base md:text-lg text-blue-700 dark:text-blue-400 pl-1">${formatDisplayDate(targetDateObj)}</h3>
</div>
<div class="space-y-4 px-1 md:px-2">
  <p class="text-gray-500 dark:text-darkmuted text-center italic text-base mt-4">No records for this date.</p>
</div>`;

const allGroups = Array.from(container.querySelectorAll('.agenda-day-group'));
let inserted = false;
for (let i = 0; i < allGroups.length; i++) {
if (allGroups[i].dataset.date > dateStr) {
  container.insertBefore(group, allGroups[i]);
  inserted = true;
  break;
}
}
if (!inserted) container.appendChild(group);
}
return group;
}

function renderDashboard() {
const searchEl = document.getElementById('dash-search');
const q = searchEl ? searchEl.value.toLowerCase() : '';
const deptNav = document.getElementById('dash-dept-nav');
const d = deptNav ? deptNav.value : '';

let filtered = allLeaves.filter(l => l.Status !== 'Cancelled');

if (d === 'MY_CALENDAR') {
filtered = filtered.filter(l => {
if (String(l.InfoAll).toUpperCase() === 'TRUE') return true;
if (String(l.Phone) === String(user.phone)) return true;
if (l.Attendees) {
try {
const att = JSON.parse(l.Attendees);
return att.some(a => {
if (a.type === 'contact' && String(a.id) === String(user.phone)) return true;
if (a.type === 'group') {
  if (a.dept === 'Custom') {
      const customG = window.appCustomKahGroups.find(cg => cg.name === a.name.replace('zz KAH: ', ''));
      return customG && customG.members.includes(String(user.phone));
  } else if (a.name.startsWith('zz KAH:')) {
      return window.appKahList.some(k => k.dept === a.dept && String(k.phone) === String(user.phone));
  } else {
      return (user.departments ||[]).includes(a.dept); // Safety fallback
  }
}
return false;
});
} catch(e) { return String(l.Attendees).includes(String(user.phone)); }
}
return false;
});
} else if (d) {
filtered = filtered.filter(l => {
if (String(l.InfoAll).toUpperCase() === 'TRUE') return true;
if (String(l.Department||'').includes(d)) return true;

// Robustly check Attendees JSON to restore visibility if getLeaves overwrote the Department column
if (l.Attendees) {
try {
const att = JSON.parse(l.Attendees);
return att.some(a => {
if (a.dept && String(a.dept).includes(d)) return true;
if (a.type === 'group' && a.dept === 'Custom') {
const customG = window.appCustomKahGroups.find(cg => cg.name === a.name.replace('zz KAH: ', ''));
if (customG) {
    return customG.members.some(phone => {
        const contact = companyContacts.find(c => String(c.phone) === String(phone));
        return contact && contact.dept && String(contact.dept).includes(d);
    });
}
}
return false;
});
} catch(e) {
const phones = String(l.Attendees).split(',');
return phones.some(phone => {
const contact = companyContacts.find(c => String(c.phone) === String(phone.trim()));
return contact && contact.dept && String(contact.dept).includes(d);
});
}
}
return false;
});
}

if (q) {
const fuse = new Fuse(filtered, { keys:['Name', 'LeaveType', 'Remarks', 'Attendees'], threshold: 0.3 });
filtered = fuse.search(q).map(res => res.item);
}

window.dashFilteredLeaves = filtered;

if (!window.isDefaultDashAgendaSet) {
window.isDefaultDashAgendaSet = true;
}

if (dashViewMode === 'agenda') {
renderMiniCalendar('dash');

if (window.agendaDirty) {
generateContinuousAgenda('dash', filtered);
window.agendaDirty = false;
}

const agendaEl = document.getElementById('dash-agenda');
if (agendaEl) {
window.scrollToAgendaDate('dash', dashDate);
}

updateInfoAllDisplay('dash');

const toggleBtnDash = document.getElementById('dash-expand-toggle-btn');
if (toggleBtnDash) toggleBtnDash.innerText = window.isAgendaCollapsed['dash'] ? 'Expand All' : 'Collapse All';

} else {
const monthTitleEl = document.getElementById('dash-month-title');
if (monthTitleEl) monthTitleEl.innerText = mos[dashMonth.getMonth()] + ' ' + dashMonth.getFullYear();

const monthGridEl = document.getElementById('dash-month-grid');
if (monthGridEl) monthGridEl.innerHTML = buildFullMonthGrid(dashMonth, filtered, 'dash');
}
}

function renderMyLeaves() {
const my = allLeaves.filter(l => {
if (l.Status === 'Cancelled') return false;
if (String(l.InfoAll).toUpperCase() === 'TRUE') return true;
if (String(l.Phone) === String(user.phone)) return true;
if (l.Attendees) {
try {
const att = JSON.parse(l.Attendees);
return att.some(a => {
if (a.type === 'contact' && String(a.id) === String(user.phone)) return true;
if (a.type === 'group') {
  if (a.dept === 'Custom') {
      const customG = window.appCustomKahGroups.find(cg => cg.name === a.name.replace('zz KAH: ', ''));
      return customG && customG.members.includes(String(user.phone));
  } else if (a.name.startsWith('zz KAH:')) {
      return window.appKahList.some(k => k.dept === a.dept && String(k.phone) === String(user.phone));
  } else {
      return (user.departments ||[]).includes(a.dept); // Safety fallback
  }
}
return false;
});
} catch(e) { return String(l.Attendees).includes(String(user.phone)); }
}
return false;
});

window.myFilteredLeaves = my;

if (!window.isDefaultMyAgendaSet) {
window.isDefaultMyAgendaSet = true;
}

if (dashViewMode === 'agenda') {
renderMiniCalendar('my');
if (window.myAgendaDirty) {
generateContinuousAgenda('my', my);
window.myAgendaDirty = false;
}

const agendaEl = document.getElementById('my-agenda');
if (agendaEl) {
window.scrollToAgendaDate('my', myDate);
}

updateInfoAllDisplay('my');

const toggleBtnMy = document.getElementById('my-expand-toggle-btn');
if (toggleBtnMy) toggleBtnMy.innerText = window.isAgendaCollapsed['my'] ? 'Expand All' : 'Collapse All';

} else {
const monthTitleEl = document.getElementById('my-month-title');
if (monthTitleEl) monthTitleEl.innerText = mos[myMonth.getMonth()] + ' ' + myMonth.getFullYear();

const monthGridEl = document.getElementById('my-month-grid');
if (monthGridEl) monthGridEl.innerHTML = buildFullMonthGrid(myMonth, my, 'my');
}
}