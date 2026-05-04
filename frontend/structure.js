// ==========================================
// Company Structure & Kanban Drag/Drop Logic
// ==========================================

let kanbanSortables =[];

// Helper to determine where a user currently belongs (accounting for unsaved changes)
function getEffectiveDept(contact) {
  if (pendingStructureChanges[contact.resourceName] !== undefined) {
      return pendingStructureChanges[contact.resourceName];
  }
  return contact.dept ? contact.dept.split(',')[0].trim().toUpperCase() : 'UNASSIGNED';
}

function renderStructureUI() {
  const leftContainer = document.getElementById('structure-builder-list');
  const rightContainer = document.getElementById('unassigned-board');
  
  // Cleanup old sortable instances to prevent memory leaks
  kanbanSortables.forEach(s => s.destroy());
  kanbanSortables =[];
  
  // Initialize column buckets
  const cols = { "UNASSIGNED":[] };
  Object.keys(companyStructure).forEach(p => {
      cols[p] = [];
      companyStructure[p].forEach(c => cols[c] =[]);
  });
  
  // Map personnel into buckets based on effective state
  companyContacts.forEach(contact => {
      const d = getEffectiveDept(contact);
      if (cols[d]) {
          cols[d].push(contact);
      } else {
          cols["UNASSIGNED"].push(contact);
      }
  });

  // Build Left Column (Hierarchy + Assigned Personnel)
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
                              <button onclick="removeUnit('${child}', false, '${parent}')" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
                          </div>
                          <div data-unit="${child}" class="kanban-col min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2">
                              ${renderCards(cols[child], true)}
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

  // Build Right Column (Unassigned Personnel)
  rightContainer.innerHTML = `
      <div data-unit="UNASSIGNED" class="kanban-col min-h-[200px] h-full pb-10 space-y-2 bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded-xl border-2 border-dashed border-red-300 dark:border-red-900/50">
          ${renderCards(cols["UNASSIGNED"], false)}
      </div>
  `;

  // Attach SortableJS to all dropzones
  document.querySelectorAll('.kanban-col').forEach(el => {
      kanbanSortables.push(new Sortable(el, {
          group: 'kanban',
          animation: 150,
          ghostClass: 'opacity-50',
          delay: 150, // Requires 150ms long-press to pick up
          delayOnTouchOnly: true, // Only delays on mobile so scrolling works!
          onEnd: function (evt) {
              const itemEl = evt.item;
              const toCol = evt.to.dataset.unit;
              const resName = itemEl.dataset.resourcename;
              
              // Track the change and re-render to attach/detach the cross buttons properly
              pendingStructureChanges[resName] = toCol;
              renderStructureUI();
          }
      }));
  });
}

function renderCards(contacts, showCross) {
  return contacts.map(c => `
      <div data-resourcename="${c.resourceName}" class="relative bg-white dark:bg-darkinput p-3 rounded-lg shadow-sm border border-gray-200 dark:border-darkborder cursor-grab active:cursor-grabbing text-sm flex flex-col group transition-colors hover:border-blue-300 dark:hover:border-blue-700">
        <span class="font-bold text-gray-800 dark:text-gray-100 pr-4">${c.name}</span>
        <span class="text-xs text-gray-500 dark:text-darkmuted mt-0.5">${c.phone}</span>
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

function removeUnit(unit, isParent, parentName) {
  if (!confirm(`Are you sure you want to delete ${unit}? Personnel inside will automatically be marked as Unassigned.`)) return;
  
  // Relocate anyone in this unit to UNASSIGNED internally
  companyContacts.forEach(c => {
      if (getEffectiveDept(c) === unit) {
          pendingStructureChanges[c.resourceName] = "UNASSIGNED";
      }
  });

  if (isParent) {
    // Also unassign anyone in the children of this parent
    companyStructure[unit].forEach(childUnit => {
        companyContacts.forEach(c => {
            if (getEffectiveDept(c) === childUnit) {
                pendingStructureChanges[c.resourceName] = "UNASSIGNED";
            }
        });
    });
    delete companyStructure[unit];
  } else {
    companyStructure[parentName] = companyStructure[parentName].filter(c => c !== unit);
  }
  
  renderStructureUI();
}

async function saveCompanyStructure() {
  showLoader(true);
  
  try {
    // Compile final changes to send to backend
    const finalChanges = {};
    for (let resName in pendingStructureChanges) {
        const originalContact = companyContacts.find(c => c.resourceName === resName);
        let originalDept = "UNASSIGNED";
        if (originalContact && originalContact.dept) {
            originalDept = originalContact.dept.split(',')[0].trim().toUpperCase();
        }
        
        // Only send properties that actually moved
        if (originalDept !== pendingStructureChanges[resName]) {
            finalChanges[resName] = pendingStructureChanges[resName];
        }
    }

    // Save Hierarchy state
    await apiCall('saveSettings', { 
      adminPass: user.pass, 
      companyStructure: companyStructure 
    });
    
    // Process Personnel moves via Google Contacts API
    if (Object.keys(finalChanges).length > 0) {
      await apiCall('updateUserUnits', {
        adminPass: user.pass,
        changes: finalChanges
      });
      alert("Hierarchy and Personnel assignments successfully updated!");
    } else {
      alert("Hierarchy successfully updated!");
    }
    
    // Hard refresh to reload data properly
    window.location.reload();
  } catch (err) {
    alert("Error saving: " + err.message);
    showLoader(false);
  }
}