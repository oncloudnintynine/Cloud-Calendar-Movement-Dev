// ==========================================
// Calendar & Dashboard Logic
// ==========================================

window.agendaDirty = true;
window.myAgendaDirty = true;
window.isProgrammaticScroll = false;
window.progScrollTimeout = null;

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
    
    let baseClass = "cal-day-cell relative flex items-center justify-center w-5 h-5 mx-auto rounded-full cursor-pointer transition-colors text-[10px] font-medium ";
    if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
    else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";
    
    if (cellDay === d) {
        baseClass = "cal-day-cell relative flex items-center justify-center w-5 h-5 mx-auto rounded-full cursor-pointer transition-colors text-[10px] font-bold bg-blue-600 text-white shadow-md ";
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
                if (isDash) dashMonth = new Date(y, m - 1, 1);
                else myMonth = new Date(y, m - 1, 1);
                renderMiniCalendar(ctx);
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

let baseClass = "cal-day-cell relative flex items-center justify-center w-5 h-5 mx-auto rounded-full cursor-pointer transition-colors text-[10px] font-medium ";
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
      const color = seg.isLeave ? 'bg-[#e26d5c] dark:bg-[#c25a4a] text-white' : (seg.len > 1 ? 'bg-[#f4c264] dark:bg-[#d6a54d] text-gray-900' : 'bg-[#50b182] dark:bg-[#3d9369] text-white');
      
      let locStr = seg.l.Location || '';
      if (seg.l.LocationDetails) locStr += ` - ${seg.l.LocationDetails}`;

      const safeType = (seg.l.LeaveType || "").trim();
      const displayType = safeType === 'Meeting' && seg.l.Remarks ? `${safeType}: ${seg.l.Remarks.trim()}` : safeType;
      const title = seg.isLeave ? `${seg.l.Name.split(' ')[0]} : ${displayType}` : displayType;
      const appliedTitle = applyAcronymsFront(title);
      
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

function getBadgeClass(status) {
const safeStatus = String(status || '');
if(safeStatus.includes('Pending')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
if(safeStatus.includes('Cancelled')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
}

function formatStatusBadge(status) {
let s = String(status || '').replace('Approved', 'Cal Updated');
if (s.includes('KAH Limit Crossed')) {
const match = s.match(/KAH Limit Crossed for (.*)\)/);
const dept = match ? match[1] : '';
return `Cal Updated<br><span class="text-[9px] font-bold text-red-600 dark:text-red-400 tracking-tight leading-tight block mt-1">KAH Limit Crossed</span><span class="text-[9px] font-bold text-red-600 dark:text-red-400 tracking-tight leading-none block mt-0.5">${dept}</span>`;
}
return s;
}

function buildAgendaHtml(items, isMyCalendar, isCompactInfoAll) {
if (!items || items.length === 0) return isCompactInfoAll ? '' : `<p class="text-gray-500 dark:text-darkmuted text-center italic mt-2">No records for this date.</p>`;

return items.map(l => {
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = typeObj ? typeObj.isEvent : false;

let timeStr = "";
if (isEvent) {
  if (l.IsAllDay === 'TRUE') {
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
if ((String(l.Phone) === String(user.phone) || user.role === 'admin') && l.Status !== 'Cancelled') {
  actionBtns = `<div class="flex space-x-3 mt-3 pt-3 border-t border-gray-200 dark:border-darkborder"><button onclick="triggerEdit('${l.ID}')" class="font-bold bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-1.5 rounded-lg transition">Edit</button><button onclick="cancelLeave('${l.ID}', '${l.Phone}')" class="font-bold bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-1.5 rounded-lg transition">Cancel</button></div>`;
}

let attendeesDisplay = '';
if (l.Attendees) {
  try {
    const attArr = JSON.parse(l.Attendees);
    if (attArr && attArr.length > 0) attendeesDisplay = attArr.map(a => a.type === 'group' ? a.name.replace('zz KAH: ', '').replace('zz ', '') : a.name).join(', ');
  } catch(e) {}
}

let locStr = l.Location || '';
if (l.LocationDetails) locStr += ` - ${l.LocationDetails}`;

let safeType = (l.LeaveType || "").trim();
let displayType = safeType;
let showRemarksInBody = l.Remarks ? true : false;

// Inject remarks into the header title for Meetings
if (safeType === 'Meeting' && l.Remarks) {
    displayType = safeType + ": " + l.Remarks.trim();
    showRemarksInBody = false; // Hide from body to prevent redundancy
}

let titleRaw = window.appAgendaTemplate || '{EventType} - {Name} ({Department})';
if (isMyCalendar) titleRaw = '{EventType}'; 

let titleStr = titleRaw
   .replace(/{EventType}/g, displayType)
   .replace(/{Name}/g, l.Name || "")
   .replace(/{Department}/g, l.Department || "")
   .replace(/{Attendees}/g, attendeesDisplay || "")
   .replace(/{Location}/g, locStr || l.Country || "")
   .replace(/{Time}/g, timeStr || "")
   .replace(/{Remarks}/g, l.Remarks || "");

titleStr = titleStr.replace(/,\s*(?=[,\)]|$)/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
if (titleStr.endsWith('-')) titleStr = titleStr.slice(0, -1).trim();

const finalTitle = applyAcronymsFront(titleStr);
const finalLocation = applyAcronymsFront(locStr);
const finalCountry = applyAcronymsFront(l.Country);

if (isCompactInfoAll) {
    return `<div class="border border-blue-300 dark:border-blue-800 p-2.5 rounded-xl shadow-sm bg-blue-50/50 dark:bg-blue-900/10 flex flex-col">
      <h3 class="font-bold text-sm text-blue-800 dark:text-blue-300 mb-0.5">${finalTitle}</h3>
      <p class="text-[11px] text-gray-500 dark:text-darkmuted"><span class="font-semibold text-gray-700 dark:text-darktext">Time:</span> ${timeStr}</p>
      ${finalLocation ? `<p class="text-[11px] text-gray-500 dark:text-darkmuted mt-0.5"><span class="font-semibold text-gray-700 dark:text-darktext">Location:</span> ${finalLocation}</p>` : ''}
      ${attendeesDisplay ? `<p class="text-[11px] text-gray-500 dark:text-darkmuted mt-0.5"><span class="font-semibold text-gray-700 dark:text-darktext">Attendees:</span> ${attendeesDisplay}</p>` : ''}
      ${showRemarksInBody ? `<p class="text-[11px] text-gray-500 dark:text-darkmuted mt-0.5 italic">"${l.Remarks}"</p>` : ''}
    </div>`;
}

return `<div class="border border-gray-300 dark:border-darkborder p-3 md:p-4 rounded-xl shadow-sm bg-gray-50 dark:bg-darkinput flex flex-col">
  <div class="flex justify-between items-start mb-2">
    <h3 class="font-bold text-sm md:text-base">${finalTitle}</h3>
    <span class="text-[10px] md:text-[11px] font-bold px-2 py-1 rounded text-center inline-block leading-tight shrink-0 ml-2 ${getBadgeClass(l.Status)}">${formatStatusBadge(l.Status)}</span>
  </div>
  ${!isMyCalendar && !isEvent && l.HalfDay !== 'None' && l.HalfDay !== 'NONE' ? `<p class="font-medium text-xs md:text-sm text-gray-700 dark:text-darktext">(${l.HalfDay})</p>` : ''}
  <p class="text-xs md:text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Time:</span> ${timeStr}</p>
  ${isEvent && finalLocation ? `<p class="text-xs md:text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Location:</span> ${finalLocation}</p>` : ''}
  ${!isEvent && finalCountry ? `<p class="text-xs md:text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Country:</span> ${finalCountry} ${l.State ? `(${l.State})` : ''}</p>` : ''}
  ${isMyCalendar && !isEvent && l.CoveringPerson && l.CoveringPerson !== 'N/A' ? `<p class="text-xs md:text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Covering:</span> ${l.CoveringPerson}</p>` : ''}
  ${attendeesDisplay ? `<p class="text-xs md:text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Attendees:</span> ${attendeesDisplay}</p>` : ''}
  ${showRemarksInBody ? `<p class="text-xs md:text-sm text-gray-500 dark:text-darkmuted mt-1 italic">"${l.Remarks}"</p>` : ''}
  ${actionBtns}
</div>`;
}).join('');
}

function generateContinuousAgenda(ctx, data) {
 const container = document.getElementById(`${ctx}-agenda`);
 if (!container) return;

 const targetDate = ctx === 'dash' ? dashDate : myDate;
 const start = new Date(targetDate.getFullYear(), targetDate.getMonth() - 2, 1);
 const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 6, 0);
 
 let html = '';
 for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
     const dayEvents = data.filter(l => l.InfoAll !== 'TRUE' && isEventOnDate(l, d));
     
     if (dayEvents.length > 0 || d.toDateString() === targetDate.toDateString()) {
         const yyyy = d.getFullYear();
         const mm = String(d.getMonth() + 1).padStart(2, '0');
         const dd = String(d.getDate()).padStart(2, '0');
         
         html += `
         <div class="agenda-day-group mb-6" data-date="${yyyy}-${mm}-${dd}">
             <div class="sticky top-0 bg-white dark:bg-darksurface z-10 py-1 border-b border-gray-200 dark:border-darkborder mb-2 shadow-sm">
                 <h3 class="font-bold text-sm md:text-base text-blue-600 dark:text-blue-400 pl-1">${formatDisplayDate(d)}</h3>
             </div>
             <div class="space-y-2">
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
         <div class="sticky top-0 bg-white dark:bg-darksurface z-10 py-1 border-b border-gray-200 dark:border-darkborder mb-2 shadow-sm">
             <h3 class="font-bold text-sm md:text-base text-blue-600 dark:text-blue-400 pl-1">${formatDisplayDate(targetDateObj)}</h3>
         </div>
         <div class="space-y-2">
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

  const infoAllEvents = filtered.filter(l => l.InfoAll === 'TRUE' && isEventOnDate(l, dashDate));
  const infoAllContainer = document.getElementById('dash-infoall-container');
  const infoAllList = document.getElementById('dash-infoall-list');
  if (infoAllEvents.length > 0 && infoAllContainer && infoAllList) {
      infoAllList.innerHTML = buildAgendaHtml(infoAllEvents, false, true);
      infoAllContainer.classList.remove('hidden-view');
  } else if (infoAllContainer) {
      infoAllContainer.classList.add('hidden-view');
  }
} else {
  const monthTitleEl = document.getElementById('dash-month-title');
  if (monthTitleEl) monthTitleEl.innerText = mos[dashMonth.getMonth()] + ' ' + dashMonth.getFullYear();
  
  const monthGridEl = document.getElementById('dash-month-grid');
  if (monthGridEl) monthGridEl.innerHTML = buildFullMonthGrid(dashMonth, filtered, 'dash');
}
}

function renderMyLeaves() {
const my = allLeaves.filter(l => {
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
} else {
  const monthTitleEl = document.getElementById('my-month-title');
  if (monthTitleEl) monthTitleEl.innerText = mos[myMonth.getMonth()] + ' ' + myMonth.getFullYear();
  
  const monthGridEl = document.getElementById('my-month-grid');
  if (monthGridEl) monthGridEl.innerHTML = buildFullMonthGrid(myMonth, my, 'my');
}
}