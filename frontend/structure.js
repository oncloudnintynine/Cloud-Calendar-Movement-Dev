// ==========================================
// Company Structure & Reassignment Logic
// ==========================================

let reassignTargetResource = null;

function getEffectiveDept(contact) {
 if (pendingStructureChanges[contact.resourceName] !== undefined) {
     return pendingStructureChanges[contact.resourceName];
 }
 return contact.dept ? contact.dept.split(',')[0].trim().toUpperCase() : 'UNASSIGNED';
}

function renderStructureUI() {
 const leftContainer = document.getElementById('structure-builder-list');
 const rightContainer = document.getElementById('unassigned-board');
 
 const cols = { "UNASSIGNED":[] };
 companyStructure.forEach(path => { cols[path] =[]; });
 
 companyContacts.forEach(contact => {
     const d = getEffectiveDept(contact);
     if (cols[d]) { cols[d].push(contact); } 
     else { cols["UNASSIGNED"].push(contact); }
 });

 let tree = {};
 companyStructure.forEach(path => {
     const parts = path.split('-');
     let curr = tree;
     parts.forEach((p, i) => {
         if (!curr[p]) curr[p] = { _fullPath: parts.slice(0, i+1).join('-') };
         curr = curr[p];
     });
 });

 function buildTreeHtml(node, depth) {
     let html = '';
     
     // Sorting to ensure 'HQ' is always placed at the very top, followed alphanumerically
     const keys = Object.keys(node).filter(k => k !== '_fullPath').sort((a, b) => {
         if (a.toUpperCase() === 'HQ') return -1;
         if (b.toUpperCase() === 'HQ') return 1;
         return a.localeCompare(b);
     });
     
     keys.forEach(k => {
         const fullPath = node[k]._fullPath;
         const members = cols[fullPath] ||[];
         const isRoot = depth === 0;
         const isGrandChild = depth === 2; // Maximum 3 levels
         
         const headerColors = depth === 0 ? 'text-blue-700 dark:text-blue-400' : depth === 1 ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400';
         const bgColors = depth === 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-[#151515]';

         html += `
         <details class="group mb-3 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-darksurface shadow-sm" ${isRoot ? 'open' : ''}>
             <summary class="flex justify-between items-center p-2.5 cursor-pointer select-none ${bgColors}">
                 <div class="flex items-center space-x-2">
                     <svg class="w-4 h-4 transition-transform group-open:rotate-90 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                     <span class="font-bold text-sm md:text-base ${headerColors}">${k} <span class="text-xs font-normal text-gray-500">(${members.length})</span></span>
                 </div>
                 <button onclick="removeUnit('${fullPath}', event)" class="text-red-500 hover:text-red-700 font-bold px-3 text-lg leading-none" title="Delete Unit">&times;</button>
             </summary>
             <div class="p-2 md:p-3 border-t border-gray-200 dark:border-darkborder space-y-3">
                 
                 ${members.length > 0 
                     ? `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">${renderCards(members, true, fullPath)}</div>` 
                     : `<p class="text-xs text-gray-400 dark:text-darkmuted italic ml-1">No personnel assigned directly here.</p>`}
                 
                 <!-- Nested Sub-Units -->
                 <div class="pl-2 md:pl-4 border-l-2 ${depth===0 ? 'border-blue-200 dark:border-blue-900' : 'border-purple-200 dark:border-purple-900'} mt-2 space-y-2">
                     ${buildTreeHtml(node[k], depth + 1)}
                     
                     ${!isGrandChild ? `
                     <div class="flex space-x-2 mt-2">
                         <input type="text" id="new-child-${fullPath}" placeholder="Add Sub-Unit to ${k}..." class="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 text-xs bg-white dark:bg-black text-gray-900 dark:text-white uppercase outline-none focus:border-blue-500 transition">
                         <button onclick="addChildUnit('${fullPath}')" class="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold px-3 rounded transition">Add</button>
                     </div>` : ''}
                 </div>
             </div>
         </details>`;
     });
     return html;
 }
 
 leftContainer.innerHTML = companyStructure.length === 0 
   ? `<p class="text-gray-500 italic text-sm">No parent units created yet. Add one above.</p>` 
   : buildTreeHtml(tree, 0);

 // Unassigned Board in Grid
 rightContainer.innerHTML = `
     <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
         ${renderCards(cols["UNASSIGNED"], false, 'UNASSIGNED')}
     </div>
 `;
}

function renderCards(contacts, showCross, currentUnit) {
 if (!contacts) return '';
 return contacts.map(c => `
     <div onclick="openReassignModal('${c.resourceName}', '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${currentUnit}')" class="relative bg-white dark:bg-darkinput p-2 rounded shadow-sm border border-gray-200 dark:border-darkborder text-xs flex flex-col cursor-pointer transition-colors hover:border-blue-400 dark:hover:border-blue-600">
       <span class="font-bold text-gray-800 dark:text-gray-100 pr-4 truncate">${c.name}</span>
       <span class="text-[10px] text-gray-500 dark:text-darkmuted mt-0.5">${c.phone}</span>
       ${showCross ? `
       <button onclick="unassignUser('${c.resourceName}', event)" class="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition z-10">&times;</button>
       ` : ''}
     </div>
 `).join('');
}

function unassignUser(resName, e) {
 e.stopPropagation(); // Prevent opening the modal
 pendingStructureChanges[resName] = "UNASSIGNED";
 renderStructureUI();
}

function openReassignModal(resName, name, phone, currentUnit) {
 reassignTargetResource = resName;
 document.getElementById('reassign-user-name').innerText = `${name} (${phone})`;
 
 // Apply HQ sort rule to the modal dropdown list as well
 const sortedStructure = [...companyStructure].sort((a, b) => {
     if (a.toUpperCase() === 'HQ') return -1;
     if (b.toUpperCase() === 'HQ') return 1;
     return a.localeCompare(b);
 });
 
 const allUnits = ["UNASSIGNED", ...sortedStructure];
 let html = allUnits.map(u => `
     <button onclick="confirmReassign('${u}')" class="w-full text-left p-3 rounded-lg border mb-2 text-sm font-medium transition ${u === currentUnit ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-darkborder hover:bg-gray-50 dark:hover:bg-darkhover text-gray-700 dark:text-gray-200'}">
         ${u === 'UNASSIGNED' ? '🔴 Unassigned' : u}
     </button>
 `).join('');
 
 document.getElementById('reassign-unit-list').innerHTML = html;
 document.getElementById('reassign-modal').classList.remove('hidden-view');
 document.getElementById('reassign-modal').classList.add('flex');
}

function confirmReassign(newUnit) {
 if (reassignTargetResource) {
     pendingStructureChanges[reassignTargetResource] = newUnit;
     renderStructureUI();
 }
 closeReassignModal();
}

function closeReassignModal() {
 reassignTargetResource = null;
 document.getElementById('reassign-modal').classList.add('hidden-view');
 document.getElementById('reassign-modal').classList.remove('flex');
}

function addParentUnit() {
 const input = document.getElementById('new-parent-unit');
 const val = input.value.trim().toUpperCase();
 if (!val) return;
 if (companyStructure.includes(val)) return alert("Parent unit already exists.");
 
 companyStructure.push(val);
 input.value = '';
 renderStructureUI();
}

function addChildUnit(parentPath) {
 const input = document.getElementById(`new-child-${parentPath}`);
 const val = input.value.trim().toUpperCase();
 if (!val) return;
 
 const fullPath = `${parentPath}-${val}`;
 if (companyStructure.includes(fullPath)) return alert("Unit already exists.");
 
 companyStructure.push(fullPath);
 renderStructureUI();
}

function removeUnit(fullPath, e) {
 if (e) { e.stopPropagation(); e.preventDefault(); }
 if (!confirm(`Are you sure you want to delete ${fullPath} and all its sub-units? Personnel inside will automatically be marked as Unassigned.`)) return;
 
 const toDelete = companyStructure.filter(p => p === fullPath || p.startsWith(`${fullPath}-`));
 companyContacts.forEach(c => {
     if (toDelete.includes(getEffectiveDept(c))) {
         pendingStructureChanges[c.resourceName] = "UNASSIGNED";
     }
 });

 companyStructure = companyStructure.filter(p => !toDelete.includes(p));
 renderStructureUI();
}

async function saveCompanyStructure() {
 showLoader(true);
 const finalChanges = {};
 for (let resName in pendingStructureChanges) {
     const originalContact = companyContacts.find(c => c.resourceName === resName);
     let originalDept = "UNASSIGNED";
     if (originalContact && originalContact.dept) {
         originalDept = originalContact.dept.split(',')[0].trim().toUpperCase();
     }
     if (originalDept !== pendingStructureChanges[resName]) {
         finalChanges[resName] = pendingStructureChanges[resName];
     }
 }

 try {
   await apiCall('saveSettings', { adminPass: user.pass, companyStructure: companyStructure });
   if (Object.keys(finalChanges).length > 0) {
     await apiCall('updateUserUnits', { adminPass: user.pass, changes: finalChanges });
     alert("Hierarchy and Personnel assignments successfully updated!");
   } else {
     alert("Hierarchy successfully updated!");
   }
   window.location.reload();
 } catch (err) { alert("Error saving: " + err.message); showLoader(false); }
}
