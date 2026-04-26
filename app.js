// --- Global State ---
let user = JSON.parse(localStorage.getItem('user')) || null;
let allLeaves =[];
let currentEditId = null;

let fuseAllContacts = null;
let validContactNames =[];

// In-Memory Form State
let appData = {
  leave: { startD: new Date(), endD: new Date(), startAMPM: 'AM', endAMPM: 'PM' },
  event: { startD: new Date(), endD: new Date() }
};

if(localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');

document.addEventListener('DOMContentLoaded', () => {
  if (ENV === 'Dev') document.getElementById('dev-banner').classList.remove('hidden');
  if (user) showApp(); else showLogin();
  document.getElementById('login-pass').addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
  
  document.addEventListener('click', function(e) {
    if(!e.target.closest('#form-leave-cover') && !e.target.closest('#cover-results')) {
      const resC = document.getElementById('cover-results');
      if(resC) resC.classList.add('hidden-view');
    }
  });

  initDates();
});

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
      ? `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`
      : `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
  }
}

// FORMATTING (DD Mmm YYYY)
const mos =['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDisplayDate(dateObj) {
  return `${String(dateObj.getDate()).padStart(2,'0')} ${mos[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}
function formatDisplayDateTime(dateObj) {
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
  } catch (err) { alertError('login-alert', err.message); }
  showLoader(false);
}
function logout() { localStorage.removeItem('user'); user = null; showLogin(); }

async function showApp() {
  document.getElementById('login-view').classList.add('hidden-view');
  document.getElementById('app-view').classList.remove('hidden-view');
  document.getElementById('logout-btn').classList.remove('hidden');
  
  if (user.role === 'admin') {
    document.getElementById('nav-user-name').innerText = "Administrator";['tab-dashboard','tab-my-leaves','tab-submit-leave','tab-submit-event'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('tab-admin').classList.remove('hidden'); switchTab('admin');
    if (typeof loadAdminSettings === 'function') loadAdminSettings();
  } else {
    document.getElementById('nav-user-name').innerText = user.departments.length ? `${user.name} [${user.departments[0]}]` : user.name;['tab-dashboard','tab-my-leaves','tab-submit-leave','tab-submit-event'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    document.getElementById('tab-admin').classList.add('hidden'); switchTab('dashboard');
    loadLeavesData();
    try {
      const settings = await apiCall('getSettings', { adminPass: null }); 
      window.appLeaveTypes = settings.leaveTypes; 
      document.getElementById('form-leave-type').innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
      document.getElementById('dash-dept').innerHTML = '<option value="">All Departments</option>' + user.departments.map(d => `<option value="${d}">${d}</option>`).join('');
      if(settings.allContacts) {
        const uniqueNames =[...new Set(settings.allContacts.map(c => c.name))];
        validContactNames = uniqueNames.map(n => n.toLowerCase());
        fuseAllContacts = new Fuse(uniqueNames.map(name => ({name})), { keys: ['name'], threshold: 0.3 });
      }
    } catch(e){}
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => { el.classList.add('hidden-view'); el.classList.remove('flex'); });
  const view = document.getElementById(`view-${tabId}`);
  view.classList.remove('hidden-view');
  if(tabId === 'dashboard') view.classList.add('flex');
  document.querySelectorAll('#app-view button[id^="tab-"]').forEach(btn => {
    btn.classList.remove('border-b-2', 'border-blue-600', 'text-blue-600');
    btn.classList.add('text-gray-500', 'border-transparent');
  });
  const activeBtn = document.getElementById(`tab-${tabId}`);
  activeBtn.classList.add('border-b-2', 'border-blue-600', 'text-blue-600');
  activeBtn.classList.remove('text-gray-500', 'border-transparent');
}

async function loadLeavesData() {
  showLoader(true);
  try { allLeaves = await apiCall('getLeaves'); renderDashboard(); renderMyLeaves(); } catch (err) {}
  showLoader(false);
}

function renderDashboard() { filterDashboard(); }

function filterDashboard() {
  const q = document.getElementById('dash-search').value.toLowerCase();
  const d = document.getElementById('dash-dept').value;
  
  let filtered = allLeaves.filter(l => l.Status !== 'Cancelled');
  if (d) filtered = filtered.filter(l => l.Department.includes(d));
  if (q) {
    const fuse = new Fuse(filtered, { keys:['Name', 'LeaveType'] });
    filtered = fuse.search(q).map(res => res.item);
  }

  const mapHtml = (isMobile) => filtered.map(l => {
    const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
    const startStr = isEvent ? formatDisplayDateTime(new Date(l.StartDate)) : formatDisplayDate(new Date(l.StartDate));
    const endStr = isEvent ? formatDisplayDateTime(new Date(l.EndDate)) : formatDisplayDate(new Date(l.EndDate));
    
    if (isMobile) {
      return `
      <div class="border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col">
        <div class="flex justify-between items-start mb-1">
          <h3 class="font-bold">${l.Name} <span class="text-xs font-normal text-gray-500 ml-1">(${l.Department})</span></h3>
          <span class="text-xs font-bold px-2 py-0.5 rounded bg-${l.Status.includes('Pending') ? 'orange' : 'green'}-100 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-700">${l.Status.includes('Pending') ? 'Pending' : 'Cal Updated'}</span>
        </div>
        <p class="font-medium text-gray-700 dark:text-gray-300">${l.LeaveType} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
        <p class="text-xs text-gray-500 mt-1"><span class="font-semibold">Dates:</span> ${startStr} to ${endStr}</p>
      </div>`;
    } else {
      return `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0">
        <td class="px-2 py-1 font-medium">${l.Name}</td>
        <td class="px-2 py-1 text-gray-500 dark:text-gray-400">${l.Department}</td>
        <td class="px-2 py-1">${l.LeaveType} ${l.HalfDay !== 'None' ? '<span class="text-xs ml-1 bg-gray-200 dark:bg-gray-600 px-1 rounded">('+l.HalfDay+')</span>' : ''}</td>
        <td class="px-2 py-1">${startStr} - ${endStr}</td>
        <td class="px-2 py-1 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-600 font-semibold">${l.Status.replace('Approved', 'Cal Updated')}</td>
      </tr>`;
    }
  }).join('');

  document.getElementById('dash-body-desktop').innerHTML = mapHtml(false);
  document.getElementById('dash-body-mobile').innerHTML = mapHtml(true);
}

function renderMyLeaves() {
  const my = allLeaves.filter(l => l.Phone == user.phone);
  const activeLeaves = my.filter(l => l.Status !== 'Cancelled');
  const cancelledLeaves = my.filter(l => l.Status === 'Cancelled');

  const getBadgeClass = (status) => {
    if(status.includes('Pending')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if(status.includes('Cancelled')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  };

  const createCard = (l) => {
    const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
    const startStr = isEvent ? formatDisplayDateTime(new Date(l.StartDate)) : formatDisplayDate(new Date(l.StartDate));
    const endStr = isEvent ? formatDisplayDateTime(new Date(l.EndDate)) : formatDisplayDate(new Date(l.EndDate));
    return `
    <div class="border-2 dark:border-gray-700 p-3 rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-bold text-base">${l.LeaveType}</h3>
        <span class="text-xs px-2 py-0.5 rounded ${getBadgeClass(l.Status)} font-bold">${l.Status.replace('Approved', 'Cal Updated')}</span>
      </div>
      <p><strong>Dates:</strong> ${startStr} - ${endStr} ${!isEvent && l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
      ${!isEvent && l.CoveringPerson && l.CoveringPerson !== 'N/A' ? `<p><strong>Covering:</strong> ${l.CoveringPerson}</p>` : ''}
      ${l.Status !== 'Cancelled' ? `
        <div class="flex space-x-2 mt-3">
          <button onclick="triggerEdit('${l.ID}')" class="font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition">Edit</button>
          <button onclick="cancelLeave('${l.ID}')" class="font-semibold bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition">Cancel</button>
        </div>` : ''}
    </div>`;
  };

  document.getElementById('active-leaves-container').innerHTML = activeLeaves.length ? activeLeaves.map(createCard).reverse().join('') : '<p class="text-gray-500">No active records.</p>';
  document.getElementById('cancelled-leaves-container').innerHTML = cancelledLeaves.length 
    ? `<details class="group cursor-pointer"><summary class="font-semibold text-gray-500 hover:text-gray-700 select-none outline-none flex items-center"><span class="mr-1">▶</span> Cancelled (${cancelledLeaves.length})</summary><div class="grid gap-2 mt-2 opacity-70 cursor-default">${cancelledLeaves.map(createCard).reverse().join('')}</div></details>`
    : '';
}

function searchCovering() {
  const q = document.getElementById('form-leave-cover').value;
  const resC = document.getElementById('cover-results');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item.name);
  if (results.length > 0) {
    resC.innerHTML = results.map(n => `<div class="p-2 border-b dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onclick="selectCovering('${n.replace(/'/g, "\\'")}')">${n}</div>`).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-2 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}
function selectCovering(name) { document.getElementById('form-leave-cover').value = name; document.getElementById('cover-results').classList.add('hidden-view'); }

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
    document.getElementById('form-event-remarks').value = l.Remarks || '';
    document.getElementById('form-event-repeat').value = l.HalfDay || 'NONE'; // HalfDay holds Recurrence for events
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
    
    // Restore Leave AM/PM logic
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
}

function cancelEditMode() {
  currentEditId = null; initDates();
  document.getElementById('leave-form').reset(); document.getElementById('event-form').reset();
  appData.leave.startAMPM = 'AM'; appData.leave.endAMPM = 'PM';
  updateTimeSliderVisual('start', 'AM'); updateTimeSliderVisual('end', 'PM');
  toggleOverseasFields();
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
  const act = 'text-white', inact =['text-gray-500', 'dark:text-gray-300'];
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
      alert("Please select a valid Covering Person from the dropdown company list.");
      showLoader(false); return;
    }
  }

  // Adjust local dates to local ISO String bypassing timezone shifts
  const toLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
  const sDate = toLocalISO(appData[ctx].startD);
  const eDate = toLocalISO(appData[ctx].endD);
  
  let calculatedHalfDay = 'None';
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
    calculatedHalfDay = document.getElementById('form-event-repeat').value; // Repurpose HalfDay column for Recurrence
  }

  const payload = {
    id: currentEditId, name: user.name, phone: user.phone, departments: user.departments,
    leaveType: ctx === 'leave' ? document.getElementById('form-leave-type').value : document.getElementById('form-event-name').value,
    startDate: sDate, endDate: eDate, halfDay: calculatedHalfDay, 
    coveringPerson: ctx === 'leave' ? document.getElementById('form-leave-cover').value.trim() : 'N/A',
    country: ctx === 'leave' ? document.getElementById('form-leave-country').value : '',
    state: ctx === 'leave' ? document.getElementById('form-leave-state').value : '',
    remarks: document.getElementById(`form-${ctx}-remarks`).value
  };

  try {
    const action = currentEditId ? 'editLeave' : 'submitLeave';
    const res = await apiCall(action, payload);
    alert(res.status.includes('Cal Updated') || res.status.includes('Approved') ? `Record successfully ${currentEditId ? 'updated' : 'submitted'}!` : "Record marked as Pending due to constraints. Admin notified.");
    cancelEditMode(); loadLeavesData();
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}

async function cancelLeave(id) {
  if(!confirm("Are you sure you want to cancel this record?")) return;
  showLoader(true);
  try { await apiCall('cancelLeave', { id: id, phone: user.phone }); loadLeavesData(); } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
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
  // Extract values from wheels
  const wheels = document.getElementById('picker-wheels-wrapper').children;
  let d=1, m=0, y=2024, h=0, min=0;
  
  for(let i=0; i<wheels.length; i++) {
    if(!wheels[i].classList.contains('wheel-container')) continue;
    const items = Array.from(wheels[i].querySelectorAll('.wheel-item'));
    const centerIdx = Math.round(wheels[i].scrollTop / 40);
    const activeItem = items[centerIdx];
    if(!activeItem) continue;
    
    const val = parseInt(activeItem.dataset.val);
    const type = wheels[i].dataset.type;
    
    if(type === 'day') d = val;
    if(type === 'month') m = val;
    if(type === 'year') y = val;
    if(type === 'hour') h = val;
    if(type === 'min') min = val;
  }

  const finalDate = new Date(y, m, d, h, min, 0);
  appData[activePicker.ctx][activePicker.field + 'D'] = finalDate;
  updateButtonLabels();
  closePicker();
}

function buildWheels() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  wrapper.innerHTML = '<div class="wheel-highlight"></div>'; // clear and add highlight

  const cv = activePicker.currentVal;
  // Arrays
  const days = Array.from({length: 31}, (_, i) => ({ val: i+1, label: String(i+1).padStart(2,'0') }));
  const months = mos.map((l, i) => ({ val: i, label: l }));
  const years = Array.from({length: 15}, (_, i) => ({ val: 2024+i, label: 2024+i }));
  const hours = Array.from({length: 24}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));
  const mins = Array.from({length: 60}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));

  createWheel(wrapper, 'day', days, cv.getDate());
  createWheel(wrapper, 'month', months, cv.getMonth());
  createWheel(wrapper, 'year', years, cv.getFullYear());

  if (activePicker.type === 'datetime') {
    createWheel(wrapper, 'hour', hours, cv.getHours());
    createWheel(wrapper, 'min', mins, cv.getMinutes());
  }
}

function createWheel(parent, type, dataArr, currentVal) {
  const container = document.createElement('div');
  container.className = 'wheel-container flex-1 h-48 overflow-y-auto text-center mx-1 relative z-10';
  container.dataset.type = type;

  // Duplicate data array heavily to simulate infinite scrolling (50 repeats)
  const loops = 50; 
  let html = '';
  // Add padding elements at the top so index 0 can be centered
  html += `<div style="height: 76px;"></div>`; 
  
  let targetScrollIndex = 0;
  for (let loop = 0; loop < loops; loop++) {
    dataArr.forEach(item => {
      // Find the middle loop to set initial scroll
      if (loop === Math.floor(loops/2) && item.val === currentVal) targetScrollIndex = (loop * dataArr.length) + dataArr.indexOf(item);
      html += `<div class="wheel-item text-lg cursor-pointer select-none" data-val="${item.val}">${item.label}</div>`;
    });
  }
  // Add padding at bottom
  html += `<div style="height: 76px;"></div>`;
  
  container.innerHTML = html;
  parent.appendChild(container);

  // Initial center alignment
  setTimeout(() => {
    container.scrollTop = targetScrollIndex * 40;
    updateActiveItem(container);
  }, 10);

  // Scroll listener for snapping and updating active class
  let scrollTimeout;
  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Recenter logic if hitting absolute edges to simulate infinite
      const totalItems = dataArr.length * loops;
      const currentIdx = Math.round(container.scrollTop / 40);
      
      if (currentIdx < dataArr.length * 5 || currentIdx > totalItems - (dataArr.length * 5)) {
        const valObj = dataArr[currentIdx % dataArr.length];
        const middleBase = Math.floor(loops/2) * dataArr.length;
        container.style.scrollBehavior = 'auto'; // disable smooth momentarily
        container.scrollTop = (middleBase + (currentIdx % dataArr.length)) * 40;
        setTimeout(() => container.style.scrollBehavior = 'smooth', 50);
      }
      updateActiveItem(container);
    }, 100);
  });
}

function updateActiveItem(container) {
  const items = container.querySelectorAll('.wheel-item');
  items.forEach(el => el.classList.remove('active'));
  const centerIdx = Math.round(container.scrollTop / 40);
  if(items[centerIdx]) items[centerIdx].classList.add('active');
}
