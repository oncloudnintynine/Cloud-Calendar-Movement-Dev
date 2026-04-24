// --- Admin Global State ---
let adminSettings = null; 
let selectedKAH =[];
let fuseContacts = null;
let tempAdminPass = '';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-pass').addEventListener('keypress', e => e.key === 'Enter' && verifyAdmin());
});

function showAdminLogin() {
  document.getElementById('admin-overlay').classList.remove('hidden');
  document.getElementById('admin-login-step').classList.remove('hidden-view');
  document.getElementById('admin-settings-step').classList.add('hidden-view');
  document.getElementById('admin-pass').value = '';
}

async function verifyAdmin() {
  const pass = document.getElementById('admin-pass').value;
  showLoader(true);
  try {
    adminSettings = await apiCall('getSettings', { adminPass: pass });
    tempAdminPass = pass;
    
    // Populate form
    document.getElementById('set-leave-types').value = adminSettings.leaveTypes.join(', ');
    document.getElementById('set-kah-limit').value = adminSettings.kahLimit;
    document.getElementById('set-appr-email').value = adminSettings.approvingAuthority;
    selectedKAH = adminSettings.kahList ||[];
    
    fuseContacts = new Fuse(adminSettings.allContacts, { keys:['name', 'phone', 'dept'] });
    renderSelectedKAH();
    
    document.getElementById('admin-login-step').classList.add('hidden-view');
    document.getElementById('admin-settings-step').classList.remove('hidden-view');
  } catch (err) { alertError('admin-alert', err.message); }
  showLoader(false);
}

function searchKAH() {
  const q = document.getElementById('kah-search').value;
  const resContainer = document.getElementById('kah-results');
  if(!q) return resContainer.innerHTML = '';
  
  const results = fuseContacts.search(q).slice(0, 5).map(r => r.item);
  resContainer.innerHTML = results.map(c => `
    <div class="p-2 border-b dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 flex justify-between" onclick="addKAH('${c.phone}', '${c.name}', '${c.dept}')">
      <span>${c.name} (${c.dept})</span><span class="text-xs text-blue-500 text-bold">+ Add</span>
    </div>
  `).join('');
}

function addKAH(phone, name, dept) {
  if(!selectedKAH.some(k => k.phone === phone)) {
    selectedKAH.push({ phone, name, dept });
    renderSelectedKAH();
  }
  document.getElementById('kah-search').value = '';
  document.getElementById('kah-results').innerHTML = '';
}

function removeKAH(phone) {
  selectedKAH = selectedKAH.filter(k => k.phone !== phone);
  renderSelectedKAH();
}

function renderSelectedKAH() {
  document.getElementById('kah-selected-list').innerHTML = selectedKAH.map(k => `
    <li class="flex justify-between items-center border-b dark:border-gray-700 py-1">
      <span>${k.name} <span class="text-xs text-gray-500">(${k.dept})</span></span>
      <button onclick="removeKAH('${k.phone}')" class="text-red-500 font-bold">&times;</button>
    </li>
  `).join('');
}

async function saveAdminSettings() {
  showLoader(true);
  const payload = {
    adminPass: tempAdminPass,
    newAdminPass: document.getElementById('set-admin-pass').value || null,
    leaveTypes: document.getElementById('set-leave-types').value.split(',').map(s => s.trim()).filter(Boolean),
    kahLimit: document.getElementById('set-kah-limit').value,
    approvingAuthority: document.getElementById('set-appr-email').value,
    kahList: selectedKAH
  };
  
  try {
    await apiCall('saveSettings', payload);
    alert("Settings Saved!");
    document.getElementById('admin-overlay').classList.add('hidden');
    if(payload.newAdminPass) tempAdminPass = payload.newAdminPass;
  } catch (err) { alert("Error: " + err.message); }
  showLoader(false);
}
