// --- Admin Global State ---
let adminSettings = null; 
let selectedKAH =[];
let fuseContacts = null;

async function loadAdminSettings() {
  if (!user || user.role !== 'admin') return;
  
  showLoader(true);
  try {
    adminSettings = await apiCall('getSettings', { adminPass: user.pass });
    
    // Populate form
    document.getElementById('set-leave-types').value = adminSettings.leaveTypes.join(', ');
    document.getElementById('set-kah-limit').value = adminSettings.kahLimit;
    document.getElementById('set-appr-email').value = adminSettings.approvingAuthority;
    selectedKAH = adminSettings.kahList ||[];
    
    fuseContacts = new Fuse(adminSettings.allContacts, { keys:['name', 'phone', 'dept'] });
    renderSelectedKAH();
  } catch (err) { 
    alert("Error loading settings: " + err.message); 
  }
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
    <li class="flex justify-between items-center border-b dark:border-gray-700 py-1 px-2">
      <span>${k.name} <span class="text-xs text-gray-500">(${k.dept})</span></span>
      <button onclick="removeKAH('${k.phone}')" class="text-red-500 font-bold hover:text-red-700 text-lg">&times;</button>
    </li>
  `).join('');
}

async function saveAdminSettings() {
  showLoader(true);
  const newPass = document.getElementById('set-admin-pass').value || null;
  
  const payload = {
    adminPass: user.pass,
    newAdminPass: newPass,
    leaveTypes: document.getElementById('set-leave-types').value.split(',').map(s => s.trim()).filter(Boolean),
    kahLimit: document.getElementById('set-kah-limit').value,
    approvingAuthority: document.getElementById('set-appr-email').value,
    kahList: selectedKAH
  };
  
  try {
    await apiCall('saveSettings', payload);
    alert("Settings successfully saved!");
    if(newPass) {
      user.pass = newPass;
      localStorage.setItem('user', JSON.stringify(user));
      document.getElementById('set-admin-pass').value = ''; // clear input field
    }
  } catch (err) { 
    alert("Error saving settings: " + err.message); 
  }
  showLoader(false);
}
