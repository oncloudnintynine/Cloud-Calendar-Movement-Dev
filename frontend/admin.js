// ==========================================
// Admin Settings, User Management & GitHub Backup
// ==========================================

let userToManageResource = null;

async function loadAdminSettings() {
  try {
    const settings = await apiCall('getSettings', { adminPass: user.pass });
    document.getElementById('set-kah-limit').value = settings.kahLimit;
    document.getElementById('set-appr-email').value = settings.approvingAuthority;
    document.getElementById('set-user-keyword').value = settings.userKeyword || 'peace';
    
    document.getElementById('set-github-repo').value = settings.githubRepo || '';
    document.getElementById('set-backup-folder').value = settings.backupFolder || '';
    
    tempMenuOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
    renderMenuOrder();

    tempLeaveTypes = settings.leaveTypes ||[];
    renderLeaveTypes();
    
    adminKAHList = settings.kahList ||[];
    renderKAHSelected();
    
    if(settings.allContacts) {
      fuseAllContacts = new Fuse(settings.allContacts, { keys:['name', 'dept', 'phone'], threshold: 0.3 });
      
      // Populate the Admin Register & Edit Unit dropdowns dynamically
      const uniqueDepts =[...new Set(settings.allContacts.map(c => c.dept))];
      const regOptions = '<option value="" disabled selected>Select...</option>' + 
                         uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
      
      const adminRegUnit = document.getElementById('admin-reg-unit');
      const editUserUnit = document.getElementById('edit-user-unit');
      
      if (adminRegUnit) adminRegUnit.innerHTML = regOptions;
      if (editUserUnit) editUserUnit.innerHTML = regOptions;
    }
  } catch (err) { 
    alertError('login-alert', err.message); 
  }
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
      <input type="text" value="${t}" onchange="updateLeaveType(${i}, this.value)" class="flex-grow border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none shadow-sm focus:border-blue-500 transition">
      <button type="button" onclick="removeLeaveType(${i})" class="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl transition" title="Remove Type"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
    </div>
  `).join('');
}

function addLeaveType() {
  const input = document.getElementById('new-leave-type');
  if(input && input.value.trim()) { 
    tempLeaveTypes.push(input.value.trim()); 
    input.value = ''; 
    renderLeaveTypes(); 
  }
}

function removeLeaveType(i) { 
  tempLeaveTypes.splice(i, 1); 
  renderLeaveTypes(); 
}

function updateLeaveType(i, val) { 
  tempLeaveTypes[i] = val.trim(); 
}

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
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; 
    resC.classList.remove('hidden-view');
  }
}

function addKAH(phone, name, dept) {
  if(!adminKAHList.some(k => k.phone === phone)) {
    adminKAHList.push({ phone, name, dept }); 
    renderKAHSelected();
  }
  document.getElementById('kah-search').value = '';
  document.getElementById('kah-results').classList.add('hidden-view');
}

function removeKAH(phone) { 
  adminKAHList = adminKAHList.filter(k => k.phone !== phone); 
  renderKAHSelected(); 
}

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

// --- Manage Users Logic ---
function searchUserToManage() {
  const q = document.getElementById('admin-manage-search').value;
  const resC = document.getElementById('admin-manage-results');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  
  const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
  if(results.length > 0) {
    resC.innerHTML = results.map(c => `
      <div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400" onclick="selectUserToManage('${c.resourceName}', '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.dept}')">
        <span class="font-semibold">${c.name}</span> <span class="text-xs opacity-75 ml-1">(${c.dept})</span>
      </div>
    `).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; 
    resC.classList.remove('hidden-view');
  }
}

function selectUserToManage(resourceName, name, phone, dept) {
  userToManageResource = resourceName;
  document.getElementById('edit-user-name').value = name;
  document.getElementById('edit-user-mobile').value = phone;
  document.getElementById('edit-user-unit').value = dept;
  
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
  
  showLoader(true);
  try {
    await apiCall('updateUser', {
      adminPass: user.pass, 
      resourceName: userToManageResource,
      fullName: name,
      mobile: mobile,
      unit: unit
    });
    alert("User successfully updated.");
    cancelManageUser();
    await loadAdminSettings();
  } catch(e) {
    alert("Error updating user: " + e.message);
  } finally {
    showLoader(false);
  }
}

async function confirmDeleteUser() {
  if (!userToManageResource) return;
  if (!confirm("Are you sure you want to permanently remove this user from the system and Google Contacts? This cannot be undone.")) return;
  
  showLoader(true);
  try {
    await apiCall('deleteUser', { adminPass: user.pass, resourceName: userToManageResource });
    alert("User successfully removed.");
    cancelManageUser();
    await loadAdminSettings();
  } catch(e) {
    alert("Error deleting user: " + e.message);
  } finally {
    showLoader(false);
  }
}

function submitAdminRegister() {
  handleRegister('admin');
}

async function saveAdminSettings() {
  showLoader(true);
  const newPass = document.getElementById('set-admin-pass').value || null;
  const payload = {
    adminPass: user.pass, 
    newAdminPass: newPass,
    userKeyword: document.getElementById('set-user-keyword').value.trim() || 'peace',
    menuOrder: tempMenuOrder,
    leaveTypes: tempLeaveTypes.filter(Boolean),
    kahLimit: document.getElementById('set-kah-limit').value,
    approvingAuthority: document.getElementById('set-appr-email').value,
    kahList: adminKAHList,
    githubRepo: document.getElementById('set-github-repo').value.trim(),
    backupFolder: document.getElementById('set-backup-folder').value.trim()
  };
  
  try {
    await apiCall('saveSettings', payload);
    alert("Settings successfully saved!");
    if(newPass) { 
      user.pass = newPass; 
      localStorage.setItem('user', JSON.stringify(user)); 
      document.getElementById('set-admin-pass').value = ''; 
    }
    applyMenuOrder(tempMenuOrder); 
  } catch (err) { 
    alert("Error: " + err.message); 
  } finally { 
    showLoader(false); 
  }
}

async function triggerCodeBackup() {
  const repo = document.getElementById('set-github-repo').value.trim();
  const folderInput = document.getElementById('set-backup-folder').value.trim();
  
  if (!repo || !folderInput) {
      alert('Please fill out the GitHub Repo and Backup Drive Folder fields, and click "Save Settings" before backing up.');
      return;
  }

  let folderId = folderInput;
  if (folderInput.includes('drive.google.com')) {
      const match = folderInput.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match) folderId = match[1];
  }

  showLoader(true);
  try {
      const repoRes = await fetch(`https://api.github.com/repos/${repo}`);
      if (!repoRes.ok) throw new Error("GitHub repository not found or not public. Ensure the format is 'owner/repo'.");
      const repoInfo = await repoRes.json();
      const defaultBranch = repoInfo.default_branch || 'main';

      const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`);
      if (!treeRes.ok) throw new Error("Failed to fetch repository file tree.");
      const treeData = await treeRes.json();
      
      const fileNodes = treeData.tree.filter(item => item.type === 'blob');
      const hierarchy = fileNodes.map(f => f.path).join('\n');
      
      // Bypassing the text-generation glitch by using new Array() instead of brackets
      let compiledFiles = new Array();
      
      for (const file of fileNodes) {
          const rawUrl = `https://raw.githubusercontent.com/${repo}/${defaultBranch}/${file.path}`;
          const fileRes = await fetch(rawUrl);
          const content = await fileRes.text();
          
          compiledFiles.push({
              url: `https://github.com/${repo}/blob/${defaultBranch}/${file.path}`,
              content: content
          });
      }

      const payload = {
          folderId: folderId,
          hierarchy: hierarchy,
          files: compiledFiles
      };

      const res = await apiCall('backupCode', payload);
      alert(`Code successfully backed up to Google Drive!\n\nDocument URL:\n${res.url}`);
      
  } catch (err) { 
      alert("Backup Error: " + err.message); 
  } finally { 
      showLoader(false); 
  }
}
