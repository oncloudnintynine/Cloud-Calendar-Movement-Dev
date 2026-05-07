// ==========================================
// Admin Settings, User Management & GitHub Backup
// ==========================================

let userToDeleteResource = null;
let userToManageResource = null;

const FIXED_TYPICAL_EVENTS =["Meeting", "Others", "Official Trip", "Overseas Leave", "Local Leave"];

function populateAdminSettingsForm(settings) {
 document.getElementById('set-kah-limit').value = settings.kahLimit;
 document.getElementById('set-appr-email').value = settings.approvingAuthority;
 document.getElementById('set-kah-subject').value = settings.kahEmailSubject || "Leave Requires Approval: KAH Limit Crossed for {Unit}";
 document.getElementById('set-kah-body').value = settings.kahEmailBody || "User {Name} applied for {EventType} but KAH limit was crossed for {Unit}.";
 
 document.getElementById('set-user-keyword').value = settings.userKeyword || 'peace';
 document.getElementById('set-github-repo').value = settings.githubRepo || '';
 document.getElementById('set-backup-folder').value = settings.backupFolder || '';
 
 document.getElementById('set-gcal-template').value = settings.gcalTemplate || '{EventType} - {Name}, {Attendees} {Time}';
 document.getElementById('set-agenda-template').value = settings.agendaTemplate || '{EventType} - {Name} ({Department})';

 const radios = document.getElementsByName('app-mode');
 radios.forEach(r => { if(r.value === appMode) r.checked = true; });

 tempMenuOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
 renderMenuOrder();

 tempTypicalEventTypes = settings.typicalEventTypes ||[];
 renderTypicalEventTypes();
 
 tempAcronyms = settings.acronyms || {};
 renderAcronyms();

 adminKAHList = settings.kahList ||[];
 customKahGroups = settings.customKahGroups ||[];
 renderKAHSelected();
 renderCustomKahGroups();
 
 // Excluded the newly separated tabs from the drag-and-drop array
 tempAdminSectionsOrder = settings.adminSectionsOrder && settings.adminSectionsOrder.length 
  ? settings.adminSectionsOrder 
  :['app-mode', 'register-user', 'manage-users', 'admin-pass', 'user-keyword', 'menu-order', 'code-backup'];
 
 const container = document.getElementById('admin-sections-container');
 if (container) {
   tempAdminSectionsOrder.forEach(id => {
     const el = container.querySelector(`[data-section="${id}"]`);
     if (el) container.appendChild(el);
   });
   
   if (window.adminSectionsSortable) window.adminSectionsSortable.destroy();
   window.adminSectionsSortable = new Sortable(container, {
     animation: 150,
     handle: '.section-handle',
     ghostClass: 'opacity-50',
     onEnd: function () {
       tempAdminSectionsOrder = Array.from(container.children).map(el => el.dataset.section);
     }
   });
 }
}

async function loadAdminSettings() {
 try {
   const settings = await apiCall('getSettings', { adminPass: user.pass });
   appMode = settings.appMode || 'combined';
   companyStructure = settings.companyStructure || {};
   populateAdminSettingsForm(settings);
   
   if(settings.allContacts) {
     companyContacts = settings.allContacts;
     fuseAllContacts = new Fuse(settings.allContacts, { keys:['name', 'dept', 'phone'], threshold: 0.3 });
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

function renderTypicalEventTypes() {
 const list = document.getElementById('typical-event-types-list');
 if(!list) return;
 list.innerHTML = tempTypicalEventTypes.map((t, i) => {
   const isFixed = FIXED_TYPICAL_EVENTS.includes(t.name);
   return `
   <div data-idx="${i}" class="flex items-center space-x-2 md:space-x-3 bg-white dark:bg-darksurface p-2 rounded-xl border dark:border-darkborder shadow-sm ${!isFixed ? 'cursor-grab' : ''}">
     <svg class="w-5 h-5 text-gray-400 dark:text-darkmuted shrink-0 ${!isFixed ? 'handle-event-type cursor-grab' : 'opacity-0'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
     <input type="text" value="${t.name}" onchange="updateTypicalEventType(${i}, 'name', this.value)" class="flex-grow min-w-[80px] border-2 border-gray-200 dark:border-gray-600 rounded-lg py-1.5 px-2 md:px-3 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition text-sm" ${isFixed ? 'disabled' : ''}>
     <select onchange="updateTypicalEventType(${i}, 'isEvent', this.value === 'true')" class="border-2 border-gray-200 dark:border-gray-600 rounded-lg py-1.5 px-1 md:px-2 bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white outline-none text-xs md:text-sm cursor-pointer shrink-0">
        <option value="true" ${t.isEvent ? 'selected' : ''}>Time-Bound</option>
        <option value="false" ${!t.isEvent ? 'selected' : ''}>All-Day / Half-Day</option>
     </select>
     ${!isFixed ? `<button type="button" onclick="removeTypicalEventType(${i})" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition" title="Remove"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>` : `<div class="w-8 shrink-0"></div>`}
   </div>
 `}).join('');
 
 if(window.eventTypeSortable) window.eventTypeSortable.destroy();
 window.eventTypeSortable = new Sortable(list, { 
   animation: 150, 
   handle: '.handle-event-type', 
   ghostClass: 'opacity-50', 
   onEnd: function () { 
     const newArr =[];
     Array.from(list.children).forEach(el => {
       newArr.push(tempTypicalEventTypes[parseInt(el.dataset.idx)]);
     });
     tempTypicalEventTypes = newArr;
     renderTypicalEventTypes();
   } 
 });
}

function addTypicalEventType() {
 const nameInput = document.getElementById('new-typical-event-type');
 const isEventInput = document.getElementById('new-typical-event-isEvent');
 if(nameInput && nameInput.value.trim()) { 
   tempTypicalEventTypes.push({ name: nameInput.value.trim(), isEvent: isEventInput.value === 'true' }); 
   nameInput.value = ''; 
   renderTypicalEventTypes(); 
 }
}

function removeTypicalEventType(idx) { 
 const item = tempTypicalEventTypes[idx];
 if (FIXED_TYPICAL_EVENTS.includes(item.name)) return;
 tempTypicalEventTypes.splice(idx, 1); 
 renderTypicalEventTypes(); 
}

function updateTypicalEventType(idx, field, val) {
 if (field === 'name' && FIXED_TYPICAL_EVENTS.includes(tempTypicalEventTypes[idx].name)) return;
 tempTypicalEventTypes[idx][field] = val;
}

function renderAcronyms() {
 const list = document.getElementById('acronyms-list');
 if(!list) return;
 let html = '';
 for (let key in tempAcronyms) {
   html += `
   <div class="flex items-center space-x-2 bg-white dark:bg-darksurface p-2 rounded-lg border dark:border-darkborder shadow-sm mb-1.5">
     <span class="font-bold w-1/3 text-sm text-yellow-700 dark:text-yellow-500 truncate">${key}</span>
     <span class="text-gray-400 dark:text-darkmuted w-6 text-center shrink-0">➔</span>
     <span class="flex-grow text-sm text-gray-800 dark:text-gray-200 truncate">${tempAcronyms[key]}</span>
     <button type="button" onclick="removeAcronym('${key}')" class="text-red-500 hover:text-red-700 text-lg leading-none p-1 shrink-0">&times;</button>
   </div>`;
 }
 list.innerHTML = html || '<p class="text-xs text-gray-500 dark:text-darkmuted italic py-2 text-center">No acronyms added yet.</p>';
}

function addAcronym() {
 const keyInput = document.getElementById('new-acronym-key');
 const valInput = document.getElementById('new-acronym-val');
 const key = keyInput.value.trim().toUpperCase();
 const val = valInput.value.trim();
 if (key && val) {
   tempAcronyms[key] = val;
   keyInput.value = '';
   valInput.value = '';
   renderAcronyms();
 }
}

function removeAcronym(key) {
 delete tempAcronyms[key];
 renderAcronyms();
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
   list.innerHTML = `<p class="text-gray-500 dark:text-darkmuted text-sm text-center italic py-2">No unit KAH personnel added yet.</p>`;
   return;
 }

 const grouped = {};
 adminKAHList.forEach(k => {
   const d = k.dept.toUpperCase();
   let parent = d;
   let child = null;
   if (d.includes('-')) {
       const parts = d.split('-');
       parent = parts[0];
       child = parts.slice(1).join('-');
   }
   
   if (!grouped[parent]) grouped[parent] = {};
   if (child) {
       if (!grouped[parent][child]) grouped[parent][child] =[];
       grouped[parent][child].push(k);
   } else {
       if (!grouped[parent]['_direct']) grouped[parent]['_direct'] =[];
       grouped[parent]['_direct'].push(k);
   }
 });

 let html = '';
 for (const parent in grouped) {
   html += `<div class="mb-4"><h4 class="font-bold text-lg text-gray-800 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600 pb-1 mb-2">${parent}</h4>`;
   
   if (grouped[parent]['_direct']) {
       html += `<div class="space-y-1">`;
       grouped[parent]['_direct'].forEach(k => {
           html += `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border dark:border-darkborder shadow-sm pl-4"><span class="font-medium">${k.name} <span class="text-xs text-gray-500 ml-1">(${k.dept})</span></span><button onclick="removeKAH('${k.phone}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg font-bold px-3 transition">&times;</button></div>`;
       });
       html += `</div>`;
   }

   for (const child in grouped[parent]) {
     if (child !== '_direct') {
       html += `<h5 class="font-semibold text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1 pl-2 border-l-2 border-blue-400">${child}</h5><div class="space-y-1">`;
       grouped[parent][child].forEach(k => {
           html += `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border dark:border-darkborder shadow-sm pl-4"><span class="font-medium">${k.name} <span class="text-xs text-gray-500 ml-1">(${k.dept})</span></span><button onclick="removeKAH('${k.phone}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg font-bold px-3 transition">&times;</button></div>`;
       });
       html += `</div>`;
     }
   }
   html += `</div>`;
 }
 list.innerHTML = html;
}

function renderCustomKahGroups() {
 const container = document.getElementById('custom-kah-groups-list');
 if (!container) return;
 container.innerHTML = customKahGroups.map((g, i) => `
   <div class="border border-gray-300 dark:border-darkborder rounded-xl p-3 bg-gray-50 dark:bg-darkinput shadow-sm">
     <div class="flex justify-between items-center mb-2 border-b dark:border-darkborder pb-1.5">
        <span class="font-bold text-blue-700 dark:text-blue-400 text-base">zz KAH: ${g.name}</span>
        <button onclick="removeCustomKahGroup(${i})" class="text-red-500 hover:text-red-700 text-xs font-bold transition">Delete Group</button>
     </div>
     <div class="space-y-1.5 mb-3">
        ${g.members.map(phone => {
           const contact = companyContacts.find(c => String(c.phone) === String(phone));
           const name = contact ? contact.name : phone;
           const dept = contact ? contact.dept : '';
           return `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border dark:border-darkborder shadow-sm text-sm"><span class="font-medium truncate">${name} <span class="text-xs text-gray-500 font-normal ml-1">(${dept})</span></span> <button onclick="removeKahGroupMember(${i}, '${phone}')" class="text-red-500 font-bold px-2">&times;</button></div>`;
        }).join('')}
        ${g.members.length === 0 ? '<p class="text-xs text-gray-500 dark:text-darkmuted italic text-center py-1">No members added yet.</p>' : ''}
     </div>
     <div class="relative">
        <input type="text" id="kah-group-search-${i}" placeholder="Add personnel to group..." class="w-full text-sm py-1.5 px-3 border border-gray-400 dark:border-gray-500 rounded-lg outline-none shadow-sm focus:border-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white transition" autocomplete="off" onkeyup="searchKahGroupMember(${i})">
        <div id="kah-group-results-${i}" class="absolute z-40 w-full bg-white dark:bg-darksurface border-x border-b border-gray-300 dark:border-darkborder rounded-b-lg shadow-xl max-h-32 overflow-y-auto hidden-view"></div>
     </div>
   </div>
 `).join('');
}

function addCustomKahGroup() {
 const input = document.getElementById('new-kah-group-name');
 const name = input.value.trim();
 if (name) {
   if (customKahGroups.some(g => g.name.toLowerCase() === name.toLowerCase())) return alert("Group name already exists.");
   customKahGroups.push({ name: name, members:[] });
   input.value = '';
   renderCustomKahGroups();
 }
}

function removeCustomKahGroup(idx) {
 if (confirm("Are you sure you want to delete this custom group?")) {
   customKahGroups.splice(idx, 1);
   renderCustomKahGroups();
 }
}

function searchKahGroupMember(idx) {
 const q = document.getElementById(`kah-group-search-${idx}`).value;
 const resC = document.getElementById(`kah-group-results-${idx}`);
 if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
 
 const results = fuseAllContacts.search(q).slice(0, 4).map(r => r.item);
 if(results.length > 0) {
   resC.innerHTML = results.map(c => `<div class="p-2 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover text-sm" onclick="addKahGroupMember(${idx}, '${c.phone}')"><span class="font-semibold">${c.name}</span> <span class="text-xs text-gray-500 ml-1">(${c.dept})</span></div>`).join('');
   resC.classList.remove('hidden-view');
 } else {
   resC.innerHTML = `<div class="p-2 text-gray-500 text-sm">No match found</div>`; resC.classList.remove('hidden-view');
 }
}

function addKahGroupMember(idx, phone) {
 if (!customKahGroups[idx].members.includes(String(phone))) {
   customKahGroups[idx].members.push(String(phone));
   renderCustomKahGroups();
 }
}

function removeKahGroupMember(idx, phone) {
 customKahGroups[idx].members = customKahGroups[idx].members.filter(p => String(p) !== String(phone));
 renderCustomKahGroups();
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
 
 const primaryDept = dept ? dept.split(',')[0].trim().toUpperCase() : '';
 document.getElementById('edit-user-unit').value = primaryDept;
 
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
 document.getElementById('admin-manage-search').classList.add('hidden-view');
 document.getElementById('admin-manage-results').classList.add('hidden-view');
}

function cancelManageUser() {
 userToManageResource = null;
 document.getElementById('user-to-manage-container').classList.add('hidden-view');
 document.getElementById('admin-manage-search').classList.remove('hidden-view');
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

// ==========================================
// Save Functions for Admin Sections
// ==========================================

async function saveAdminSettings() {
 showLoader(true);
 const newPass = document.getElementById('set-admin-pass').value || null;
 let selectedMode = 'combined';
 document.getElementsByName('app-mode').forEach(r => { if(r.checked) selectedMode = r.value; });

 const payload = {
   adminPass: user.pass, newAdminPass: newPass, appMode: selectedMode,
   userKeyword: document.getElementById('set-user-keyword').value.trim() || 'peace',
   menuOrder: tempMenuOrder,
   adminSectionsOrder: tempAdminSectionsOrder,
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

async function saveEventTemplates() {
 showLoader(true);
 const payload = {
   adminPass: user.pass,
   typicalEventTypes: tempTypicalEventTypes,
   gcalTemplate: document.getElementById('set-gcal-template').value.trim(),
   agendaTemplate: document.getElementById('set-agenda-template').value.trim()
 };
 try {
   await apiCall('saveSettings', payload);
   alert("Event Types & Templates successfully saved! App will reload to apply changes.");
   window.location.reload();
 } catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function saveAcronyms() {
 showLoader(true);
 const payload = {
   adminPass: user.pass,
   acronyms: tempAcronyms
 };
 try {
   await apiCall('saveSettings', payload);
   alert("Acronyms successfully saved! App will reload to apply changes.");
   window.location.reload();
 } catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function saveKahSettings() {
 showLoader(true);
 const payload = {
   adminPass: user.pass,
   kahLimit: document.getElementById('set-kah-limit').value,
   approvingAuthority: document.getElementById('set-appr-email').value,
   kahList: adminKAHList,
   customKahGroups: customKahGroups,
   kahEmailSubject: document.getElementById('set-kah-subject').value.trim(),
   kahEmailBody: document.getElementById('set-kah-body').value.trim()
 };
 
 try {
   await apiCall('saveSettings', payload);
   alert("KAH Settings successfully saved! App will reload to apply changes.");
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
