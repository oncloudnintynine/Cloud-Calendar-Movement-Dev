// ==========================================
// Company Structure & Kanban Drag/Drop Logic
// ==========================================

let kanbanSortables =[];

function getEffectiveDept(contact) {
  if (pendingStructureChanges[contact.resourceName] !== undefined) {
      return pendingStructureChanges[contact.resourceName];
  }
  return contact.dept ? contact.dept.split(',')[0].trim().toUpperCase() : 'UNASSIGNED';
}

function renderStructureUI() {
  const leftContainer = document.getElementById('structure-builder-list');
  const rightContainer = document.getElementById('unassigned-board');
  
  kanbanSortables.forEach(s => s.destroy());
  kanbanSortables =[];
  
  // Initialize buckets based on full flat array of paths
  const cols = { "UNASSIGNED":[] };
  companyStructure.forEach(path => { cols[path] =[]; });
  
  // Assign users
  companyContacts.forEach(contact => {
      const d = getEffectiveDept(contact);
      if (cols[d]) {
          cols[d].push(contact);
      } else {
          cols["UNASSIGNED"].push(contact);
      }
  });

  // Build Hierarchy Tree Object for UI display
  let tree = {};
  companyStructure.forEach(path => {
      const parts = path.split('-');
      let curr = tree;
      parts.forEach((p, i) => {
          if (!curr[p]) curr[p] = { _fullPath: parts.slice(0, i+1).join('-') };
          curr = curr[p];
      });
  });

  // Recursive Renderer for Left Panel
  function buildTreeHtml(node, depth) {
      let html = '';
      const keys = Object.keys(node).filter(k => k !== '_fullPath').sort();
      
      keys.forEach(k => {
          const fullPath = node[k]._fullPath;
          const isRoot = depth === 0;
          
          if (isRoot) {
              html += `
              <div class="bg-white dark:bg-darksurface rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 mb-5 overflow-hidden">
                <div class="bg-gray-200 dark:bg-gray-800 p-2 flex justify-between items-center font-bold">
                  <span class="text-blue-700 dark:text-blue-300 text-lg">${k}</span>
                  <button onclick="removeUnit('${fullPath}')" class="text-red-500 hover:text-red-700 text-xl leading-none">&times;</button>
                </div>
                <div class="p-3">
                  <div class="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Directly in ${k}:</div>
                  <div data-unit="${fullPath}" class="kanban-col min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2 mb-4">
                      ${renderCards(cols[fullPath], true)}
                  </div>
                  <div class="ml-2 pl-4 border-l-2 border-blue-200 dark:border-blue-900 space-y-4">
                      ${buildTreeHtml(node[k], depth + 1)}
                      <div class="flex space-x-2 mt-2 pt-2">
                          <input type="text" id="new-child-${fullPath}" placeholder="Add Child Unit..." class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 text-sm bg-white dark:bg-black text-gray-900 dark:text-white uppercase outline-none focus:border-blue-500 transition">
                          <button onclick="addChildUnit('${fullPath}')" class="bg-blue-600 text-white text-xs font-bold px-3 rounded-lg hover:bg-blue-700 transition">Add</button>
                      </div>
                  </div>
                </div>
              </div>`;
          } else {
              html += `
              <div>
                  <div class="flex justify-between items-center text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      <span>↳ ${k}</span>
                      <button onclick="removeUnit('${fullPath}')" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                  </div>
                  <div data-unit="${fullPath}" class="kanban-col min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2">
                      ${renderCards(cols[fullPath], true)}
                  </div>
                  <div class="ml-2 pl-4 border-l-2 border-purple-200 dark:border-purple-900 mt-3 space-y-4">
                      ${buildTreeHtml(node[k], depth + 1)}
                      <div class="flex space-x-2 mt-2 pt-2">
                          <input type="text" id="new-child-${fullPath}" placeholder="Add Sub-Unit..." class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1 text-xs bg-white dark:bg-black text-gray-900 dark:text-white uppercase outline-none focus:border-blue-500 transition">
                          <button onclick="addChildUnit('${fullPath}')" class="bg-blue-600 text-white text-xs font-bold px-2 rounded-lg hover:bg-blue-700 transition">Add</button>
                      </div>
                  </div>
              </div>`;
          }
      });
      return html;
  }
  
  leftContainer.innerHTML = companyStructure.length === 0 
    ? `<p class="text-gray-500 italic text-sm">No parent units created yet. Add one above.</p>` 
    : buildTreeHtml(tree, 0);

  // Build Right Column (Unassigned Personnel)
  rightContainer.innerHTML = `
      <div data-unit="UNASSIGNED" class="kanban-col min-h-[200px] h-full pb-10 space-y-2 bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded-xl border-2 border-dashed border-red-300 dark:border-red-900/50">
          ${renderCards(cols["UNASSIGNED"], false)}
      </div>
  `;

  // Attach SortableJS with Mobile Drag Handles
  document.querySelectorAll('.kanban-col').forEach(el => {
      kanbanSortables.push(new Sortable(el, {
          group: 'kanban',
          animation: 150,
          ghostClass: 'opacity-50',
          handle: '.drag-handle', // Forces use of the icon to drag, fixes mobile entirely
          onEnd: function (evt) {
              const itemEl = evt.item;
              const toCol = evt.to.dataset.unit;
              const resName = itemEl.dataset.resourcename;
              pendingStructureChanges[resName] = toCol;
              renderStructureUI();
          }
      }));
  });
}

function renderCards(contacts, showCross) {
  if (!contacts) return '';
  return contacts.map(c => `
      <div data-resourcename="${c.resourceName}" class="relative bg-white dark:bg-darkinput p-3 rounded-lg shadow-sm border border-gray-200 dark:border-darkborder text-sm flex items-center group transition-colors hover:border-blue-300 dark:hover:border-blue-700">
        <div class="drag-handle cursor-grab active:cursor-grabbing px-2 mr-2 text-gray-400 hover:text-gray-600 text-lg">☰</div>
        <div class="flex flex-col flex-grow pointer-events-none select-none">
            <span class="font-bold text-gray-800 dark:text-gray-100">${c.name}</span>
            <span class="text-xs text-gray-500 dark:text-darkmuted mt-0.5">${c.phone}</span>
        </div>
        ${showCross ? `
        <button onclick="unassignUser('${c.resourceName}')" class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold shadow-md transition z-10">&times;</button>
        ` : ''}
      </div>
  `).join('');
}

function unassignUser(resName) {
  pendingStructureChanges[resName] = "UNASSIGNED";
  renderStructureUI();
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

function removeUnit(fullPath) {
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