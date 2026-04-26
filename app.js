// --- Global State ---
let user = JSON.parse(localStorage.getItem('user')) || null;
let allLeaves =[];
let currentEditId = null;

// Time trackers for two separate forms
let timeData = {
  leave: { start: 'AM', end: 'PM' },
  event: { start: 'AM', end: 'PM' }
};

if(localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');

document.addEventListener('DOMContentLoaded', () => {
  if (ENV === 'Dev') document.getElementById('dev-banner').classList.remove('hidden');
  if (user) showApp(); else showLogin();
  document.getElementById('login-pass').addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
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

function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString; 
  const months =['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
    document.getElementById('tab-admin').classList.remove('hidden');
    switchTab('admin');
    if (typeof loadAdminSettings === 'function') loadAdminSettings();
  } else {
    document.getElementById('nav-user-name').innerText = user.departments.length ? `${user.name} [${user.departments[0]}]` : user.name;['tab-dashboard','tab-my-leaves','tab-submit-leave','tab-submit-event'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    document.getElementById('tab-admin').classList.add('hidden');
    switchTab('dashboard');
    loadLeavesData();
    
    try {
      const settings = await apiCall('getSettings', { adminPass: null }); 
      window.appLeaveTypes = settings.leaveTypes; // Save globally for editing classification
      document.getElementById('form-leave-type').innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
      document.getElementById('dash-dept').innerHTML = '<option value="">All Departments</option>' + user.departments.map(d => `<option value="${d}">${d}</option>`).join('');
    } catch(e){}
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => { el.classList.add('hidden-view'); el.classList.remove('flex'); });
  const view = document.getElementById(`view-${tabId}`);
  view.classList.remove('hidden-view');
  if(tabId === 'dashboard') view.classList.add('flex');
  
  document.querySelectorAll('#app-view button[id^="tab-"]').forEach(btn => {
    btn.classList.remove('border-blue-600', 'text-blue-600');
    btn.classList.add('text-gray-500', 'border-transparent');
  });
  const activeBtn = document.getElementById(`tab-${tabId}`);
  activeBtn.classList.add('border-blue-600', 'text-blue-600');
  activeBtn.classList.remove('text-gray-500', 'border-transparent');
}

async function loadLeavesData() {
  showLoader(true);
  try {
    allLeaves = await apiCall('getLeaves');
    renderDashboard();
    renderMyLeaves();
  } catch (err) { console.error(err); }
  showLoader(false);
}

function renderDashboard() { filterDashboard(); }

function filterDashboard() {
  const q = document.getElementById('dash-search').value.toLowerCase();
  const d = document.getElementById('dash-dept').value;
  const tDesktop = document.getElementById('dash-body-desktop');
  const tMobile = document.getElementById('dash-body-mobile');
  
  let filtered = allLeaves.filter(l => l.Status !== 'Cancelled');
  if (d) filtered = filtered.filter(l => l.Department.includes(d));
  if (q) {
    const fuse = new Fuse(filtered, { keys:['Name', 'LeaveType'] });
    filtered = fuse.search(q).map(res => res.item);
  }

  tDesktop.innerHTML = filtered.map(l => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-0">
      <td class="px-2 py-1.5 font-medium">${l.Name}</td>
      <td class="px-2 py-1.5 text-gray-500 dark:text-gray-400">${l.Department}</td>
      <td class="px-2 py-1.5">${l.LeaveType} ${l.HalfDay !== 'None' ? '<span class="text-xs ml-1 bg-gray-200 dark:bg-gray-600 px-1 rounded">('+l.HalfDay+')</span>' : ''}</td>
      <td class="px-2 py-1.5">${formatDate(l.StartDate)} - ${formatDate(l.EndDate)}</td>
      <td class="px-2 py-1.5 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-600 font-semibold">${l.Status}</td>
    </tr>
  `).join('');

  tMobile.innerHTML = filtered.map(l => `
    <div class="border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex flex-col">
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-bold">${l.Name} <span class="text-xs font-normal text-gray-500 ml-1">(${l.Department})</span></h3>
        <span class="text-xs font-bold px-2 py-0.5 rounded bg-${l.Status.includes('Pending') ? 'orange' : 'green'}-100 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-700">${l.Status.includes('Pending') ? 'Pending' : 'Cal Updated'}</span>
      </div>
      <p class="font-medium text-gray-700 dark:text-gray-300">${l.LeaveType} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
      <p class="text-xs text-gray-500 mt-1"><span class="font-semibold">Dates:</span> ${formatDate(l.StartDate)} to ${formatDate(l.EndDate)}</p>
    </div>
  `).join('');
}

function renderMyLeaves() {
  const my = allLeaves.filter(l => l.Phone == user.phone);
  const activeLeaves = my.filter(l => l.Status !== 'Cancelled');
  const cancelledLeaves = my.filter(l => l.Status === 'Cancelled');

  const createCard = (l) => `
    <div class="border-2 dark:border-gray-700 p-3 rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-bold text-base">${l.LeaveType}</h3>
        <span class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-bold">${l.Status}</span>
      </div>
      <p><strong>Dates:</strong> ${formatDate(l.StartDate)} - ${formatDate(l.EndDate)} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
      ${l.CoveringPerson && l.CoveringPerson !== 'N/A' ? `<p><strong>Covering:</strong> ${l.CoveringPerson}</p>` : ''}
      ${l.Status !== 'Cancelled' ? `
        <div class="flex space-x-2 mt-3">
          <button onclick="triggerEdit('${l.ID}')" class="font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition">Edit</button>
          <button onclick="cancelLeave('${l.ID}')" class="font-semibold bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition">Cancel</button>
        </div>` : ''}
    </div>
  `;

  document.getElementById('active-leaves-container').innerHTML = activeLeaves.length 
    ? activeLeaves.map(createCard).reverse().join('') 
    : '<p class="text-gray-500">No active records.</p>';

  document.getElementById('cancelled-leaves-container').innerHTML = cancelledLeaves.length 
    ? `<details class="group cursor-pointer">
         <summary class="font-semibold text-gray-500 hover:text-gray-700 select-none outline-none flex items-center">
           <span class="mr-1">▶</span> Cancelled Records (${cancelledLeaves.length})
         </summary>
         <div class="grid gap-2 mt-2 opacity-70 cursor-default">
           ${cancelledLeaves.map(createCard).reverse().join('')}
         </div>
       </details>`
    : '';
}

function triggerEdit(id) {
  const l = allLeaves.find(x => x.ID === id);
  if(!l) return;
  currentEditId = id;
  
  // Decide whether to open Leave form or Event form
  const isEvent = window.appLeaveTypes ? !window.appLeaveTypes.includes(l.LeaveType) : false;
  const ctx = isEvent ? 'event' : 'leave';

  if (isEvent) {
    document.getElementById('form-event-name').value = l.LeaveType;
    document.getElementById('form-event-start').value = new Date(l.StartDate).toISOString().split('T')[0];
    document.getElementById('form-event-end').value = new Date(l.EndDate).toISOString().split('T')[0];
    document.getElementById('form-event-remarks').value = l.Remarks || '';
    document.getElementById('submit-event-btn').innerText = "Update Event";
    document.getElementById('cancel-edit-event-btn').classList.remove('hidden-view');
  } else {
    document.getElementById('form-leave-type').value = l.LeaveType;
    document.getElementById('form-leave-start').value = new Date(l.StartDate).toISOString().split('T')[0];
    document.getElementById('form-leave-end').value = new Date(l.EndDate).toISOString().split('T')[0];
    document.getElementById('form-leave-cover').value = l.CoveringPerson;
    document.getElementById('form-leave-country').value = l.Country || '';
    document.getElementById('form-leave-state').value = l.State || '';
    document.getElementById('form-leave-remarks').value = l.Remarks || '';
    document.getElementById('submit-leave-btn').innerText = "Update Record";
    document.getElementById('cancel-edit-leave-btn').classList.remove('hidden-view');
    toggleOverseasFields();
  }

  // Restore slider visual state
  let start = 'AM', end = 'PM';
  if (l.HalfDay === 'AM') end = 'AM';
  else if (l.HalfDay === 'PM') start = 'PM';
  else if (l.HalfDay === 'Start PM, End AM') { start = 'PM'; end = 'AM'; }
  else if (l.HalfDay === 'Start PM') start = 'PM';
  else if (l.HalfDay === 'End AM') end = 'AM';

  timeData[ctx].start = start; updateTimeSlider('start', ctx, start);
  timeData[ctx].end = end; updateTimeSlider('end', ctx, end);

  switchTab(`submit-${ctx}`);
}

function cancelEditMode() {
  currentEditId = null;
  document.getElementById('leave-form').reset();
  document.getElementById('event-form').reset();
  
  ['leave','event'].forEach(ctx => {
    timeData[ctx] = { start: 'AM', end: 'PM' };
    updateTimeSlider('start', ctx, 'AM');
    updateTimeSlider('end', ctx, 'PM');
  });

  toggleOverseasFields();
  document.getElementById('submit-leave-btn').innerText = "Save Record";
  document.getElementById('cancel-edit-leave-btn').classList.add('hidden-view');
  document.getElementById('submit-event-btn').innerText = "Save Event";
  document.getElementById('cancel-edit-event-btn').classList.add('hidden-view');
  switchTab('my-leaves');
}

function toggleTime(type, ctx) {
  timeData[ctx][type] = timeData[ctx][type] === 'AM' ? 'PM' : 'AM'; 
  updateTimeSlider(type, ctx, timeData[ctx][type]);
}

function updateTimeSlider(type, ctx, val) {
  const slider = document.getElementById(`${type}-${ctx}-slider`);
  const tAM = document.getElementById(`${type}-${ctx}-am`);
  const tPM = document.getElementById(`${type}-${ctx}-pm`);
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
  if (type === 'Overseas Leave' || type === 'Official Trip') {
    el.classList.remove('hidden-view'); cInput.required = true;
  } else {
    el.classList.add('hidden-view'); cInput.required = false;
    cInput.value = ''; document.getElementById('form-leave-state').value = '';
  }
}

async function submitForm(ctx) {
  showLoader(true);
  
  const startD = document.getElementById(`form-${ctx}-start`).value;
  const endD = document.getElementById(`form-${ctx}-end`).value;
  
  let calculatedHalfDay = 'None';
  if (startD === endD) {
    if (timeData[ctx].start === 'AM' && timeData[ctx].end === 'AM') calculatedHalfDay = 'AM';
    else if (timeData[ctx].start === 'PM' && timeData[ctx].end === 'PM') calculatedHalfDay = 'PM';
  } else {
    if (timeData[ctx].start === 'PM' && timeData[ctx].end === 'AM') calculatedHalfDay = 'Start PM, End AM';
    else if (timeData[ctx].start === 'PM') calculatedHalfDay = 'Start PM';
    else if (timeData[ctx].end === 'AM') calculatedHalfDay = 'End AM';
  }

  const payload = {
    id: currentEditId,
    name: user.name, phone: user.phone, departments: user.departments,
    leaveType: ctx === 'leave' ? document.getElementById('form-leave-type').value : document.getElementById('form-event-name').value,
    startDate: startD,
    endDate: endD,
    halfDay: calculatedHalfDay, 
    coveringPerson: ctx === 'leave' ? document.getElementById('form-leave-cover').value : 'N/A',
    country: ctx === 'leave' ? document.getElementById('form-leave-country').value : '',
    state: ctx === 'leave' ? document.getElementById('form-leave-state').value : '',
    remarks: document.getElementById(`form-${ctx}-remarks`).value
  };

  try {
    const action = currentEditId ? 'editLeave' : 'submitLeave';
    const res = await apiCall(action, payload);
    alert(res.status.includes('Cal Updated') || res.status.includes('Approved') ? `Record successfully ${currentEditId ? 'updated' : 'submitted'}!` : "Record marked as Pending due to constraints. Admin notified.");
    cancelEditMode();
    loadLeavesData();
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}

async function cancelLeave(id) {
  if(!confirm("Are you sure you want to cancel this record?")) return;
  showLoader(true);
  try {
    await apiCall('cancelLeave', { id: id, phone: user.phone });
    loadLeavesData();
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.log('SW failed')));
}

function animateAndUpdate(btn) {
  const icon = btn.querySelector('svg');
  if (icon) icon.classList.add('animate-spin'); 
  setTimeout(() => { updateApp(); }, 300); 
}

async function updateApp() {
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let reg of regs) await reg.unregister(); 
      const names = await caches.keys();
      for (let name of names) await caches.delete(name); 
    } catch(err) {}
  }
  window.location.href = window.location.pathname + '?v=' + new Date().getTime();
}
