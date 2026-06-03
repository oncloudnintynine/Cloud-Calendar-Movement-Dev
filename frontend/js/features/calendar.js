// ==========================================
// Calendar & Dashboard Logic
// ==========================================

window.agendaDirty = true;
window.myAgendaDirty = true;
window.isProgrammaticScroll = false;
window.progScrollTimeout = null;

window.isAgendaCollapsed = { dash: false, my: false };
window.isTopWidgetsHidden = { dash: false, my: false };

window.toggleTopWidgets = function(ctx) {
window.isTopWidgetsHidden[ctx] = !window.isTopWidgetsHidden[ctx];
const container = document.getElementById(`${ctx}-top-widgets-container`);
const btn = document.getElementById(`${ctx}-toggle-widgets-btn`);

if (window.isTopWidgetsHidden[ctx]) {
    if(container) container.classList.add('hidden-view');
    if(btn) btn.innerHTML = `<svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Show Cal`;
} else {
    if(container) container.classList.remove('hidden-view');
    if(btn) btn.innerHTML = `<svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Hide Cal`;
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

const activeClass =['bg-white', 'dark:bg-darksurface', 'shadow', 'text-blue-600', 'dark:text-blue-400'];
const inactiveClass =['text-gray-500', 'dark:text-darkmuted', 'hover:text-gray-800', 'dark:hover:text-gray-200', 'bg-transparent'];

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

let baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 mx-auto rounded-full cursor-pointer transition-colors text-xs font-medium ";
if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";

if (cellDay === d) {
   baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 mx-auto rounded-full cursor-pointer transition-colors text-xs font-bold bg-blue-600 text-white shadow-md ";
}

cell.className = baseClass;

const hasEvent = cell.dataset.hasevent === 'true';
if (hasEvent) {
   const dotColor = cellDay === d ? 'bg-white' : 'bg-blue-500';
   cell.innerHTML = `${cellDay}<div class="absolute bottom-0 w-1 h-1 ${dotColor} rounded-full"></div>`;
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

let baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 mx-auto rounded-full cursor-pointer transition-colors text-xs font-medium ";
if (isSelected) baseClass += "bg-blue-600 text-white font-bold shadow-md ";
else if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";

const dotColor = isSelected ? 'bg-white' : 'bg-blue-500';
const dot = hasEvent ? `<div class="absolute bottom-0 w-1 h-1 ${dotColor} rounded-full"></div>` : '';

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

let html = '<div class="flex flex-col flex-grow bg-gray-200 dark:bg-darkborder gap-px border border-gray-300 dark:border-darkborder rounded overflow-hidden shadow-inner">';

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

let rowHeight = Math.max(80, (slots.length * 20) + 30);
html += `<div class="flex-1 relative bg-white dark:bg-darksurface flex min-h-[${rowHeight}px]">`;

for (let i = 0; i < 7; i++) {
 let curD = new Date(w); curD.setDate(curD.getDate() + i);
 let isToday = curD.toDateString() === new Date().toDateString();
 let isCurMonth = curD.getMonth() === m;
 let bg = isCurMonth ? '' : 'bg-gray-50/50 dark:bg-[#151515]';
 html += `<div class="flex-1 border-r border-gray-200 last:border-r-0 dark:border-darkborder ${bg} p-1" onclick="selectDate('${ctx}', ${curD.getFullYear()}, ${curD.getMonth()}, ${curD.getDate()})">
    <div class="text-[11px] font-bold ${isToday ? 'bg-blue-600 text-white rounded-full w-[22px] h-[22px] mx-auto flex items-center justify-center shadow-md' : 'text-gray-500 dark:text-darkmuted text-center'}">${curD.getDate()}</div>
 </div>`;
}

html += `<div class="absolute top-8 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">`;
segments.forEach(seg => {
 const isPublicHoliday = seg.l.LeaveType === 'Public Holiday';
 const color = isPublicHoliday ? 'bg-indigo-500 dark:bg-indigo-600 text-white' : (seg.isLeave ? 'bg-[#e26d5c] dark:bg-[#c25a4a] text-white' : (seg.len > 1 ? 'bg-[#f4c264] dark:bg-[#d6a54d] text-gray-900' : 'bg-[#50b182] dark:bg-[#3d9369] text-white'));
 
 let locStr = seg.l.Location || '';
 if (seg.l.LocationDetails) locStr += ` - ${seg.l.LocationDetails}`;

 const safeType = (seg.l.LeaveType || "").trim();
 const displayType = safeType === 'Meeting' && seg.l.Remarks ? `${safeType}: ${seg.l.Remarks.trim()}` : safeType;
 
 let dispName = applyAcronymsFront(seg.l.Name || "");
 if (dispName === (seg.l.Name || "")) {
     dispName = dispName.split(' ')[0];
 }
 
 const titleRawStr = isPublicHoliday ? seg.l.Name : (seg.isLeave ? `${dispName} : ${displayType}` : displayType);
 const appliedTitle = applyAcronymsFront(titleRawStr);
 
 const left = (seg.sDay / 7) * 100;
 const width = (seg.len / 7) * 100;
 const topOffset = (seg.slot * 20) + 26; 

 let rounded = 'rounded-sm';
 if (seg.len > 1) {
    if (seg.sDay === 0 && seg.eDay === 6) rounded = 'rounded-none';
    else if (seg.sDay === 0) rounded = 'rounded-r-sm';
    else if (seg.eDay === 6) rounded = 'rounded-l-sm';
 }

 html += `<div class="absolute h-[18px] px-1 text-[10px] md:text-[11px] font-bold leading-tight truncate shadow-sm pointer-events-auto cursor-pointer border-b border-black/10 ${color} ${rounded}" style="left: calc(${left}% + 1px); width: calc(${width}% - 2px); top: ${topOffset}px;" onclick="selectDate('${ctx}', ${w.getFullYear()}, ${w.getMonth()}, ${w.getDate() + seg.sDay})" title="${appliedTitle}">${appliedTitle}</div>`;
});
html += `</div></div>`; 
}
html += '</div>';
return html;
}

function getBadgeClass(status, leaveType) {
if(leaveType === 'Public Holiday') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
const safeStatus = String(status || '');
if(safeStatus.includes('Pending')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
if(safeStatus.includes('Cancelled')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
}

function formatStatusBadge(status, leaveType) {
if(leaveType === 'Public Holiday') return 'Holiday';
let s = String(status || '').replace('Approved', 'Cal Updated');
if (s.includes('KAH Limit Crossed')) {
const match = s.match(/KAH Limit Crossed for (.*)\)/);
const dept = match ? match[1] : '';
return `Cal Updated<br><span class="text-[9px] font-bold text-red-600 dark:text-red-400 tracking-tight leading-tight block mt-1">KAH Limit Crossed</span><span class="text-[9px] font-bold text-red-600 dark:text-red-400 tracking-tight leading-none block mt-0.5">${dept}</span>`;
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
let hasMissingValue = false;

// Extract all variables in the line
const matches = line.match(/{.*?}/g) ||[];

for (let match of matches) {
    hasVariables = true;
    let varName = match.replace(/[{}]/g, '');
    let val = vars[varName] !== undefined ? vars[varName] : '';
    
    // If a required variable in the line resolved to an empty string, we mark it missing
    if (!val || val.trim() === '') {
        hasMissingValue = true;
    }
    line = line.replace(match, val);
}

// Only keep the line if it didn't contain an empty variable (or if it had no variables)
// This cleanly hides lines like "Location: {Location}" when Location is empty.
if (hasVariables && hasMissingValue) continue;

if (line.trim() !== '') {
    validLines.push(`<p class="text-xs md:text-sm text-gray-600 dark:text-darkmuted mt-0.5">${line}</p>`);
}
}
return validLines.join('');
}

function buildAgendaHtml(items, isMyCalendar, isInfoAllContext) {
if (!items || items.length === 0) return isInfoAllContext ? '' : `<p class="text-gray-500 dark:text-darkmuted text-center italic mt-2">No records for this date.</p>`;

const ctx = isMyCalendar ? 'my' : 'dash';
const isCollapsed = window.isAgendaCollapsed[ctx];

return items.map(l => {
const isPublicHoliday = l.LeaveType === 'Public Holiday';
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = isPublicHoliday ? true : (typeObj ? typeObj.isEvent : false);

let timeStr = "";
if (isEvent) {
if (String(l.IsAllDay).toUpperCase() === 'TRUE') {
const sD = formatDisplayDate(new Date(l.StartDate));
const eD = formatDisplayDate(new Date(l.EndDate));
timeStr = sD === eD ? `${sD} (All Day)` : `${sD} to ${eD} (All Day)`;
} else {
timeStr = `${formatDisplayDateTime(new Date(l.StartDate))} to ${formatDisplayDateTime(new Date(l.EndDate))}`;
}
if (l.HalfDay && l.HalfDay !== 'NONE' && l.HalfDay !== 'None') {
timeStr += ` <span class="font-bold text-purple-600 dark:text-purple-400">↻ ${l.HalfDay}</span>`;
if (l.UntilDate) timeStr += ` until ${formatDisplayDate(new Date(l.UntilDate))}`;
}
} else {
timeStr = `${formatDisplayDate(new Date(l.StartDate))} to ${formatDisplayDate(new Date(l.EndDate))}`;
}

let actionBtns = '';
let compactActionBtns = '';
if ((String(l.Phone) === String(user.phone) || user.role === 'admin') && l.Status !== 'Cancelled' && !isPublicHoliday) {
actionBtns = `
<button onclick="triggerEdit('${l.ID}')" class="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition shrink-0" title="Edit Record">
  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
</button>
<button onclick="cancelLeave('${l.ID}', '${l.Phone}')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition shrink-0" title="Cancel Record">
  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
</button>`;

compactActionBtns = `
<button onclick="triggerEdit('${l.ID}')" class="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition shrink-0" title="Edit Record">
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
</button>
<button onclick="cancelLeave('${l.ID}', '${l.Phone}')" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition shrink-0" title="Cancel Record">
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
if (l.LocationDetails) locStr += ` - ${l.LocationDetails}`;

if (!isEvent && l.LeaveType === 'Overseas Leave' && l.Country) {
locStr = l.Country + (l.State ? ` (${l.State})` : "");
}

let safeType = (l.LeaveType || "").trim();
let displayType = safeType;

if (safeType === 'Meeting' && l.Remarks) {
displayType = safeType + ": " + l.Remarks.trim();
}

let eventDesc = l.Remarks ? l.Remarks.trim() : displayType;

const tplVars = {
EventType: isPublicHoliday ? 'Public Holiday' : displayType,
Name: l.Name || "",
Department: l.Department || "",
Attendees: applyAcronymsFront(attendeesDisplay) || "",
Location: applyAcronymsFront(locStr) || "",
Time: timeStr || "",
Remarks: l.Remarks || "",
EventDescription: eventDesc
};

let titleRaw = isInfoAllContext ? window.appInfoAllTemplate : window.appAgendaTemplate;
if (isMyCalendar && !isInfoAllContext) titleRaw = '{EventType}'; 
if (isPublicHoliday) titleRaw = '🇸🇬 {Name}';

let titleStr = titleRaw
.replace(/{EventType}/g, tplVars.EventType)
.replace(/{Name}/g, tplVars.Name)
.replace(/{Department}/g, tplVars.Department)
.replace(/{Attendees}/g, tplVars.Attendees)
.replace(/{Location}/g, tplVars.Location)
.replace(/{Time}/g, tplVars.Time)
.replace(/{Remarks}/g, tplVars.Remarks)
.replace(/{EventDescription}/g, tplVars.EventDescription);

titleStr = titleStr.replace(/,\s*(?=[,\)]|$)/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
if (titleStr.endsWith('-')) titleStr = titleStr.slice(0, -1).trim();

const finalTitle = applyAcronymsFront(titleStr);

let detailsRaw = isInfoAllContext ? window.appInfoAllDetailsTemplate : window.appAgendaDetailsTemplate;
if (isPublicHoliday) detailsRaw = '';

const finalDetailsHtml = detailsRaw ? parseAndCleanTemplate(detailsRaw, tplVars) : '';

const hasBody = finalDetailsHtml.trim() !== '' || (isInfoAllContext ? compactActionBtns !== '' : actionBtns !== '');

if (isInfoAllContext) {
return `<div class="p-2.5 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-white/60 dark:bg-black/20 flex flex-col">
 <div class="flex justify-between items-start ${hasBody ? 'cursor-pointer select-none' : ''}" ${hasBody ? 'onclick="toggleAgendaCard(this)"' : ''}>
   <h3 class="font-bold text-[11px] md:text-xs text-blue-900 dark:text-blue-300 flex-grow pr-2">${finalTitle}</h3>
   ${hasBody ? `<svg class="w-4 h-4 text-blue-500 transition-transform duration-200 chevron-icon shrink-0 ${isCollapsed ? '' : 'rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>` : ''}
 </div>
 ${hasBody ? `
 <div class="agenda-card-body ${isCollapsed ? 'hidden-view' : ''}">
   <div class="flex justify-between items-end gap-2 mt-1.5">
     ${finalDetailsHtml ? `<div class="whitespace-pre-wrap flex-grow">${finalDetailsHtml}</div>` : '<div class="flex-grow"></div>'}
     ${compactActionBtns ? `<div class="flex shrink-0 space-x-1">${compactActionBtns}</div>` : ''}
   </div>
 </div>` : ''}
</div>`;
}

return `<div class="border border-gray-300 dark:border-darkborder p-3 md:p-4 rounded-xl shadow-sm bg-white dark:bg-darksurface flex flex-col transition hover:border-blue-300 dark:hover:border-blue-700">
<div class="flex justify-between items-start ${hasBody ? 'cursor-pointer select-none' : ''}" ${hasBody ? 'onclick="toggleAgendaCard(this)"' : ''}>
<div class="flex-grow pr-2">
<h3 class="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 leading-tight">${finalTitle}</h3>
${!isMyCalendar && !isEvent && l.HalfDay !== 'None' && l.HalfDay !== 'NONE' ? `<p class="font-medium text-xs md:text-sm text-gray-700 dark:text-darktext mt-0.5">(${l.HalfDay})</p>` : ''}
</div>
<div class="flex items-center shrink-0">
<span class="text-[10px] md:text-[11px] font-bold px-2 py-1 rounded text-center inline-block leading-tight ${getBadgeClass(l.Status, l.LeaveType)}">${formatStatusBadge(l.Status, l.LeaveType)}</span>
${hasBody ? `<svg class="w-5 h-5 ml-1.5 text-gray-400 dark:text-darkmuted transition-transform duration-200 chevron-icon shrink-0 ${isCollapsed ? '' : 'rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>` : ''}
</div>
</div>
${hasBody ? `
<div class="agenda-card-body ${isCollapsed ? 'hidden-view' : ''}">
  <div class="flex justify-between items-end gap-2 mt-2">
    ${finalDetailsHtml ? `<div class="whitespace-pre-wrap flex-grow pt-1 border-t border-gray-100 dark:border-darkborder/50">${finalDetailsHtml}</div>` : '<div class="flex-grow"></div>'}
    ${actionBtns ? `<div class="flex shrink-0 space-x-1 pb-0.5">${actionBtns}</div>` : ''}
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
    <div class="agenda-day-group mb-6" data-date="${yyyy}-${mm}-${dd}">
        <div class="sticky top-0 bg-gray-50 dark:bg-[#1a1a1a] z-10 py-1.5 border-y border-gray-200 dark:border-darkborder mb-3 shadow-sm px-2 rounded-lg">
            <h3 class="font-bold text-sm md:text-base text-blue-700 dark:text-blue-400">${formatDisplayDate(d)}</h3>
        </div>
        <div class="space-y-3 px-1">
            ${buildAgendaHtml(dayEvents, ctx === 'my' || (ctx==='dash' && document.getElementById('dash-dept-nav').value==='MY_CALENDAR'), false)}
        </div>
    </div>`;
}
}

container.innerHTML = html || `<p class="text-gray-500 dark:text-darkmuted text-center mt-6">No records found.</p>`;

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
group.className = 'agenda-day-group mb-6';
group.dataset.date = dateStr;
group.innerHTML = `
    <div class="sticky top-0 bg-gray-50 dark:bg-[#1a1a1a] z-10 py-1.5 border-y border-gray-200 dark:border-darkborder mb-3 shadow-sm px-2 rounded-lg">
        <h3 class="font-bold text-sm md:text-base text-blue-700 dark:text-blue-400">${formatDisplayDate(targetDateObj)}</h3>
    </div>
    <div class="space-y-3 px-1">
        <p class="text-gray-500 dark:text-darkmuted text-center italic mt-2">No records for this date.</p>
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
const fuse = new Fuse(filtered, { keys:['Name', 'LeaveType', 'Location', 'LocationDetails', 'Country'] });
filtered = fuse.search(q).map(res => res.item);
}

window.dashFilteredLeaves = filtered;

if (dashViewMode === 'agenda') {
renderMiniCalendar('dash');

if (window.agendaDirty) {
 generateContinuousAgenda('dash', filtered);
 window.agendaDirty = false;
}

const agendaEl = document.getElementById('dash-agenda');
if (agendaEl) {
 setTimeout(() => {
     const group = ensureAgendaDateExists('dash', dashDate);
     if (group) group.scrollIntoView({ behavior: 'smooth' });
 }, 10);
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

if (dashViewMode === 'agenda') {
renderMiniCalendar('my');
if (window.myAgendaDirty) {
 generateContinuousAgenda('my', my);
 window.myAgendaDirty = false;
}

const agendaEl = document.getElementById('my-agenda');
if (agendaEl) {
 setTimeout(() => {
     const group = ensureAgendaDateExists('my', myDate);
     if (group) group.scrollIntoView({ behavior: 'smooth' });
 }, 10);
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