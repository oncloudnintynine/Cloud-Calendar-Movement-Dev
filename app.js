// --- Global State ---
let user = JSON.parse(localStorage.getItem('user')) || null;
let allLeaves =[];
let currentEditId = null;

let companyContacts = [];
let validContactNames =[];
let fuseAllContacts = null;
let fuseAttendees = null;

// Form & Admin State
let tempLeaveTypes = [];
let adminKAHList =[];
let tempMenuOrder = [];
let eventAttendees =[]; 

let appData = {
  leave: { startD: new Date(), endD: new Date(), startAMPM: 'AM', endAMPM: 'PM' },
  event: { startD: new Date(), endD: new Date() }
};

let dashDate = new Date(); dashDate.setHours(0,0,0,0);
let myDate = new Date(); myDate.setHours(0,0,0,0);
let dashMonth = new Date(dashDate.getFullYear(), dashDate.getMonth(), 1);
let myMonth = new Date(myDate.getFullYear(), myDate.getMonth(), 1);

if(localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');

document.addEventListener('DOMContentLoaded', () => {
  if (ENV === 'Dev') document.getElementById('dev-banner').classList.remove('hidden');
  if (user) showApp(); else showLogin();
  document.getElementById('login-pass').addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
  
  document.addEventListener('click', function(e) {
    if(!e.target.closest('#form-leave-cover') && !e.target.closest('#cover-results-leave')) {
      const resCL = document.getElementById('cover-results-leave');
      if(resCL) resCL.classList.add('hidden-view');
    }
    if(!e.target.closest('#form-event-attendee-search') && !e.target.closest('#attendees-results')) {
      const resA = document.getElementById('attendees-results');
      if(resA) resA.classList.add('hidden-view');
    }
    if(!e.target.closest('#kah-search') && !e.target.closest('#kah-results')) {
      const resK = document.getElementById('kah-results');
      if(resK) resK.classList.add('hidden-view');
    }
  });
  initDates();
});

// --- Menu UI Logic ---
function toggleMenu() {
  const menu = document.getElementById('slide-menu');
  const panel = document.getElementById('slide-menu-panel');
  if (menu.classList.contains('hidden-view')) {
    menu.classList.remove('hidden-view');
    setTimeout(() => { panel.classList.remove('-translate-x-full'); }, 10);
  } else closeMenu();
}
function closeMenu() {
  const menu = document.getElementById('slide-menu');
  const panel = document.getElementById('slide-menu-panel');
  panel.classList.add('-translate-x-full');
  setTimeout(() => { menu.classList.add('hidden-view'); }, 300); 
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}
function togglePassword(id, btnElement) {
  const el = document.getElementById(id);
  const isPassword = el.type === 'password';
  el.type = isPassword ? 'text' : 'password';
  if (btnElement) {
    btnElement.innerHTML = isPassword 
      ? `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`
      : `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
  }
}

const mos =['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDisplayDate(dateObj) {
  if (isNaN(dateObj)) return '';
  return `${String(dateObj.getDate()).padStart(2,'0')} ${mos[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}
function formatDisplayDateTime(dateObj) {
  if (isNaN(dateObj)) return '';
  return `${formatDisplayDate(dateObj)} ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
}

function initDates() {
  const now = new Date();
  appData.leave.startD = new Date(now); appData.leave.endD = new Date(now);
  appData.event.startD = new Date(now); appData.event.endD = new Date(now);
  updateButtonLabels();
}
function updateButtonLabels() {
  document.getElementById('btn-leave-start').innerText = formatDisplayDate(appData.leave.startD);
  document.getElementById('btn-leave-end').innerText = formatDisplayDate(appData.leave.endD);
  document.getElementById('btn-event-start').innerText = formatDisplayDateTime(appData.event.startD);
  document.getElementById('btn-event-end').innerText = formatDisplayDateTime(appData.event.endD);
}

function showLogin() {
  document.getElementById('login-view').classList.remove('hidden-view');
  document.getElementById('app-view').classList.add('hidden-view');
  document.getElementById('logout-btn').classList.add('hidden');
  document.getElementById('menu-btn').classList.add('hidden');
  document.getElementById('active-tab-title').classList.add('hidden');
  
  const deptNav = document.getElementById('dash-dept-nav');
  if (deptNav) deptNav.classList.add('hidden');
}

async function handleLogin() {
  const pass = document.getElementById('login-pass').value;
  if(!pass) return alertError('login-alert', 'Please enter your password');
  showLoader(true);
  try {
    user = await apiCall('login', { password: pass });
    localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('login-pass').value = '';
    showApp();
  } catch (err) { alertError('login-alert', err.message); showLoader(false); }
}
function logout() { localStorage.removeItem('user'); user = null; showLogin(); }

const TAB_NAMES = {
  'dashboard': 'Dashboard',
  'parade-state': 'Parade State',
  'my-leaves': 'My Calendar',
  'submit-leave': 'Update Leave/MC/OIL',
  'submit-event': 'Update Event',
  'admin': 'Admin Settings'
};
const DEFAULT_MENU =['dashboard', 'parade-state', 'my-leaves', 'submit-leave', 'submit-event'];

function applyMenuOrder(orderArr) {
  const menuContainer = document.getElementById('slide-menu-items');
  const adminBtn = document.getElementById('menu-admin');
  
  if(menuContainer) {
    orderArr.forEach(id => {
      const btn = document.getElementById(`menu-${id}`);
      if (btn) menuContainer.appendChild(btn);
    });
    if (adminBtn) menuContainer.appendChild(adminBtn); 
  }
}

async function showApp() {
  showLoader(true);
  document.getElementById('login-view').classList.add('hidden-view');
  document.getElementById('app-view').classList.remove('hidden-view');
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('menu-btn').classList.remove('hidden');
  document.getElementById('active-tab-title').classList.remove('hidden');
  
  if (user.role === 'admin') {
    document.getElementById('nav-user-name').innerText = "Administrator";['menu-dashboard','menu-parade-state','menu-my-leaves','menu-submit-leave','menu-submit-event'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('menu-admin').classList.remove('hidden'); 
    switchTab('admin'); await loadAdminSettings();
  } else {
    document.getElementById('nav-user-name').innerText = user.departments.length ? `${user.name}` : user.name;['menu-dashboard','menu-parade-state','menu-my-leaves','menu-submit-leave','menu-submit-event'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    document.getElementById('menu-admin').classList.add('hidden'); 
    
    try {
      const settings = await apiCall('getSettings', { adminPass: null }); 
      window.appLeaveTypes = settings.leaveTypes; 
      
      const formLeaveType = document.getElementById('form-leave-type');
      if (formLeaveType) formLeaveType.innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
      
      const mOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
      applyMenuOrder(mOrder);
      
      if (settings.allContacts) {
        companyContacts = settings.allContacts;
        const uniqueNames =[...new Set(companyContacts.map(c => c.name))];
        validContactNames = uniqueNames.map(n => n.toLowerCase());
        
        const uniqueDepts =[...new Set(companyContacts.map(c => c.dept))];
        const deptNav = document.getElementById('dash-dept-nav');
        
        if (deptNav) {
          deptNav.innerHTML = '<option value="">All Depts</option>' + uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        fuseAllContacts = new Fuse(companyContacts, { keys:['name', 'dept'], threshold: 0.3 });
        
        let attendeeOptions = companyContacts.map(c => ({ id: c.phone, name: c.name, dept: c.dept, type: 'contact' }));
        uniqueDepts.forEach(dept => {
          attendeeOptions.push({ id: dept, name: `zz All in ${dept}`, dept: dept, type: 'group' });
        });
        fuseAttendees = new Fuse(attendeeOptions, { keys:['name'], threshold: 0.3 });
      }

      await loadLeavesData();
      switchTab(mOrder[0]); 

    } catch(e) {
      console.error("Error loading settings: ", e);
    }
  }
  showLoader(false);
}

function switchTab(tabId) {
  closeMenu();
  document.querySelectorAll('.tab-content').forEach(el => { el.classList.add('hidden-view'); el.classList.remove('flex'); });
  const view = document.getElementById(`view-${tabId}`);
  if (view) view.classList.remove('hidden-view');
  if(['dashboard','my-leaves','parade-state'].includes(tabId) && view) view.classList.add('flex');
  
  document.querySelectorAll('#slide-menu-panel button[id^="menu-"]').forEach(btn => {
    btn.classList.remove('bg-blue-50', 'text-blue-600', 'dark:bg-darkhover', 'dark:text-blue-400');
  });
  const activeMenu = document.getElementById(`menu-${tabId}`);
  if(activeMenu) activeMenu.classList.add('bg-blue-50', 'text-blue-600', 'dark:bg-darkhover', 'dark:text-blue-400');
  
  const titleEl = document.getElementById('active-tab-title');
  if (titleEl) titleEl.innerText = TAB_NAMES[tabId] || '';
  
  const deptNav = document.getElementById('dash-dept-nav');
  if (deptNav) {
    if (tabId === 'dashboard') deptNav.classList.remove('hidden');
    else deptNav.classList.add('hidden');
  }
  
  if (tabId === 'parade-state') renderParadeState();
}

// --- General App logic ---
async function loadLeavesData() {
  try { 
    allLeaves = await apiCall('getLeaves'); 
    renderDashboard(); 
    renderMyLeaves(); 
    
    const paradeView = document.getElementById('view-parade-state');
    if(paradeView && !paradeView.classList.contains('hidden-view')) renderParadeState(); 
  } catch (err) {
    console.error("Error loading leaves data: ", err);
  }
}

function changeMonth(ctx, offset) {
  if (ctx === 'dash') { dashMonth.setMonth(dashMonth.getMonth() + offset); renderDashboard(); } 
  else { myMonth.setMonth(myMonth.getMonth() + offset); renderMyLeaves(); }
}
function selectDate(ctx, y, m, d) {
  if (ctx === 'dash') { dashDate = new Date(y, m, d); renderDashboard(); } 
  else { myDate = new Date(y, m, d); renderMyLeaves(); }
}

function buildCalendarHTML(ctx, monthDate, selDate, data) {
  const y = monthDate.getFullYear(); const m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay(); const daysInMonth = new Date(y, m + 1, 0).getDate();
  let html = ''; for(let i=0; i<firstDay; i++) html += `<div></div>`;

  for(let d=1; d<=daysInMonth; d++) {
    const current = new Date(y, m, d); current.setHours(0,0,0,0);
    const isSelected = current.toDateString() === selDate.toDateString();
    const isToday = current.toDateString() === new Date().toDateString();

    const hasEvent = data.some(l => {
      if(l.Status === 'Cancelled') return false;
      const s = new Date(l.StartDate); s.setHours(0,0,0,0);
      const e = new Date(l.EndDate); e.setHours(0,0,0,0);
      return current >= s && current <= e;
    });

    let baseClass = "w-7 h-7 text-xs flex items-center justify-center rounded-full mx-auto cursor-pointer transition-colors relative ";
    if (isSelected) baseClass += "bg-blue-600 text-white font-bold shadow-md ";
    else if (isToday) baseClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-bold ";
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

function buildAgendaHtml(items, isMyCalendar) {
  if (!items || items.length === 0) return `<p class="text-gray-500 dark:text-darkmuted text-center mt-6">No records for this date.</p>`;
  return items.map(l => {
    const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
    const startStr = isEvent ? formatDisplayDateTime(new Date(l.StartDate)) : formatDisplayDate(new Date(l.StartDate));
    const endStr = isEvent ? formatDisplayDateTime(new Date(l.EndDate)) : formatDisplayDate(new Date(l.EndDate));
    let actionBtns = '';
    
    if (isMyCalendar && l.Status !== 'Cancelled') {
      actionBtns = `<div class="flex space-x-3 mt-3 pt-3 border-t dark:border-darkborder"><button onclick="triggerEdit('${l.ID}')" class="font-bold bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-lg transition">Edit</button><button onclick="cancelLeave('${l.ID}')" class="font-bold bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-lg transition">Cancel</button></div>`;
    }

    return `
    <div class="border border-gray-200 dark:border-darkborder p-4 rounded-xl shadow-sm bg-gray-50 dark:bg-darkinput flex flex-col">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-base">${isMyCalendar ? (l.LeaveType||'') : (l.Name||'') + ' <span class="font-normal text-gray-500 dark:text-darkmuted text-sm">(' + (l.Department||'') + ')</span>'}</h3>
        <span class="text-[11px] font-bold px-2 py-1 rounded ${getBadgeClass(l.Status)}">${String(l.Status||'').replace('Approved', 'Cal Updated')}</span>
      </div>
      <p class="font-medium text-gray-700 dark:text-darktext">${isMyCalendar ? '' : (l.LeaveType||'') + ' '}${!isEvent && l.HalfDay !== 'None' && l.HalfDay !== 'NONE' ? '('+l.HalfDay+')' : ''}</p>
      <p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Time:</span> ${startStr} to ${endStr}</p>
      ${isEvent && l.Location ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Location:</span> ${l.Location}</p>` : ''}
      ${!isEvent && l.Country ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Country:</span> ${l.Country} ${l.State ? `(${l.State})` : ''}</p>` : ''}
      ${isMyCalendar && !isEvent && l.CoveringPerson && l.CoveringPerson !== 'N/A' ? `<p class="text-sm text-gray-500 dark:text-darkmuted mt-1"><span class="font-semibold text-gray-700 dark:text-darktext">Covering:</span> ${l.CoveringPerson}</p>` : ''}
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
  if (d) filtered = filtered.filter(l => String(l.Department||'').includes(d));
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
  const itemsForDate = filtered.filter(l => {
    const s = new Date(l.StartDate); s.setHours(0,0,0,0);
    const e = new Date(l.EndDate); e.setHours(0,0,0,0);
    return dashTarget >= s && dashTarget <= e;
  });
  
  const agendaEl = document.getElementById('dash-agenda');
  if (agendaEl) agendaEl.innerHTML = buildAgendaHtml(itemsForDate, false);
}

function renderMyLeaves() {
  const my = allLeaves.filter(l => l.Phone == user.phone || (l.Attendees && String(l.Attendees).includes(user.phone)));
  
  const monthEl = document.getElementById('my-cal-month');
  if (monthEl) monthEl.innerText = mos[myMonth.getMonth()] + ' ' + myMonth.getFullYear();
  
  const gridEl = document.getElementById('my-cal-grid');
  if (gridEl) gridEl.innerHTML = buildCalendarHTML('my', myMonth, myDate, my);
  
  const titleEl = document.getElementById('my-agenda-title');
  if (titleEl) titleEl.innerText = formatDisplayDate(myDate);

  const myTarget = new Date(myDate); myTarget.setHours(0,0,0,0);
  const itemsForDate = my.filter(l => {
    if(l.Status === 'Cancelled') return false;
    const s = new Date(l.StartDate); s.setHours(0,0,0,0);
    const e = new Date(l.EndDate); e.setHours(0,0,0,0);
    return myTarget >= s && myTarget <= e;
  });
  
  const agendaEl = document.getElementById('my-agenda');
  if (agendaEl) agendaEl.innerHTML = buildAgendaHtml(itemsForDate, true);

  const cancelledLeaves = my.filter(l => l.Status === 'Cancelled');
  const cancelContainer = document.getElementById('cancelled-leaves-container');
  
  if (cancelContainer) {
    cancelContainer.innerHTML = cancelledLeaves.length 
      ? `<details class="group cursor-pointer text-sm">
           <summary class="font-bold text-gray-700 dark:text-darktext select-none outline-none flex items-center list-none[&::-webkit-details-marker]:hidden">
             <svg class="w-5 h-5 mr-1 transition-transform duration-200 transform group-open:rotate-90 text-gray-700 dark:text-darktext" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
             <span class="text-gray-700 dark:text-darktext">Cancelled (${cancelledLeaves.length})</span>
           </summary>
           <div class="grid gap-3 mt-3 cursor-default pl-6">${buildAgendaHtml(cancelledLeaves, true)}</div>
         </details>`
      : '';
  }
}

// --- Parade State Logic ---
function renderParadeState() {
  const paradeHeader = document.getElementById('parade-state-header');
  const paradeBody = document.getElementById('parade-state-body');

  if (!companyContacts || companyContacts.length === 0) {
    if(paradeHeader) paradeHeader.innerText = `Overall Parade State`;
    if(paradeBody) paradeBody.innerHTML = `<div class="flex items-center justify-center h-32"><p class="text-gray-500 dark:text-darkmuted italic">Loading personnel data or no contacts found...</p></div>`;
    return;
  }

  const now = new Date();
  let inOfficeGlobal = 0;
  let totalGlobal = companyContacts.length;
  let deptMap = {};

  try {
    companyContacts.forEach(contact => {
      const contactDept = String(contact.dept || 'Unassigned');
      if (!deptMap[contactDept]) deptMap[contactDept] = { members:[], total:0, inOffice:0 };
      
      const activeRecords = allLeaves.filter(l => {
        if (l.Status === 'Cancelled') return false;
        
        const attendeesStr = String(l.Attendees || '');
        const phoneStr = String(l.Phone || '');
        const contactPhoneStr = String(contact.phone || '');
        
        if (phoneStr !== contactPhoneStr && !attendeesStr.includes(contactPhoneStr)) return false;
        
        const sDate = new Date(l.StartDate);
        const eDate = new Date(l.EndDate);
        // Bump EndDate to 23:59:59 to accurately encompass the entire final day for leave checks
        eDate.setHours(23, 59, 59, 999);
        
        return sDate <= now && eDate >= now;
      });
      
      let isOffice = true;
      let locationStr = 'Office';

      if (activeRecords.length > 0) {
        const r = activeRecords[0];
        const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(r.LeaveType);
        
        if (isEvent) {
          locationStr = r.Location || 'Event';
          isOffice = String(locationStr).toLowerCase() === 'office';
        } else {
          locationStr = r.LeaveType || 'Leave';
          if (r.Country) locationStr += ` (${r.Country})`;
          isOffice = false;
        }
      }

      deptMap[contactDept].total++;
      if (isOffice) { deptMap[contactDept].inOffice++; inOfficeGlobal++; }
      
      deptMap[contactDept].members.push({
        name: contact.name || 'Unknown',
        isOffice: isOffice,
        location: locationStr
      });
    });

    if (paradeHeader) paradeHeader.innerText = `Overall Parade State: (${inOfficeGlobal} / ${totalGlobal})`;

    const isHQ = (str) => str && String(str).toLowerCase() === 'hq';
    const deptKeys = Object.keys(deptMap).sort((a, b) => {
      if (isHQ(a) && !isHQ(b)) return -1;
      if (!isHQ(a) && isHQ(b)) return 1;
      return String(a).localeCompare(String(b));
    });

    let html = '';
    deptKeys.forEach(dept => {
      const d = deptMap[dept];
      d.members.sort((a, b) => {
        if (a.isOffice && !b.isOffice) return -1;
        if (!a.isOffice && b.isOffice) return 1;
        return String(a.name).localeCompare(String(b.name));
      });

      html += `
        <div class="mb-6 border-l-4 border-blue-500 pl-4">
          <h3 class="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">${dept} <span class="text-sm font-semibold text-gray-500 dark:text-darkmuted">(${d.inOffice} / ${d.total})</span></h3>
          <div class="space-y-1.5 text-[15px]">
            ${d.members.map((m, i) => `
              <div class="flex items-start">
                <span class="w-6 shrink-0 text-right mr-3 text-gray-400 dark:text-darkmuted font-medium">${i+1}.</span>
                <div>
                  <span class="font-semibold ${m.isOffice ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-darkmuted'}">${m.name}</span>
                  ${!m.isOffice ? `<span class="italic text-gray-500 dark:text-darkmuted ml-1">(${m.location})</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    if (paradeBody) paradeBody.innerHTML = html || `<p class="text-center text-gray-500">No departments to display.</p>`;
  } catch(err) {
    console.error('Parade State Render Error:', err);
    if (paradeBody) paradeBody.innerHTML = `<p class="text-red-500 text-center p-4">Error generating parade state. Please check console.</p>`;
  }
}

// --- Attendees Form Logic ---
function searchAttendees() {
  const q = document.getElementById('form-event-attendee-search').value;
  const resC = document.getElementById('attendees-results');
  if(!q || !fuseAttendees) { resC.classList.add('hidden-view'); return; }
  
  const results = fuseAttendees.search(q).slice(0, 6).map(r => r.item);
  if (results.length > 0) {
    resC.innerHTML = results.map(item => `
      <div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover" onclick="selectAttendee('${item.id}', '${item.name.replace(/'/g, "\\'")}', '${item.dept}', '${item.type}')">
        <span class="font-semibold">${item.name}</span> <span class="text-xs text-gray-500 dark:text-darkmuted ml-1">(${item.dept})</span>
      </div>
    `).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}
function selectAttendee(id, name, dept, type) {
  if (!eventAttendees.some(a => a.id === id)) { eventAttendees.push({ id, name, dept, type }); renderAttendees(); }
  document.getElementById('form-event-attendee-search').value = '';
  document.getElementById('attendees-results').classList.add('hidden-view');
}
function removeAttendee(id) { eventAttendees = eventAttendees.filter(a => a.id !== id); renderAttendees(); }
function renderAttendees() {
  const c = document.getElementById('attendees-chip-container');
  if(c) {
    c.innerHTML = eventAttendees.map(a => `
      <div class="inline-flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm font-semibold">
        ${a.name}
        <button type="button" onclick="removeAttendee('${a.id}')" class="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-500 focus:outline-none">&times;</button>
      </div>
    `).join('');
  }
}

// --- Covering Person Form Logic ---
function searchCovering() {
  const q = document.getElementById('form-leave-cover').value;
  const resC = document.getElementById('cover-results-leave');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  
  const uniques =[...new Set(fuseAllContacts._docs.map(d=>d.name))];
  const quickFuse = new Fuse(uniques.map(name => ({name})), {keys:['name'], threshold: 0.3});
  
  const results = quickFuse.search(q).slice(0, 5).map(r => r.item.name);
  if (results.length > 0) {
    resC.innerHTML = results.map(n => `<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover font-medium" onclick="selectCovering('${n.replace(/'/g, "\\'")}')">${n}</div>`).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}
function selectCovering(name) { document.getElementById('form-leave-cover').value = name; document.getElementById('cover-results-leave').classList.add('hidden-view'); }


// --- Form Submission & Edits ---
function triggerEdit(id) {
  const l = allLeaves.find(x => x.ID === id);
  if(!l) return;
  currentEditId = id;
  const isEvent = window.appLeaveTypes ? !window.appLeaveTypes.includes(l.LeaveType) : false;
  const ctx = isEvent ? 'event' : 'leave';

  appData[ctx].startD = new Date(l.StartDate);
  appData[ctx].endD = new Date(l.EndDate);
  updateButtonLabels();

  if (isEvent) {
    document.getElementById('form-event-name').value = l.LeaveType;
    document.getElementById('form-event-location').value = l.Location || 'Office';
    document.getElementById('form-event-remarks').value = l.Remarks || '';
    document.getElementById('form-event-repeat').value = l.HalfDay || 'NONE'; 
    
    eventAttendees =[];
    if(l.Attendees) {
      const savedPhones = String(l.Attendees).split(',');
      savedPhones.forEach(ph => {
        const contact = companyContacts.find(c => String(c.phone) === String(ph));
        if(contact) eventAttendees.push({ id: contact.phone, name: contact.name, dept: contact.dept, type: 'contact' });
      });
    }
    renderAttendees();
    
    document.getElementById('submit-event-btn').innerText = "Update Event";
    document.getElementById('cancel-edit-event-btn').classList.remove('hidden-view');
  } else {
    document.getElementById('form-leave-type').value = l.LeaveType;
    document.getElementById('form-leave-cover').value = l.CoveringPerson;
    document.getElementById('form-leave-country').value = l.Country || '';
    document.getElementById('form-leave-state').value = l.State || '';
    document.getElementById('form-leave-remarks').value = l.Remarks || '';
    document.getElementById('submit-leave-btn').innerText = "Update Record";
    document.getElementById('cancel-edit-leave-btn').classList.remove('hidden-view');
    toggleOverseasFields();
    
    let start = 'AM', end = 'PM';
    if (l.HalfDay === 'AM') end = 'AM';
    else if (l.HalfDay === 'PM') start = 'PM';
    else if (l.HalfDay === 'Start PM, End AM') { start = 'PM'; end = 'AM'; }
    else if (l.HalfDay === 'Start PM') start = 'PM';
    else if (l.HalfDay === 'End AM') end = 'AM';
    appData.leave.startAMPM = start; appData.leave.endAMPM = end;
    updateTimeSliderVisual('start', start); updateTimeSliderVisual('end', end);
  }
  switchTab(`submit-${ctx}`);
  
  setTimeout(() => {['form-leave-remarks', 'form-event-remarks'].forEach(id => {
      const el = document.getElementById(id);
      if(el) { el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
    });
  }, 50);
}

function cancelEditMode() {
  currentEditId = null; initDates();
  document.getElementById('leave-form').reset(); document.getElementById('event-form').reset();['form-leave-remarks', 'form-event-remarks'].forEach(id => { const el = document.getElementById(id); if(el) el.style.height='auto'; });

  appData.leave.startAMPM = 'AM'; appData.leave.endAMPM = 'PM';
  updateTimeSliderVisual('start', 'AM'); updateTimeSliderVisual('end', 'PM');
  toggleOverseasFields();
  
  eventAttendees =[]; renderAttendees();

  document.getElementById('submit-leave-btn').innerText = "Save Record";
  document.getElementById('cancel-edit-leave-btn').classList.add('hidden-view');
  document.getElementById('submit-event-btn').innerText = "Save Event";
  document.getElementById('cancel-edit-event-btn').classList.add('hidden-view');
  switchTab('my-leaves');
}

function toggleAMPM(type) {
  appData.leave[`${type}AMPM`] = appData.leave[`${type}AMPM`] === 'AM' ? 'PM' : 'AM'; 
  updateTimeSliderVisual(type, appData.leave[`${type}AMPM`]);
}

function updateTimeSliderVisual(type, val) {
  const slider = document.getElementById(`${type}-leave-slider`);
  const tAM = document.getElementById(`${type}-leave-am`);
  const tPM = document.getElementById(`${type}-leave-pm`);
  const act = 'text-white', inact =['text-gray-500', 'dark:text-darkmuted'];
  if (val === 'PM') {
    slider.classList.add('translate-x-full');
    tAM.classList.remove(act); tAM.classList.add(...inact);
    tPM.classList.remove(...inact); tPM.classList.add(act);
  } else {
    slider.classList.remove('translate-x-full');
    tAM.classList.remove(...inact); tAM.classList.add(act);
    tPM.classList.remove(act); tPM.classList.add(...inact);
  }
}

function toggleOverseasFields() {
  const type = document.getElementById('form-leave-type').value;
  const el = document.getElementById('overseas-fields');
  const cInput = document.getElementById('form-leave-country');
  if (type === 'Overseas Leave' || type === 'Official Trip') { el.classList.remove('hidden-view'); cInput.required = true; }
  else { el.classList.add('hidden-view'); cInput.required = false; cInput.value = ''; document.getElementById('form-leave-state').value = ''; }
}

async function submitForm(ctx) {
  showLoader(true);
  if (ctx === 'leave') {
    const coverInput = document.getElementById('form-leave-cover').value.trim();
    if (!validContactNames.includes(coverInput.toLowerCase())) {
      alert("Please select a valid Covering Person from the dropdown list.");
      showLoader(false); return;
    }
  }

  const toLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
  const sDate = toLocalISO(appData[ctx].startD);
  const eDate = toLocalISO(appData[ctx].endD);
  
  let calculatedHalfDay = 'None';
  let loc = '';
  let finalAttendeesStr = '';
  let finalDepts = new Set(user.departments);

  if (ctx === 'leave') {
    const isSameDay = appData.leave.startD.toDateString() === appData.leave.endD.toDateString();
    if (isSameDay) {
      if (appData.leave.startAMPM === 'AM' && appData.leave.endAMPM === 'AM') calculatedHalfDay = 'AM';
      else if (appData.leave.startAMPM === 'PM' && appData.leave.endAMPM === 'PM') calculatedHalfDay = 'PM';
    } else {
      if (appData.leave.startAMPM === 'PM' && appData.leave.endAMPM === 'AM') calculatedHalfDay = 'Start PM, End AM';
      else if (appData.leave.startAMPM === 'PM') calculatedHalfDay = 'Start PM';
      else if (appData.leave.endAMPM === 'AM') calculatedHalfDay = 'End AM';
    }
  } else {
    calculatedHalfDay = document.getElementById('form-event-repeat').value; 
    loc = document.getElementById('form-event-location').value;
    
    let resolvedPhones = new Set();
    eventAttendees.forEach(a => {
      if (a.type === 'contact') {
        resolvedPhones.add(a.id);
        finalDepts.add(a.dept);
      } else if (a.type === 'group') {
        finalDepts.add(a.dept);
        companyContacts.filter(c => c.dept === a.dept).forEach(c => resolvedPhones.add(c.phone));
      }
    });
    finalAttendeesStr = Array.from(resolvedPhones).join(',');
  }

  const payload = {
    id: currentEditId, name: user.name, phone: user.phone, departments: Array.from(finalDepts),
    leaveType: ctx === 'leave' ? document.getElementById('form-leave-type').value : document.getElementById('form-event-name').value,
    startDate: sDate, endDate: eDate, halfDay: calculatedHalfDay, 
    coveringPerson: ctx === 'leave' ? document.getElementById('form-leave-cover').value.trim() : 'N/A',
    country: ctx === 'leave' ? document.getElementById('form-leave-country').value : '',
    state: ctx === 'leave' ? document.getElementById('form-leave-state').value : '',
    remarks: document.getElementById(`form-${ctx}-remarks`).value,
    location: loc,
    attendees: finalAttendeesStr
  };

  try {
    const action = currentEditId ? 'editLeave' : 'submitLeave';
    const res = await apiCall(action, payload);
    alert(res.status.includes('Cal Updated') || res.status.includes('Approved') ? `Record successfully ${currentEditId ? 'updated' : 'submitted'}!` : "Record marked as Pending due to constraints. Admin notified.");
    cancelEditMode(); loadLeavesData();
  } catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function cancelLeave(id) {
  if(!confirm("Are you sure you want to cancel this record?")) return;
  showLoader(true);
  try { await apiCall('cancelLeave', { id: id, phone: user.phone }); loadLeavesData(); } catch (err) { showLoader(false); }
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => {}));
function animateAndUpdate(btn) { const icon = btn.querySelector('svg'); if (icon) icon.classList.add('animate-spin'); setTimeout(() => { updateApp(); }, 300); }
async function updateApp() {
  if ('serviceWorker' in navigator) {
    try { const regs = await navigator.serviceWorker.getRegistrations(); for (let reg of regs) await reg.unregister(); const names = await caches.keys(); for (let name of names) await caches.delete(name); } catch(err) {}
  }
  window.location.href = window.location.pathname + '?v=' + new Date().getTime();
}

// ==========================================
// INFINITE ROLODEX PICKER ENGINE
// ==========================================
let activePicker = { ctx: '', field: '', type: 'date', currentVal: new Date() };

function openPicker(type, ctx, field) {
  activePicker = { ctx, field, type, currentVal: new Date(appData[ctx][field + 'D']) };
  document.getElementById('picker-title').innerText = type === 'datetime' ? 'Select Date & Time' : 'Select Date';
  buildWheels();
  document.getElementById('picker-modal').classList.remove('hidden-view');
  document.getElementById('picker-modal').classList.add('flex');
}

function closePicker() {
  document.getElementById('picker-modal').classList.add('hidden-view');
  document.getElementById('picker-modal').classList.remove('flex');
}

function confirmPicker() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  if(!wrapper) return;
  const wheels = Array.from(wrapper.querySelectorAll('.wheel-container'));
  
  const getVal = (wheel) => {
    if(!wheel) return null;
    const items = wheel.querySelectorAll('.wheel-item');
    const centerIdx = Math.round(wheel.scrollTop / 40);
    return items[centerIdx] ? parseInt(items[centerIdx].dataset.val) : null;
  };

  const dayWheel = wheels.find(w => w.dataset.type === 'day');
  const monthWheel = wheels.find(w => w.dataset.type === 'month');
  const yearWheel = wheels.find(w => w.dataset.type === 'year');
  const hourWheel = wheels.find(w => w.dataset.type === 'hour');
  const minWheel = wheels.find(w => w.dataset.type === 'min');

  const d = getVal(dayWheel) || 1;
  const m = getVal(monthWheel) || 0;
  const y = getVal(yearWheel) || 2024;
  const h = hourWheel ? getVal(hourWheel) : 0;
  const min = minWheel ? getVal(minWheel) : 0;

  const finalDate = new Date(y, m, d, h, min, 0);
  appData[activePicker.ctx][activePicker.field + 'D'] = finalDate;
  updateButtonLabels(); closePicker();
}

function buildWheels() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  wrapper.innerHTML = '<div class="wheel-highlight"></div>'; 
  const cv = activePicker.currentVal;
  
  const initialMaxDays = new Date(cv.getFullYear(), cv.getMonth() + 1, 0).getDate();
  const days = Array.from({length: initialMaxDays}, (_, i) => ({ val: i+1, label: String(i+1).padStart(2,'0') }));
  const months = mos.map((l, i) => ({ val: i, label: l }));
  const years = Array.from({length: 15}, (_, i) => ({ val: 2024+i, label: 2024+i }));
  const hours = Array.from({length: 24}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));
  const mins = Array.from({length: 60}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));

  const dw = createWheel(wrapper, 'day', days, cv.getDate());
  dw.dataset.maxDays = initialMaxDays;
  createWheel(wrapper, 'month', months, cv.getMonth());
  createWheel(wrapper, 'year', years, cv.getFullYear());
  
  if (activePicker.type === 'datetime') {
    const sep = document.createElement('div');
    sep.className = 'w-px bg-gray-300 dark:bg-darkborder mx-2 h-3/4 my-auto relative z-20';
    wrapper.appendChild(sep);

    createWheel(wrapper, 'hour', hours, cv.getHours());
    createWheel(wrapper, 'min', mins, cv.getMinutes());
  }
}

function populateWheel(container, dataArr, currentVal) {
  container.dataset.len = dataArr.length;
  const loops = 50; 
  let html = `<div style="height: 76px;"></div>`; 
  let targetScrollIndex = 0;
  for (let loop = 0; loop < loops; loop++) {
    dataArr.forEach(item => {
      if (loop === Math.floor(loops/2) && item.val === currentVal) targetScrollIndex = (loop * dataArr.length) + dataArr.indexOf(item);
      html += `<div class="wheel-item text-xl cursor-pointer select-none" data-val="${item.val}">${item.label}</div>`;
    });
  }
  html += `<div style="height: 76px;"></div>`;
  
  container.style.scrollBehavior = 'auto';
  container.innerHTML = html; 
  
  requestAnimationFrame(() => {
    container.scrollTop = targetScrollIndex * 40;
    updateActiveItem(container);
    setTimeout(() => { container.style.scrollBehavior = 'smooth'; }, 100);
  });
}

function createWheel(parent, type, dataArr, currentVal) {
  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'flex flex-col items-center flex-1 h-full relative z-10 min-w-0';
  
  if(type === 'hour' || type === 'min') {
      const lbl = document.createElement('div');
      lbl.className = 'absolute top-1 text-[11px] font-bold text-gray-400 dark:text-darkmuted z-30 pointer-events-none w-full text-center bg-gradient-to-b from-gray-50 dark:from-darkinput to-transparent pb-3 pt-1';
      lbl.innerText = type === 'hour' ? 'HH' : 'MM';
      wrapperDiv.appendChild(lbl);
  }

  const container = document.createElement('div');
  container.className = 'wheel-container w-full h-full overflow-y-auto text-center px-1 relative';
  container.dataset.type = type;

  parent.appendChild(wrapperDiv); 
  populateWheel(container, dataArr, currentVal);
  wrapperDiv.appendChild(container); 

  let scrollTimeout;
  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const len = parseInt(container.dataset.len);
      const loops = 50;
      const currentIdx = Math.round(container.scrollTop / 40);
      if (currentIdx < len * 5 || currentIdx > (len * loops) - (len * 5)) {
        const middleBase = Math.floor(loops/2) * len;
        container.style.scrollBehavior = 'auto'; 
        container.scrollTop = (middleBase + (currentIdx % len)) * 40;
        setTimeout(() => container.style.scrollBehavior = 'smooth', 50);
      }
      updateActiveItem(container);
      if (type === 'month' || type === 'year') adjustDaysWheel();
    }, 100);
  });
  return container;
}

function adjustDaysWheel() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  if (!wrapper) return;
  const wheels = Array.from(wrapper.querySelectorAll('.wheel-container'));
  const dayWheel = wheels.find(w => w.dataset.type === 'day');
  const monthWheel = wheels.find(w => w.dataset.type === 'month');
  const yearWheel = wheels.find(w => w.dataset.type === 'year');
  
  if (!dayWheel || !monthWheel || !yearWheel) return;

  const getVal = (wheel) => {
    const items = wheel.querySelectorAll('.wheel-item');
    const centerIdx = Math.round(wheel.scrollTop / 40);
    return items[centerIdx] ? parseInt(items[centerIdx].dataset.val) : null;
  };

  const m = getVal(monthWheel);
  const y = getVal(yearWheel);
  const d = getVal(dayWheel);
  
  if (m === null || y === null || d === null) return;

  const maxDays = new Date(y, m + 1, 0).getDate();
  const currentMax = parseInt(dayWheel.dataset.maxDays || '31');
  
  if (currentMax !== maxDays) {
    dayWheel.dataset.maxDays = maxDays;
    const daysArr = Array.from({length: maxDays}, (_, i) => ({ val: i+1, label: String(i+1).padStart(2,'0') }));
    const newVal = Math.min(d, maxDays);
    populateWheel(dayWheel, daysArr, newVal);
  }
}

function updateActiveItem(container) {
  const items = container.querySelectorAll('.wheel-item');
  items.forEach(el => el.classList.remove('active'));
  const centerIdx = Math.round(container.scrollTop / 40);
  if(items[centerIdx]) items[centerIdx].classList.add('active');
}

// --- Admin Settings Sub-methods ---
async function loadAdminSettings() {
  try {
    const settings = await apiCall('getSettings', { adminPass: user.pass });
    document.getElementById('set-kah-limit').value = settings.kahLimit;
    document.getElementById('set-appr-email').value = settings.approvingAuthority;
    
    tempMenuOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
    renderMenuOrder();

    tempLeaveTypes = settings.leaveTypes ||[];
    renderLeaveTypes();
    
    adminKAHList = settings.kahList ||[];
    renderKAHSelected();
    
    if(settings.allContacts) {
      fuseAllContacts = new Fuse(settings.allContacts, { keys:['name', 'dept'], threshold: 0.3 });
    }
  } catch (err) { alertError('login-alert', err.message); }
}

function renderMenuOrder() {
  const list = document.getElementById('menu-order-list');
  if(!list) return;
  list.innerHTML = tempMenuOrder.map((id) => `
    <div data-id="${id}" class="flex justify-between items-center bg-white dark:bg-darksurface p-3 rounded-lg border dark:border-darkborder shadow-sm cursor-grab">
      <div class="flex items-center space-x-3 w-full">
        <svg class="w-5 h-5 text-gray-400 dark:text-darkmuted handle cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
        <span class="font-bold text-gray-700 dark:text-darktext">${TAB_NAMES[id]}</span>
      </div>
    </div>
  `).join('');

  if(window.menuSortable) window.menuSortable.destroy();
  window.menuSortable = new Sortable(list, {
    animation: 150,
    handle: '.handle',
    ghostClass: 'opacity-50',
    onEnd: function () {
      tempMenuOrder = Array.from(list.children).map(el => el.dataset.id);
    }
  });
}

function renderLeaveTypes() {
  const list = document.getElementById('leave-types-list');
  if(!list) return;
  list.innerHTML = tempLeaveTypes.map((t, i) => `
    <div class="flex items-center space-x-3">
      <input type="text" value="${t}" onchange="updateLeaveType(${i}, this.value)" class="flex-grow border-2 border-gray-300 dark:border-darkborder rounded-xl py-2 px-4 bg-white dark:bg-darkinput outline-none shadow-sm focus:border-blue-500 transition">
      <button type="button" onclick="removeLeaveType(${i})" class="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl transition" title="Remove Type"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
    </div>
  `).join('');
}
function addLeaveType() {
  const input = document.getElementById('new-leave-type');
  if(input && input.value.trim()) { tempLeaveTypes.push(input.value.trim()); input.value = ''; renderLeaveTypes(); }
}
function removeLeaveType(i) { tempLeaveTypes.splice(i, 1); renderLeaveTypes(); }
function updateLeaveType(i, val) { tempLeaveTypes[i] = val.trim(); }

function searchKAH() {
  const q = document.getElementById('kah-search').value;
  const resC = document.getElementById('kah-results');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
  if(results.length > 0) {
    resC.innerHTML = results.map(c => `
      <div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover" onclick="addKAH('${c.phone}', '${c.name.replace(/'/g, "\\'")}', '${c.dept}')">${c.name} <span class="text-xs text-gray-500 ml-1">(${c.dept})</span></div>
    `).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}
function addKAH(phone, name, dept) {
  if(!adminKAHList.some(k => k.phone === phone)) {
    adminKAHList.push({ phone, name, dept }); renderKAHSelected();
  }
  document.getElementById('kah-search').value = '';
  document.getElementById('kah-results').classList.add('hidden-view');
}
function removeKAH(phone) { adminKAHList = adminKAHList.filter(k => k.phone !== phone); renderKAHSelected(); }

function renderKAHSelected() {
  const list = document.getElementById('kah-selected-list');
  if(!list) return;
  if (adminKAHList.length === 0) {
    list.innerHTML = `<li class="text-gray-500 dark:text-darkmuted text-sm text-center italic py-2">No KAH personnel added yet.</li>`;
    return;
  }
  list.innerHTML = adminKAHList.map(k => `
    <li class="flex justify-between items-center border-b dark:border-darkborder py-2 last:border-0">
      <span class="font-medium">${k.name} <span class="text-xs text-gray-500 dark:text-darkmuted ml-1">(${k.dept})</span></span>
      <button onclick="removeKAH('${k.phone}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg font-bold px-3 transition">&times;</button>
    </li>
  `).join('');
}

async function saveAdminSettings() {
  showLoader(true);
  const newPass = document.getElementById('set-admin-pass').value || null;
  const payload = {
    adminPass: user.pass, newAdminPass: newPass,
    menuOrder: tempMenuOrder,
    leaveTypes: tempLeaveTypes.filter(Boolean),
    kahLimit: document.getElementById('set-kah-limit').value,
    approvingAuthority: document.getElementById('set-appr-email').value,
    kahList: adminKAHList
  };
  try {
    await apiCall('saveSettings', payload);
    alert("Settings successfully saved!");
    if(newPass) { user.pass = newPass; localStorage.setItem('user', JSON.stringify(user)); document.getElementById('set-admin-pass').value = ''; }
    applyMenuOrder(tempMenuOrder); 
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}
