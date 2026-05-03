// ==========================================
// Admin Settings, User Management & GitHub Backup
// ==========================================

let userToDeleteResource = null;
let userToManageResource = null;

function populateAdminSettingsForm(settings) {
  document.getElementById('set-kah-limit').value = settings.kahLimit;
  document.getElementById('set-appr-email').value = settings.approvingAuthority;
  document.getElementById('set-user-keyword').value = settings.userKeyword || 'peace';
  document.getElementById('set-github-repo').value = settings.githubRepo || '';
  document.getElementById('set-backup-folder').value = settings.backupFolder || '';
  
  const radios = document.getElementsByName('app-mode');
  radios.forEach(r => { if(r.value === appMode) r.checked = true; });

  tempMenuOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
  renderMenuOrder();

  tempLeaveTypes = settings.leaveTypes ||[];
  renderLeaveTypes();
  
  adminKAHList = settings.kahList ||[];
  renderKAHSelected();
}

async function loadAdminSettings() {
  try {
    const settings = await apiCall('getSettings', { adminPass: user.pass });
    appMode = settings.appMode || 'separated';
    companyStructure = settings.companyStructure || {};
    populateAdminSettingsForm(settings);
    
    if(settings.allContacts) {
      companyContacts = settings.allContacts;
      fuseAllContacts = new Fuse(settings.allContacts, { keys:['name', 'dept', 'phone'], threshold: 0.3 });
      
      let allUnits = new Set();
      Object.keys(companyStructure).forEach(p => {
        allUnits.add(p);
        companyStructure[p].forEach(c => allUnits.add(c));
      });
      const uniqueDepts = Array.from(allUnits).sort();
      
      const regOptions = '<option value="" disabled selected>Select...</option>' + uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
      
      const adminRegUnit = document.getElementById('admin-reg-unit');
      const editUserUnit = document.getElementById('edit-user-unit');
      if (adminRegUnit) adminRegUnit.innerHTML = regOptions;
      if (editUserUnit) editUserUnit.innerHTML = regOptions;
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
  window.menuSortable = new Sortable(list, { animation: 150, handle: '.handle', ghostClass: 'opacity-50', onEnd: function () { tempMenuOrder = Array.from(list.children).map(el => el.dataset.id); } });
}

function renderLeaveTypes() {
  const list = document.getElementById('leave-types-list');
  if(!list) return;
  list.innerHTML = tempLeaveTypes.map((t, i) => `
    <div data-val="${t}" class="flex items-center space-x-3 bg-white dark:bg-darksurface p-2 rounded-xl border dark:border-darkborder shadow-sm cursor-grab">
      <svg class="w-5 h-5 text-gray-400 dark:text-darkmuted handle-leave cursor-grab shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
      <input type="text" value="${t}" onchange="updateLeaveType(this)" class="flex-grow border-2 border-gray-200 dark:border-gray-600 rounded-lg py-1.5 px-3 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition">
      <button type="button" onclick="removeLeaveType('${t}')" class="text-red-500 hover:text-red-700 p-2 rounded-lg transition" title="Remove Type"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
    </div>
  `).join('');
  if(window.leaveTypeSortable) window.leaveTypeSortable.destroy();
  window.leaveTypeSortable = new Sortable(list, { animation: 150, handle: '.handle-leave', ghostClass: 'opacity-50', onEnd: function () { tempLeaveTypes = Array.from(list.children).map(el => el.dataset.val); } });
}

function addLeaveType() {
  const input = document.getElementById('new-leave-type');
  if(input && input.value.trim()) { tempLeaveTypes.push(input.value.trim()); input.value = ''; renderLeaveTypes(); }
}
function removeLeaveType(val) { tempLeaveTypes = tempLeaveTypes.filter(t => t !== val); renderLeaveTypes(); }
function updateLeaveType(inputEl) {
  const oldVal = inputEl.closest('div').dataset.val;
  const newVal = inputEl.value.trim();
  const idx = tempLeaveTypes.indexOf(oldVal);
  if(idx !== -1) tempLeaveTypes[idx] = newVal;
  inputEl.closest('div').dataset.val = newVal;
}

function searchKAH() {
  const q = document.getElementById('kah-search').value;
  const resC = document.getElementById('kah-results');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
  if(results.length > 0) {
    resC.innerHTML = results.map(c => `<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover" onclick="addKAH('${c.phone}', '${c.name.replace(/'/g, "\\'")}', '${c.dept}')">${c.name} <span class="text-xs text-gray-500 ml-1">(${c.dept})</span></div>`).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}

function addKAH(phone, name, dept) {
  if(!adminKAHList.some(k => k.phone === phone)) { adminKAHList.push({ phone, name, dept }); renderKAHSelected(); }
  document.getElementById('kah-search').value = '';
  document.getElementById('kah-results').classList.add('hidden-view');
}
function removeKAH(phone) { adminKAHList = adminKAHList.filter(k => k.phone !== phone); renderKAHSelected(); }

function renderKAHSelected() {
  const list = document.getElementById('kah-selected-list');
  if(!list) return;
  if (adminKAHList.length === 0) {
    list.innerHTML = `<p class="text-gray-500 dark:text-darkmuted text-sm text-center italic py-2">No KAH personnel added yet.</p>`;
    return;
  }
  
  const unitToParent = {};
  for (const parent in companyStructure) { companyStructure[parent].forEach(child => { unitToParent[child.toUpperCase()] = parent; }); }

  const grouped = {};
  adminKAHList.forEach(k => {
    const d = k.dept.toUpperCase();
    const parent = unitToParent[d] || (companyStructure[d] ? d : 'Uncategorized');
    if (!grouped[parent]) grouped[parent] = {};
    if (!grouped[parent][d]) grouped[parent][d] = [];
    grouped[parent][d].push(k);
  });

  let html = '';
  for (const parent in grouped) {
    html += `<div class="mb-4"><h4 class="font-bold text-lg text-gray-800 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600 pb-1 mb-2">${parent}</h4>`;
    for (const child in grouped[parent]) {
      if (child !== parent && child !== 'Uncategorized') html += `<h5 class="font-semibold text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1 pl-2 border-l-2 border-blue-400">${child}</h5>`;
      html += `<div class="space-y-1">`;
      grouped[parent][child].forEach(k => {
        html += `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border dark:border-darkborder shadow-sm pl-4"><span class="font-medium">${k.name} <span class="text-xs text-gray-500 ml-1">(${k.dept})</span></span><button onclick="removeKAH('${k.phone}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg font-bold px-3 transition">&times;</button></div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  }
  list.innerHTML = html;
}

function searchUserToManage() {
  const q = document.getElementById('admin-manage-search').value;
  const resC = document.getElementById('admin-manage-results');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  
  const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
  if(results.length > 0) {
    resC.innerHTML = results.map(c => `<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400" onclick="selectUserToManage('${c.resourceName}', '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.dept}', '${c.birthday || ''}')"><span class="font-semibold">${c.name}</span> <span class="text-xs opacity-75 ml-1">(${c.dept})</span></div>`).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}

function selectUserToManage(resourceName, name, phone, dept, birthday) {
  userToManageResource = resourceName;
  document.getElementById('edit-user-name').value = name;
  document.getElementById('edit-user-mobile').value = phone;
  document.getElementById('edit-user-unit').value = dept;
  
  if (birthday) {
    const parts = birthday.split('-');
    appData.manageUser.birthdayD = new Date(parts[0], parseInt(parts[1])-1, parts[2]);
    appData.manageUser.birthdaySelected = true;
  } else {
    appData.manageUser.birthdayD = new Date(2000, 0, 1);
    appData.manageUser.birthdaySelected = false;
  }
  updateButtonLabels();
  
  document.getElementById('user-to-manage-container').classList.remove('hidden-view');
  document.getElementById('admin-manage-search').value = '';
  document.getElementById('admin-manage-results').classList.add('hidden-view');
}

function cancelManageUser() {
  userToManageResource = null;
  document.getElementById('user-to-manage-container').classList.add('hidden-view');
}

async function confirmUpdateUser() {
  if (!userToManageResource) return;
  const name = document.getElementById('edit-user-name').value.trim();
  const mobile = document.getElementById('edit-user-mobile').value.trim();
  const unit = document.getElementById('edit-user-unit').value;
  
  if (!name || !mobile || !unit) return alert("Please fill in all fields.");
  if (!appData.manageUser.birthdaySelected) return alert("Please select a Birthday.");
  
  const bday = appData.manageUser.birthdayD;
  const bdayStr = `${bday.getFullYear()}-${String(bday.getMonth()+1).padStart(2,'0')}-${String(bday.getDate()).padStart(2,'0')}`;
  
  showLoader(true);
  try {
    await apiCall('updateUser', { adminPass: user.pass, resourceName: userToManageResource, fullName: name, mobile: mobile, unit: unit, birthday: bdayStr });
    alert("User successfully updated.");
    cancelManageUser(); await loadAdminSettings();
  } catch(e) { alert("Error updating user: " + e.message); } finally { showLoader(false); }
}

async function confirmDeleteUser() {
  if (!userToManageResource) return;
  if (!confirm("Are you sure you want to permanently remove this user from the system and Google Contacts? This cannot be undone.")) return;
  showLoader(true);
  try {
    await apiCall('deleteUser', { adminPass: user.pass, resourceName: userToManageResource });
    alert("User successfully removed.");
    cancelManageUser(); await loadAdminSettings();
  } catch(e) { alert("Error deleting user: " + e.message); } finally { showLoader(false); }
}

function submitAdminRegister() { handleRegister('admin'); }

async function saveAdminSettings() {
  showLoader(true);
  const newPass = document.getElementById('set-admin-pass').value || null;
  let selectedMode = 'separated';
  document.getElementsByName('app-mode').forEach(r => { if(r.checked) selectedMode = r.value; });

  const payload = {
    adminPass: user.pass, newAdminPass: newPass, appMode: selectedMode,
    userKeyword: document.getElementById('set-user-keyword').value.trim() || 'peace',
    menuOrder: tempMenuOrder, leaveTypes: tempLeaveTypes.filter(Boolean),
    kahLimit: document.getElementById('set-kah-limit').value,
    approvingAuthority: document.getElementById('set-appr-email').value,
    kahList: adminKAHList,
    githubRepo: document.getElementById('set-github-repo').value.trim(),
    backupFolder: document.getElementById('set-backup-folder').value.trim()
  };
  
  try {
    await apiCall('saveSettings', payload);
    alert("Settings successfully saved! App will reload to apply UI changes.");
    if(newPass) { user.pass = newPass; localStorage.setItem('user', JSON.stringify(user)); }
    window.location.reload(); 
  } catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function triggerCodeBackup() {
  const repo = document.getElementById('set-github-repo').value.trim();
  const folderInput = document.getElementById('set-backup-folder').value.trim();
  if (!repo || !folderInput) return alert('Please fill out the GitHub Repo and Backup Drive Folder fields, and click "Save Settings" before backing up.');
  let folderId = folderInput;
  if (folderInput.includes('drive.google.com')) { const match = folderInput.match(/folders\/([a-zA-Z0-9_-]+)/); if (match) folderId = match[1]; }

  showLoader(true);
  try {
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`);
      if (!repoRes.ok) throw new Error("GitHub repo not found.");
      const defaultBranch = (await repoRes.json()).default_branch || 'main';
      const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`);
      const treeData = await treeRes.json();
      const fileNodes = treeData.tree.filter(item => item.type === 'blob');
      
      let compiledFiles = new Array();
      for (const file of fileNodes) {
          const content = await (await fetch(`https://raw.githubusercontent.com/${repo}/${defaultBranch}/${file.path}`)).text();
          compiledFiles.push({ url: `https://github.com/${repo}/blob/${defaultBranch}/${file.path}`, content: content });
      }

      const res = await apiCall('backupCode', { folderId: folderId, hierarchy: fileNodes.map(f=>f.path).join('\n'), files: compiledFiles });
      alert(`Code successfully backed up!\n\nURL:\n${res.url}`);
  } catch (err) { alert("Backup Error: " + err.message); } finally { showLoader(false); }
}
