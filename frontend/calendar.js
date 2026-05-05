// ==========================================
// Calendar & Dashboard Logic
// ==========================================

function toggleDashView(mode) {
  dashViewMode = mode;
  const btnAgenda = document.getElementById('btn-dash-agenda');
  const btnMonth = document.getElementById('btn-dash-month');
  const wrapAgenda = document.getElementById('dash-agenda-wrapper');
  const wrapMonth = document.getElementById('dash-month-wrapper');

  const activeClass =['bg-white', 'dark:bg-darksurface', 'shadow', 'text-blue-600', 'dark:text-blue-400'];
  const inactiveClass =['text-gray-500', 'dark:text-darkmuted', 'hover:text-gray-800', 'dark:hover:text-gray-200'];

  if (mode === 'agenda') {
    btnAgenda.classList.add(...activeClass); btnAgenda.classList.remove(...inactiveClass);
    btnMonth.classList.remove(...activeClass); btnMonth.classList.add(...inactiveClass);
    wrapAgenda.classList.remove('hidden-view');
    wrapMonth.classList.add('hidden-view');
  } else {
    btnMonth.classList.add(...activeClass); btnMonth.classList.remove(...inactiveClass);
    btnAgenda.classList.remove(...activeClass); btnAgenda.classList.add(...inactiveClass);
    wrapMonth.classList.remove('hidden-view');
    wrapMonth.classList.add('flex');
    wrapAgenda.classList.add('hidden-view');
  }
  renderDashboard();
}

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
  if (ctx === 'dash') { 
    dashDate = new Date(y, m, d); 
    toggleDashView('agenda');
    updateMiniCalendarSelection('dash', d);
    const group = document.querySelector(`#dash-agenda .agenda-day-group[data-day="${d}"]`);
    if (group) group.scrollIntoView({ behavior: 'smooth' });
  } else { 
    myDate = new Date(y, m, d); 
    updateMiniCalendarSelection('my', d);
    const group = document.querySelector(`#my-agenda .agenda-day-group[data-day="${d}"]`);
    if (group) group.scrollIntoView({ behavior: 'smooth' });
  }
}

// Highly efficient DOM update for the mini calendar selection
function updateMiniCalendarSelection(ctx, d) {
    const grid = document.getElementById(`${ctx}-cal-grid`);
    if (!grid) return;
    const cells = grid.querySelectorAll('.cal-day-cell');
    cells.forEach(cell => {
        const cellDay = parseInt(cell.dataset.day);
        const isToday = cell.dataset.istoday === 'true';
        
        cell.className = `cal-day-cell relative flex items-center justify-center w-6 h-6 mx-auto rounded-full cursor-pointer transition-colors text-xs font-medium ${isToday ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500' : 'hover:bg-gray-200 dark:hover:bg-darkhover'}`;
        
        if (cellDay === d) {
            cell.className = `cal-day-cell relative flex items-center justify-center w-6 h-6 mx-auto rounded-full cursor-pointer transition-colors text-xs font-bold bg-blue-600 text-white shadow-md`;
        }
        
        const hasEvent = cell.dataset.hasevent === 'true';
        if (hasEvent) {
            const dotColor = cellDay === d ? 'bg-white' : 'bg-blue-500';
            cell.innerHTML = `${cellDay}<div class="absolute bottom-0 w-1 h-1 ${dotColor} rounded-full"></div>`;
        } else {
            cell.innerHTML = `${cellDay}`;
        }
    });
}

function handleAgendaScroll(ctx) {
    const container = document.getElementById(`${ctx}-agenda`);
    const groups = container.querySelectorAll('.agenda-day-group');
    let topDay = null;
    
    for (const group of groups) {
        const rect = group.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Find the group currently crossing the top of the container
        if (rect.top >= containerRect.top && rect.top <= containerRect.top + 100) {
            topDay = parseInt(group.dataset.day); break;
        } else if (rect.top < containerRect.top && rect.bottom > containerRect.top) {
            topDay = parseInt(group.dataset.day); break;
        }
    }
    
    if (topDay) {
        if (ctx === 'dash' && dashDate.getDate() !== topDay) {
            dashDate.setDate(topDay);
            updateMiniCalendarSelection('dash', topDay);
        } else if (ctx === 'my' && myDate.getDate() !== topDay) {
            myDate.setDate(topDay);
            updateMiniCalendarSelection('my', topDay);
        }
    }
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

    let baseClass = "cal-day-cell relative flex items-center justify-center w-6 h-6 mx-auto rounded-full cursor-pointer transition-colors text-xs font-medium ";
    if (isSelected) baseClass += "bg-blue-600 text-white font-bold shadow-md ";
    else if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-1 dark:ring-blue-500 font-bold ";
    else baseClass += "hover:bg-gray-200 dark:hover:bg-darkhover ";

    const dotColor = isSelected ? 'bg-white' : 'bg-blue-500';
    const dot = hasEvent ? `<div class="absolute bottom-0 w-1 h-1 ${dotColor} rounded-full"></div>` : '';

    html += `<div class="${baseClass}" data-day="${d}" data-istoday="${isToday}" data-hasevent="${hasEvent}" onclick="selectDate('${ctx}', ${y}, ${m}, ${d})">${d}${dot}</div>`;
  }
  return html;
}

function buildFullMonthGrid(monthDate, data) {
  const y = monthDate.getFullYear(); const m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay(); 
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  
  let html = '<div class="grid grid-cols-7 flex-grow auto-rows-fr">'; 
  for(let i=0; i<firstDay; i++) html += `<div class="border-r border-b dark:border-darkborder bg-gray-50/50 dark:bg-[#151515]"></div>`;

  for(let d=1; d<=daysInMonth; d++) {
    const current = new Date(y, m, d); current.setHours(0,0,0,0);
    const isToday = current.toDateString() === new Date().toDateString();
    const dayEvents = data.filter(l => isEventOnDate(l, current));
    
    html += `<div class="border-r border-b dark:border-darkborder p-1 relative flex flex-col overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-darkhover transition-colors" onclick="selectDate('dash', ${y}, ${m}, ${d})">`;
    html += `<div class="text-xs font-bold mb-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-500 dark:text-darkmuted'}">${d}</div>`;
    
    html += `<div class="flex flex-col space-y-0.5 overflow-hidden">`;
    dayEvents.slice(0, 4).forEach(l => {
        const isLeave = window.appLeaveTypes && window.appLeaveTypes.includes(l.LeaveType);
        const color = isLeave ? 'bg-orange-400 dark:bg-orange-500' : 'bg-blue-500 dark:bg-blue-600';
        const title = isLeave ? `${l.Name.split(' ')[0]}: ${l.LeaveType}` : `${l.LeaveType}`;
        html += `<div class="${color} text-white text-[9px] md:text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium shadow-sm">${title}</div>`;
    });
    if (dayEvents.length > 4) {
        html += `<div class="text-[10px] text-gray-500 font-bold pl-1">+${dayEvents.length - 4} more</div>`;
    }
    html += `</div></div>`;
  }
  html += '</div>';
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
  if (!items || items.length === 0) return isCompactInfoAll ? '' : `<p class="text-gray-500 dark:text-darkmuted text-center italic mt-2">No records for this date.</p>`;
  
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

  if (dashViewMode === 'agenda') {
      const monthEl = document.getElementById('dash-cal-month');
      if (monthEl) monthEl.innerText = mos[dashMonth.getMonth()] + ' ' + dashMonth.getFullYear();
      
      const gridEl = document.getElementById('dash-cal-grid');
      if (gridEl) gridEl.innerHTML = buildCalendarHTML('dash', dashMonth, dashDate, filtered);
      
      // Continuous Scroll Generation
      const daysInMonth = new Date(dashMonth.getFullYear(), dashMonth.getMonth() + 1, 0).getDate();
      let agendaHtml = '';
      
      for(let day=1; day<=daysInMonth; day++) {
          const curDate = new Date(dashMonth.getFullYear(), dashMonth.getMonth(), day);
          const dayEvents = filtered.filter(l => l.InfoAll !== 'TRUE' && isEventOnDate(l, curDate));
          
          if (dayEvents.length > 0 || curDate.toDateString() === dashDate.toDateString()) {
              agendaHtml += `
                <div class="agenda-day-group mb-6" data-day="${day}">
                    <div class="sticky top-0 bg-white dark:bg-darksurface z-10 py-1 border-b dark:border-darkborder mb-3">
                        <h3 class="font-bold text-blue-600 dark:text-blue-400">${formatDisplayDate(curDate)}</h3>
                    </div>
                    <div class="space-y-3">
                        ${buildAgendaHtml(dayEvents, d === 'MY_CALENDAR', false)}
                    </div>
                </div>
              `;
          }
      }
      
      const agendaEl = document.getElementById('dash-agenda');
      if (agendaEl) {
          agendaEl.innerHTML = agendaHtml || `<p class="text-gray-500 dark:text-darkmuted text-center mt-6">No records for this month.</p>`;
          agendaEl.removeEventListener('scroll', () => handleAgendaScroll('dash'));
          agendaEl.addEventListener('scroll', () => handleAgendaScroll('dash'));
          
          // Auto-scroll to selected date on render
          setTimeout(() => {
              const group = agendaEl.querySelector(`.agenda-day-group[data-day="${dashDate.getDate()}"]`);
              if (group) group.scrollIntoView();
          }, 10);
      }

      // Info All Events
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
      if (monthGridEl) monthGridEl.innerHTML = buildFullMonthGrid(dashMonth, filtered);
  }
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
  
  const daysInMonth = new Date(myMonth.getFullYear(), myMonth.getMonth() + 1, 0).getDate();
  let agendaHtml = '';
  
  for(let day=1; day<=daysInMonth; day++) {
      const curDate = new Date(myMonth.getFullYear(), myMonth.getMonth(), day);
      const dayEvents = my.filter(l => isEventOnDate(l, curDate));
      
      if (dayEvents.length > 0 || curDate.toDateString() === myDate.toDateString()) {
          agendaHtml += `
            <div class="agenda-day-group mb-6" data-day="${day}">
                <div class="sticky top-0 bg-white dark:bg-darksurface z-10 py-1 border-b dark:border-darkborder mb-3">
                    <h3 class="font-bold text-blue-600 dark:text-blue-400">${formatDisplayDate(curDate)}</h3>
                </div>
                <div class="space-y-3">
                    ${buildAgendaHtml(dayEvents, true, false)}
                </div>
            </div>
          `;
      }
  }

  const agendaEl = document.getElementById('my-agenda');
  if (agendaEl) {
      agendaEl.innerHTML = agendaHtml || `<p class="text-gray-500 dark:text-darkmuted text-center mt-6">No records for this month.</p>`;
      agendaEl.removeEventListener('scroll', () => handleAgendaScroll('my'));
      agendaEl.addEventListener('scroll', () => handleAgendaScroll('my'));
      
      setTimeout(() => {
          const group = agendaEl.querySelector(`.agenda-day-group[data-day="${myDate.getDate()}"]`);
          if (group) group.scrollIntoView();
      }, 10);
  }
}
