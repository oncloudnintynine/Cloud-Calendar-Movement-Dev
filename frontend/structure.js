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
  
  const cols = { "UNASSIGNED":[] };
  Object.keys(companyStructure).forEach(p => {
      cols[p] = [];
      companyStructure[p].forEach(c => cols[`${p}-${c}`] =[]);
  });
  
  companyContacts.forEach(contact => {
      const d = getEffectiveDept(contact);
      if (cols[d]) {
          cols[d].push(contact);
      } else {
          cols["UNASSIGNED"].push(contact);
      }
  });

  let leftHtml = '';
  Object.keys(companyStructure).forEach(parent => {
      leftHtml += `
        <div class="bg-white dark:bg-darksurface rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 mb-5">
          <div class="bg-gray-200 dark:bg-gray-800 p-2 flex justify-between items-center font-bold rounded-t-xl">
            <span class="text-blue-700 dark:text-blue-300 text-lg">${parent}</span>
            <button onclick="removeUnit('${parent}', true)" class="text-red-500 hover:text-red-700 text-xl leading-none" title="Delete Parent">&times;</button>
          </div>
          
          <div class="p-3">
              <div class="text-xs font-semibold text-gray-500 dark:text-darkmuted mb-1.5 uppercase tracking-wide">Directly in ${parent}:</div>
              <div data-unit="${parent}" class="kanban-col min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2 mb-4">
                  ${renderCards(cols[parent], true)}
              </div>
              
              <!-- Child Units -->
              <div class="ml-2 pl-4 border-l-2 border-blue-200 dark:border-blue-900 space-y-4">
                  ${companyStructure[parent].map(child => `
                      <div>
                          <div class="flex justify-between items-center text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                              <span>↳ ${child}</span>
                              <button onclick="removeUnit('${parent}-${child}', false, '${parent}', '${child}')" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                          </div>
                          <div data-unit="${parent}-${child}" class="kanban-col min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2">
                              ${renderCards(cols[`${parent}-${child}`], true)}
                          </div>
                      </div>
                  `).join('')}
                  
                  <!-- Add Child Input -->
                  <div class="flex space-x-2 mt-2 pt-2">
                      <input type="text" id="new-child-${parent}" placeholder="Add Child Unit..." class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 text-sm bg-white dark:bg-black text-gray-900 dark:text-white uppercase outline-none focus:border-blue-500 transition">
                      <button onclick="addChildUnit('${parent}')" class="bg-blue-600 text-white text-xs font-bold px-4 rounded-lg hover:bg-blue-700 transition">Add</button>
                  </div>
              </div>
          </div>
        </div>
      `;
  });
  
  if (Object.keys(companyStructure).length === 0) {
      leftHtml = `<p class="text-gray-500 italic text-sm">No parent units created yet. Add one above.</p>`;
  }
  leftContainer.innerHTML = leftHtml;

  rightContainer.innerHTML = `
      <div data-unit="UNASSIGNED" class="kanban-col min-h-[200px] h-full pb-10 space-y-2 bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded-xl border-2 border-dashed border-red-300 dark:border-red-900/50">
          ${renderCards(cols["UNASSIGNED"], false)}
      </div>
  `;

  document.querySelectorAll('.kanban-col').forEach(el => {
      kanbanSortables.push(new Sortable(el, {
          group: 'kanban',
          animation: 150,
          ghostClass: 'opacity-50',
          delay: 150, 
          delayOnTouchOnly: true, 
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

// Added select-none to stop text selection when dragging
function renderCards(contacts, showCross) {
  if (!contacts) return '';
  return contacts.map(c => `
      <div data-resourcename="${c.resourceName}" class="relative bg-white dark:bg-darkinput p-3 rounded-lg shadow-sm border border-gray-200 dark:border-darkborder cursor-grab active:cursor-grabbing text-sm flex flex-col group transition-colors hover:border-blue-300 dark:hover:border-blue-700 select-none touch-manipulation">
        <span class="font-bold text-gray-800 dark:text-gray-100 pr-4 pointer-events-none">${c.name}</span>
        <span class="text-xs text-gray-500 dark:text-darkmuted mt-0.5 pointer-events-none">${c.phone}</span>
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
  if (companyStructure[val]) return alert("Parent unit already exists.");
  
  companyStructure[val] =[];
  input.value = '';
  renderStructureUI();
}

function addChildUnit(parent) {
  const input = document.getElementById(`new-child-${parent}`);
  const val = input.value.trim().toUpperCase();
  if (!val) return;
  
  let exists = false;
  Object.values(companyStructure).forEach(children => {
    if (children.includes(val)) exists = true;
  });
  if (exists) return alert("Child unit already exists.");
  
  companyStructure[parent].push(val);
  renderStructureUI();
}

function removeUnit(fullUnitName, isParent, parentName, childName) {
  if (!confirm(`Are you sure you want to delete ${fullUnitName}? Personnel inside will automatically be marked as Unassigned.`)) return;
  
  companyContacts.forEach(c => {
      if (getEffectiveDept(c) === fullUnitName) pendingStructureChanges[c.resourceName] = "UNASSIGNED";
  });

  if (isParent) {
    companyStructure[fullUnitName].forEach(child => {
        const childFullName = `${fullUnitName}-${child}`;
        companyContacts.forEach(c => {
            if (getEffectiveDept(c) === childFullName) pendingStructureChanges[c.resourceName] = "UNASSIGNED";
        });
    });
    delete companyStructure[fullUnitName];
  } else {
    companyStructure[parentName] = companyStructure[parentName].filter(c => c !== childName);
  }
  
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
  } catch (err) {
    alert("Error saving: " + err.message);
    showLoader(false);
  }
}