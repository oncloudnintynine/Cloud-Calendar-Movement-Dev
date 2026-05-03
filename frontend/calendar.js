// ==========================================
// Calendar & Dashboard Logic
// ==========================================

async function loadLeavesData() {
  try { 
    allLeaves = await apiCall('getLeaves'); 
    renderDashboard(); 
    renderMyLeaves(); 
    
    const paradeView = document.getElementById('view-parade-state');
    if(paradeView && !paradeView.classList.contains('hidden-view') && typeof renderParadeState === 'function') {
      renderParadeState(); 
    }
  } catch (err) { console.error("Error loading leaves data: ", err); }
}

function changeMonth(ctx, offset) {
  if (ctx === 'dash') { dashMonth.setMonth(dashMonth.getMonth() + offset); renderDashboard(); } 
  else { myMonth.setMonth(myMonth.getMonth() + offset); renderMyLeaves(); }
}

function selectDate(ctx, y, m, d) {
  if (ctx === 'dash') { dashDate = new Date(y, m, d); renderDashboard(); } 
  else { myDate = new Date(y, m, d); renderMyLeaves(); }
}

function isEventOnDate(l, targetDate) {
  if (l.Status === 'Cancelled') return false;
  
  const s = new Date(l.StartDate); s.setHours(0,0,0,0);
  const e = new Date(l.EndDate); e.setHours(0,0,0,0);
  const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
  
  if (!isEvent || !l.HalfDay || l.HalfDay === 'NONE' || l.HalfDay === 'None') return targetDate >= s && targetDate <= e;
  
  const untilStr = l.UntilDate;
  const untilD = untilStr ? new Date(untilStr) : new Date(s.getTime() + 31536000000); 
  untilD.setHours(23,59,59,999);

  if (targetDate < s || targetDate > untilD) return false;
  if (targetDate >= s && targetDate <= e) return true;

  if (l.HalfDay === 'DAILY') return true;
  if (l.HalfDay === 'WEEKDAY') return targetDate.getDay() !== 0 && targetDate.getDay() !== 6;
  
  const diffTime = targetDate.getTime() - s.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (l.HalfDay === 'WEEKLY') return diffDays % 7 === 0;
  if (l.HalfDay === 'MONTHLY') return targetDate.getDate() === s.getDate();
  if (l.HalfDay === 'ANNUALLY') return targetDate.getMonth() === s.getMonth() && targetDate.getDate() === s.getDate();
  
  return false;
}

function buildCalendarHTML(ctx, monthDate, selDate, data) {
  const y = monthDate.getFullYear(); const m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay(); 
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  
  let html = ''; for(let i=0; i<firstDay; i++) html += `<div></div>`;

  for(let d=1; d<=daysInMonth; d++) {
    const current = new Date(y, m, d); current.setHours(0,0,0,0);
    const isSelected = current.toDateString() === selDate.toDateString();
    const isToday = current.toDateString() === new Date().toDateString();

    const hasEvent = data.some(l => isEventOnDate(l, current));

    let baseClass = "w-7 h-7 text-xs flex items-center justify-center rounded-full mx-auto cursor-pointer transition-colors relative ";
    if (isSelected) baseClass += "bg-blue-600 text-white font-bold shadow-md ";
    else if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
    else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";

    const dot = hasEvent && !isSelected ? `<div class="absolute bottom-0.5 w-1 h-1 bg-blue-500 rounded-full"></div>` : '';
    const selDot = hasEvent && isSelected ? `<div class="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></div>` : '';

    html += `<div class="${baseClass}" onclick="selectDate('${ctx}', ${y}, ${m}, ${d})">${d}${dot}${selDot}</div>`;
  }
  return html;
}

function getBadgeClass(status) {
  const safeStatus = String(status || '');
  if(safeStatus.includes('Pending')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if(safeStatus.includes('Cancelled')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
}

function formatStatusBadge(status) {
  let s = String(status || '').replace('Approved', 'Cal Updated');
  if (s.includes('KAH Limit Reached')) return `Cal Updated<br><span class="text-[9px] font-bold opacity-90 tracking-tight leading-none block mt-0.5">(KAH Limit Reached)</span>`;
  return s;
}

function buildAgendaHtml(items, isMyCalendar, isCompactInfoAll) {
  if (!items || items.length === 0) return isCompactInfoAll ? '' : `<p class="text-gray-500 dark:text-darkmuted text-center mt-6">No records for this date.</p>`;
  
  return items.map(l => {
    const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
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
    // Enable edit/cancel if it's My Calendar OR if Admin
    if ((isMyCalendar || user.role === 'admin') && l.Status !== 'Cancelled') {
      actionBtns = `<div class="flex space-x-3 mt-3 pt-3 border-t dark:border-darkborder"><button onclick="triggerEdit('${l.ID}')" class="font-bold bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-lg transition">Edit</button><button onclick="cancelLeave('${l.ID}', '${l.Phone}')" class="font-bold bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-lg transition">Cancel</button></div>`;
    }

    let attendeesDisplay = '';
    if (l.Attendees) {
      try {
        const attArr = JSON.parse(l.Attendees);
        if (attArr && attArr.length > 0) attendeesDisplay = attArr.map(a => a.type === 'group' ? a.name.replace('zz ', '') : a.name).join(', ');
      } catch(e) {}
    }

    if (isCompactInfoAll) {
        return `<div class="border border-blue-200 dark:border-blue-900/50 p-3 rounded-xl shadow-sm bg-blue-50/50 dark:bg-blue-900/10 flex flex-col">
          <h3 class="font-bold text-sm text-blue-800 dark:text-blue-300 mb-0.5">${l.LeaveType}</h3>
          <p class="text-xs text-gray-500 dark:text-darkmuted"><span class="font-semibold text-gray-700 dark:text-darktext">Time:</span> ${timeStr}</p>
          ${l.Location ? `<p class="text-xs text-gray-500 dark:text-darkmuted mt-0.5"><span class="font-semibold text-gray-700 dark:text-darktext">Location:</span> ${l.Location}</p>` : ''}
          ${attendeesDisplay ? `<p class="text-xs text-gray-500 dark:text-darkmuted mt-0.5"><span class="font-semibold text-gray-700 dark:text-darktext">Attendees:</span> ${attendeesDisplay}</p>` : ''}
          ${l.Remarks ? `<p class="text-xs text-gray-500 dark:text-darkmuted mt-0.5 italic">"${l.Remarks}"</p>` : ''}
        </div>`;
    }

    return `<div class="border border-gray-200 dark:border-darkborder p-4 rounded-xl shadow-sm bg-gray-50 dark:bg-darkinput flex flex-col">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-base">${isMyCalendar ? (l.LeaveType||'') : (l.Name||'') + ' <span class="font-normal text-gray-500 dark:text-darkmuted text-sm">(' + (l.Department||'') + ')</span>'}</h3>
        <span class="text-[11px] font-bold px-2 py-1 rounded text-center inline-block leading-tight ${getBadgeClass(l.Status)}">${formatStatusBadge(l.Status)}</span>
      </div>
      <p class="font-medium text-gray-700 dark:text-darktext">${isMyCalendar ? '' : (l.LeaveType||'') + ' '}${!isEvent && l.HalfDay !== 'None' && l.HalfDay !== 'NONE' ? '('+l.HalfDay+')' : ''}</p>
      <p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Time:</span> ${timeStr}</p>
      ${isEvent && l.Location ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Location:</span> ${l.Location}</p>` : ''}
      ${!isEvent && l.Country ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Country:</span> ${l.Country} ${l.State ? `(${l.State})` : ''}</p>` : ''}
      ${isMyCalendar && !isEvent && l.CoveringPerson && l.CoveringPerson !== 'N/A' ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Covering:</span> ${l.CoveringPerson}</p>` : ''}
      ${attendeesDisplay ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Attendees:</span> ${attendeesDisplay}</p>` : ''}
      ${l.Remarks ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1 italic">"${l.Remarks}"</p>` : ''}
      ${actionBtns}
    </div>`;
  }).join('');
}

function renderDashboard() {
  const searchEl = document.getElementById('dash-search');
  const q = searchEl ? searchEl.value.toLowerCase() : '';
  
  const deptNav = document.getElementById('dash-dept-nav');
  const d = deptNav ? deptNav.value : '';
  
  let filtered = allLeaves.filter(l => l.Status !== 'Cancelled');
  
  // My Calendar Unified Logic
  if (d === 'MY_CALENDAR') {
    filtered = filtered.filter(l => {
      if (l.Phone == user.phone) return true;
      if (l.Attendees) {
        try {
          const att = JSON.parse(l.Attendees);
          return att.some(a => (a.type === 'contact' && a.id == user.phone) || (a.type === 'group' && user.departments.includes(a.dept)));
        } catch(e) { return String(l.Attendees).includes(user.phone); }
      }
      return false;
    });
  } else if (d) {
    filtered = filtered.filter(l => String(l.Department||'').includes(d));
  }
  
  if (q) {
    const fuse = new Fuse(filtered, { keys:['Name', 'LeaveType'] });
    filtered = fuse.search(q).map(res => res.item);
  }

  const monthEl = document.getElementById('dash-cal-month');
  if (monthEl) monthEl.innerText = mos[dashMonth.getMonth()] + ' ' + dashMonth.getFullYear();
  
  const gridEl = document.getElementById('dash-cal-grid');
  if (gridEl) gridEl.innerHTML = buildCalendarHTML('dash', dashMonth, dashDate, filtered);
  
  const titleEl = document.getElementById('dash-agenda-title');
  if (titleEl) titleEl.innerText = formatDisplayDate(dashDate);

  const dashTarget = new Date(dashDate); dashTarget.setHours(0,0,0,0);
  
  const infoAllEvents = filtered.filter(l => l.InfoAll === 'TRUE' && isEventOnDate(l, dashTarget));
  const infoAllContainer = document.getElementById('dash-infoall-container');
  const infoAllList = document.getElementById('dash-infoall-list');
  
  if (infoAllEvents.length > 0 && infoAllContainer && infoAllList) {
      infoAllList.innerHTML = buildAgendaHtml(infoAllEvents, false, true);
      infoAllContainer.classList.remove('hidden-view');
  } else if (infoAllContainer) {
      infoAllContainer.classList.add('hidden-view');
  }

  const itemsForDate = filtered.filter(l => l.InfoAll !== 'TRUE' && isEventOnDate(l, dashTarget));
  const agendaEl = document.getElementById('dash-agenda');
  if (agendaEl) agendaEl.innerHTML = buildAgendaHtml(itemsForDate, d === 'MY_CALENDAR', false);
}

function renderMyLeaves() {
  const my = allLeaves.filter(l => {
    if (l.Phone == user.phone) return true;
    if (l.Attendees) {
      try {
        const att = JSON.parse(l.Attendees);
        return att.some(a => (a.type === 'contact' && a.id == user.phone) || (a.type === 'group' && user.departments.includes(a.dept)));
      } catch(e) { return String(l.Attendees).includes(user.phone); }
    }
    return false;
  });
  
  const monthEl = document.getElementById('my-cal-month');
  if (monthEl) monthEl.innerText = mos[myMonth.getMonth()] + ' ' + myMonth.getFullYear();
  
  const gridEl = document.getElementById('my-cal-grid');
  if (gridEl) gridEl.innerHTML = buildCalendarHTML('my', myMonth, myDate, my);
  
  const titleEl = document.getElementById('my-agenda-title');
  if (titleEl) titleEl.innerText = formatDisplayDate(myDate);

  const myTarget = new Date(myDate); myTarget.setHours(0,0,0,0);
  const itemsForDate = my.filter(l => isEventOnDate(l, myTarget));
  
  const agendaEl = document.getElementById('my-agenda');
  if (agendaEl) agendaEl.innerHTML = buildAgendaHtml(itemsForDate, true, false);

  const cancelledLeaves = my.filter(l => l.Status === 'Cancelled');
  const cancelContainer = document.getElementById('cancelled-leaves-container');
  
  if (cancelContainer) {
    cancelContainer.innerHTML = cancelledLeaves.length 
      ? `<details class="group cursor-pointer text-sm">
           <summary class="font-bold text-gray-700 dark:text-darktext select-none outline-none flex items-center list-none[&::-webkit-details-marker]:hidden">
             <svg class="w-5 h-5 mr-1 transition-transform duration-200 transform group-open:rotate-90 text-gray-700 dark:text-darktext" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
             <span class="text-gray-700 dark:text-darktext">Cancelled (${cancelledLeaves.length})</span>
           </summary>
           <div class="grid gap-3 mt-3 cursor-default pl-6">${buildAgendaHtml(cancelledLeaves, true, false)}</div>
         </details>`
      : '';
  }
}
