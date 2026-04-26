// --- Global State ---
let user = JSON.parse(localStorage.getItem('user')) || null;
let allLeaves =[];
let formTimeStart = 'AM';
let formTimeEnd = 'PM';
let currentEditId = null;

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
    document.getElementById('nav-user-name').innerText = "Administrator";['tab-dashboard','tab-my-leaves','tab-submit-leave'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('tab-admin').classList.remove('hidden');
    switchTab('admin');
    if (typeof loadAdminSettings === 'function') loadAdminSettings();
  } else {
    document.getElementById('nav-user-name').innerText = user.departments.length ? `${user.name} [${user.departments[0]}]` : user.name;['tab-dashboard','tab-my-leaves','tab-submit-leave'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    document.getElementById('tab-admin').classList.add('hidden');
    switchTab('dashboard');
    loadLeavesData();
    
    try {
      const settings = await apiCall('getSettings', { adminPass: null }); 
      document.getElementById('form-type').innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
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
      <td class="p-3 font-medium">${l.Name}</td>
      <td class="p-3 text-gray-500 dark:text-gray-400">${l.Department}</td>
      <td class="p-3">${l.LeaveType} ${l.HalfDay !== 'None' ? '<span class="text-xs ml-1 bg-gray-200 dark:bg-gray-600 px-1 rounded">('+l.HalfDay+')</span>' : ''}</td>
      <td class="p-3">${formatDate(l.StartDate)} - ${formatDate(l.EndDate)}</td>
      <td class="p-3 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-600 font-semibold">${l.Status}</td>
    </tr>
  `).join('');

  tMobile.innerHTML = filtered.map(l => `
    <div class="border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm bg-white dark:bg-gray-800 flex flex-col">
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-bold text-base">${l.Name} <span class="text-xs font-normal text-gray-500 ml-1">(${l.Department})</span></h3>
        <span class="text-xs font-bold px-2 py-1 rounded bg-${l.Status.includes('Pending') ? 'orange' : 'green'}-100 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-700">${l.Status.includes('Pending') ? 'Pending' : 'Approved'}</span>
      </div>
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${l.LeaveType} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
      <p class="text-xs text-gray-500"><span class="font-semibold">Dates:</span> ${formatDate(l.StartDate)} to ${formatDate(l.EndDate)}</p>
    </div>
  `).join('');
}

function renderMyLeaves() {
  const my = allLeaves.filter(l => l.Phone == user.phone);
  document.getElementById('my-leaves-container').innerHTML = my.length ? my.map(l => `
    <div class="border-2 dark:border-gray-700 p-4 rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-lg">${l.LeaveType}</h3>
        <span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 font-bold">${l.Status}</span>
      </div>
      <p class="text-sm"><strong>Dates:</strong> ${formatDate(l.StartDate)} - ${formatDate(l.EndDate)} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
      <p class="text-sm"><strong>Covering:</strong> ${l.CoveringPerson}</p>
      ${l.Status !== 'Cancelled' ? `
        <div class="flex space-x-2 mt-4">
          <button onclick="triggerEdit('${l.ID}')" class="text-sm font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-1.5 rounded transition">Edit</button>
          <button onclick="cancelLeave('${l.ID}')" class="text-sm font-semibold bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded transition">Cancel</button>
        </div>` : ''}
    </div>
  `).reverse().join('') : '<p class="text-gray-500">No leaves submitted yet.</p>';
}

function triggerEdit(id) {
  const l = allLeaves.find(x => x.ID === id);
  if(!l) return;
  currentEditId = id;
  
  document.getElementById('form-type').value = l.LeaveType;
  document.getElementById('form-start').value = new Date(l.StartDate).toISOString().split('T')[0];
  document.getElementById('form-end').value = new Date(l.EndDate).toISOString().split('T')[0];
  document.getElementById('form-cover').value = l.CoveringPerson;
  document.getElementById('form-country').value = l.Country || '';
  document.getElementById('form-state').value = l.State || '';
  document.getElementById('form-remarks').value = l.Remarks || '';

  let start = 'AM', end = 'PM';
  if (l.HalfDay === 'AM') end = 'AM';
  else if (l.HalfDay === 'PM') start = 'PM';
  else if (l.HalfDay === 'Start PM, End AM') { start = 'PM'; end = 'AM'; }
  else if (l.HalfDay === 'Start PM') start = 'PM';
  else if (l.HalfDay === 'End AM') end = 'AM';

  formTimeStart = start; updateTimeSlider('start', start);
  formTimeEnd = end; updateTimeSlider('end', end);

  toggleOverseasFields();
  document.getElementById('submit-btn-text').innerText = "Update Forecast";
  document.getElementById('cancel-edit-btn').classList.remove('hidden-view');
  switchTab('submit-leave');
}

function cancelEditMode() {
  currentEditId = null;
  document.getElementById('leave-form').reset();
  formTimeStart = 'AM'; updateTimeSlider('start', 'AM');
  formTimeEnd = 'PM'; updateTimeSlider('end', 'PM');
  toggleOverseasFields();
  document.getElementById('submit-btn-text').innerText = "Submit Forecast";
  document.getElementById('cancel-edit-btn').classList.add('hidden-view');
  switchTab('my-leaves');
}

function toggleTime(type) {
  if (type === 'start') { formTimeStart = formTimeStart === 'AM' ? 'PM' : 'AM'; updateTimeSlider('start', formTimeStart); }
  else { formTimeEnd = formTimeEnd === 'AM' ? 'PM' : 'AM'; updateTimeSlider('end', formTimeEnd); }
}

function updateTimeSlider(type, val) {
  const slider = document.getElementById(`${type}-slider`);
  const tAM = document.getElementById(`${type}-am-text`);
  const tPM = document.getElementById(`${type}-pm-text`);
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
  const type = document.getElementById('form-type').value;
  const el = document.getElementById('overseas-fields');
  const countryInput = document.getElementById('form-country');
  if (type === 'Overseas Leave' || type === 'Official Trip') {
    el.classList.remove('hidden-view');
    countryInput.required = true;
  } else {
    el.classList.add('hidden-view');
    countryInput.required = false;
    countryInput.value = ''; document.getElementById('form-state').value = '';
  }
}

async function submitLeaveForm() {
  showLoader(true);
  let calculatedHalfDay = 'None';
  const isSameDay = document.getElementById('form-start').value === document.getElementById('form-end').value;

  if (isSameDay) {
    if (formTimeStart === 'AM' && formTimeEnd === 'AM') calculatedHalfDay = 'AM';
    else if (formTimeStart === 'PM' && formTimeEnd === 'PM') calculatedHalfDay = 'PM';
  } else {
    if (formTimeStart === 'PM' && formTimeEnd === 'AM') calculatedHalfDay = 'Start PM, End AM';
    else if (formTimeStart === 'PM') calculatedHalfDay = 'Start PM';
    else if (formTimeEnd === 'AM') calculatedHalfDay = 'End AM';
  }

  const payload = {
    id: currentEditId,
    name: user.name, phone: user.phone, departments: user.departments,
    leaveType: document.getElementById('form-type').value,
    startDate: document.getElementById('form-start').value,
    endDate: document.getElementById('form-end').value,
    halfDay: calculatedHalfDay, 
    coveringPerson: document.getElementById('form-cover').value,
    country: document.getElementById('form-country').value,
    state: document.getElementById('form-state').value,
    remarks: document.getElementById('form-remarks').value
  };

  try {
    const action = currentEditId ? 'editLeave' : 'submitLeave';
    const res = await apiCall(action, payload);
    alert(res.status === 'Approved' ? `Leave successfully ${currentEditId ? 'updated' : 'submitted'}!` : "Leave marked as Pending due to constraints. Admin notified.");
    cancelEditMode();
    loadLeavesData();
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}

async function cancelLeave(id) {
  if(!confirm("Are you sure you want to cancel this leave? This will remove it from the Calendar.")) return;
  showLoader(true);
  try {
    await apiCall('cancelLeave', { id: id, phone: user.phone });
    loadLeavesData();
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}

// --- PWA Service Worker & Deep Update logic ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.log('SW failed: ', err)));
}

function animateAndUpdate(btn) {
  const icon = btn.querySelector('svg');
  if (icon) icon.classList.add('animate-spin'); // Apply spinning visual
  setTimeout(() => { updateApp(); }, 300); // Small visual delay before hard refresh sequence
}

async function updateApp() {
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let reg of regs) await reg.unregister(); // Delete all active workers
      const names = await caches.keys();
      for (let name of names) await caches.delete(name); // Purge absolutely all saved assets
    } catch(err) { console.error('Cache clearance error', err); }
  }
  // Force hard reload bypassing cache using query string to guarantee the newest version is pulled
  window.location.href = window.location.pathname + '?v=' + new Date().getTime();
}
