// --- Global State ---
let user = JSON.parse(localStorage.getItem('user')) || null;
let allLeaves =[];

// --- Init & Theme ---
if(localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  if (ENV === 'Dev') {
    document.getElementById('dev-banner').classList.remove('hidden');
  }

  if (user) showApp();
  else showLogin();
  
  document.getElementById('login-pass').addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
});

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

function togglePassword(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// --- Auth ---
function showLogin() {
  document.getElementById('login-view').classList.remove('hidden-view');
  document.getElementById('app-view').classList.add('hidden-view');
  document.getElementById('nav-user-name').innerText = '';
  document.getElementById('logout-btn').classList.add('hidden');
}

async function handleLogin() {
  const phone = document.getElementById('login-phone').value;
  const pass = document.getElementById('login-pass').value;
  if(!phone || !pass) return alertError('login-alert', 'Please enter details');
  
  showLoader(true);
  try {
    user = await apiCall('login', { phone, password: pass });
    localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('login-phone').value = '';
    document.getElementById('login-pass').value = '';
    showApp();
  } catch (err) {
    alertError('login-alert', err.message);
  }
  showLoader(false);
}

function logout() {
  localStorage.removeItem('user');
  user = null;
  showLogin();
}

// --- App Core ---
async function showApp() {
  document.getElementById('login-view').classList.add('hidden-view');
  document.getElementById('app-view').classList.remove('hidden-view');
  document.getElementById('nav-user-name').innerText = user.name;
  document.getElementById('logout-btn').classList.remove('hidden');
  switchTab('dashboard');
  loadLeavesData();
  
  try {
    const settings = await apiCall('getSettings', { adminPass: null }); 
    const select = document.getElementById('form-type');
    select.innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    
    const deptSelect = document.getElementById('dash-dept');
    deptSelect.innerHTML = '<option value="">All Departments</option>' + user.departments.map(d => `<option value="${d}">${d}</option>`).join('');
  } catch(e){}
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden-view'));
  document.getElementById(`view-${tabId}`).classList.remove('hidden-view');
  
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

// --- Dashboard & Filtering ---
function renderDashboard() {
  filterDashboard(); 
}

function filterDashboard() {
  const q = document.getElementById('dash-search').value.toLowerCase();
  const d = document.getElementById('dash-dept').value;
  const tbody = document.getElementById('dash-body');
  
  let filtered = allLeaves.filter(l => l.Status !== 'Cancelled');
  if (d) filtered = filtered.filter(l => l.Department.includes(d));
  
  if (q) {
    const fuse = new Fuse(filtered, { keys:['Name', 'LeaveType'] });
    filtered = fuse.search(q).map(res => res.item);
  }

  tbody.innerHTML = filtered.map(l => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td class="p-3">${l.Name}</td>
      <td class="p-3">${l.Department}</td>
      <td class="p-3">${l.LeaveType} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</td>
      <td class="p-3">${new Date(l.StartDate).toLocaleDateString()} - ${new Date(l.EndDate).toLocaleDateString()}</td>
      <td class="p-3 text-${l.Status.includes('Pending') ? 'orange' : 'green'}-600 font-medium">${l.Status}</td>
    </tr>
  `).join('');
}

function renderMyLeaves() {
  const my = allLeaves.filter(l => l.Phone == user.phone);
  document.getElementById('my-leaves-container').innerHTML = my.length ? my.map(l => `
    <div class="border dark:border-gray-700 p-4 rounded shadow-sm bg-white dark:bg-gray-800">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-lg">${l.LeaveType}</h3>
        <span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 font-bold">${l.Status}</span>
      </div>
      <p class="text-sm"><strong>Dates:</strong> ${new Date(l.StartDate).toLocaleDateString()} - ${new Date(l.EndDate).toLocaleDateString()} ${l.HalfDay !== 'None' ? '('+l.HalfDay+')' : ''}</p>
      <p class="text-sm"><strong>Covering:</strong> ${l.CoveringPerson}</p>
      ${l.Status !== 'Cancelled' ? `<button onclick="cancelLeave('${l.ID}')" class="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition">Cancel Leave</button>` : ''}
    </div>
  `).reverse().join('') : '<p class="text-gray-500">No leaves submitted yet.</p>';
}

// --- Form Actions ---
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
    countryInput.value = '';
    document.getElementById('form-state').value = '';
  }
}

async function submitLeaveForm() {
  showLoader(true);
  const payload = {
    name: user.name, phone: user.phone, departments: user.departments,
    leaveType: document.getElementById('form-type').value,
    startDate: document.getElementById('form-start').value,
    endDate: document.getElementById('form-end').value,
    halfDay: document.getElementById('form-half').value,
    coveringPerson: document.getElementById('form-cover').value,
    country: document.getElementById('form-country').value,
    state: document.getElementById('form-state').value,
    remarks: document.getElementById('form-remarks').value
  };

  try {
    const res = await apiCall('submitLeave', payload);
    alert(res.status === 'Approved' ? "Leave successfully submitted and approved!" : "Leave submitted but marked as Pending due to KAH limits. Admin notified.");
    document.getElementById('leave-form').reset();
    toggleOverseasFields();
    loadLeavesData();
    switchTab('my-leaves');
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

// --- PWA Service Worker & Update logic ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed: ', err));
  });
}

function updateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) { registration.unregister(); }
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      }).then(() => window.location.reload(true));
    });
  } else {
    window.location.reload(true);
  }
}
