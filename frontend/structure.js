// ==========================================
// Company Structure & Kanban Drag/Drop Logic
// ==========================================

let kanbanSortables =[];

function renderStructureBuilder() {
  const container = document.getElementById('structure-builder-list');
  let html = '';
  
  Object.keys(companyStructure).forEach(parent => {
    html += `
      <div class="bg-white dark:bg-darksurface rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 mb-3 overflow-hidden">
        <div class="bg-gray-200 dark:bg-gray-800 p-2 flex justify-between items-center font-bold">
          <span class="text-blue-700 dark:text-blue-300">${parent}</span>
          <button onclick="removeUnit('${parent}', true)" class="text-red-500 hover:text-red-700 text-lg leading-none" title="Delete Parent">&times;</button>
        </div>
        <div class="p-2 space-y-2">
          ${companyStructure[parent].map(child => `
            <div class="flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a] p-1.5 rounded border border-gray-200 dark:border-darkborder text-sm">
              <span>${child}</span>
              <button onclick="removeUnit('${child}', false, '${parent}')" class="text-red-500 hover:text-red-700 font-bold">&times;</button>
            </div>
          `).join('')}
          <div class="flex space-x-2 mt-2">
            <input type="text" id="new-child-${parent}" placeholder="Add Child Unit..." class="w-full border border-gray-300 dark:border-gray-600 rounded p-1 text-sm bg-white dark:bg-black text-gray-900 dark:text-white uppercase">
            <button onclick="addChildUnit('${parent}')" class="bg-blue-600 text-white text-xs font-bold px-2 rounded hover:bg-blue-700">Add</button>
          </div>
        </div>
      </div>
    `;
  });
  
  if (Object.keys(companyStructure).length === 0) {
    html = `<p class="text-gray-500 italic text-sm">No parent units created yet. Add one above.</p>`;
  }
  
  container.innerHTML = html;
}

function addParentUnit() {
  const input = document.getElementById('new-parent-unit');
  const val = input.value.trim().toUpperCase();
  if (!val) return;
  if (companyStructure[val]) return alert("Parent unit already exists.");
  
  companyStructure[val] =[];
  input.value = '';
  renderStructureBuilder();
  renderKanbanBoard();
}

function addChildUnit(parent) {
  const input = document.getElementById(`new-child-${parent}`);
  const val = input.value.trim().toUpperCase();
  if (!val) return;
  
  // Ensure child doesn't exist anywhere
  let exists = false;
  Object.values(companyStructure).forEach(children => {
    if (children.includes(val)) exists = true;
  });
  
  if (exists) return alert("Child unit already exists.");
  
  companyStructure[parent].push(val);
  renderStructureBuilder();
  renderKanbanBoard();
}

function removeUnit(unit, isParent, parentName) {
  if (!confirm(`Are you sure you want to delete ${unit}? Personnel inside will be marked as Unassigned.`)) return;
  
  if (isParent) {
    delete companyStructure[unit];
  } else {
    companyStructure[parentName] = companyStructure[parentName].filter(c => c !== unit);
  }
  renderStructureBuilder();
  renderKanbanBoard();
}

function renderKanbanBoard() {
  const board = document.getElementById('kanban-board');
  
  // Clear old sortables
  kanbanSortables.forEach(s => s.destroy());
  kanbanSortables =[];
  pendingStructureChanges = {}; 
  
  // Map users to their expected columns
  const cols = { "UNASSIGNED":[] };
  
  // Initialize columns from structure
  Object.keys(companyStructure).forEach(p => {
    cols[p] = [];
    companyStructure[p].forEach(c => cols[c] =[]);
  });
  
  // Place contacts in columns
  companyContacts.forEach(contact => {
    const d = contact.dept.toUpperCase();
    if (cols[d]) {
      cols[d].push(contact);
    } else {
      cols["UNASSIGNED"].push(contact);
    }
  });
  
  // Render HTML
  let html = '';
  Object.keys(cols).forEach(colName => {
    const isUnassigned = colName === "UNASSIGNED";
    html += `
      <div class="bg-gray-200 dark:bg-[#1a1a1a] rounded-xl flex flex-col w-64 shrink-0 max-h-full border ${isUnassigned ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}">
        <div class="p-3 font-bold border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-darksurface rounded-t-xl sticky top-0 shadow-sm ${isUnassigned ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}">
          ${colName} <span class="text-xs font-normal text-gray-500 ml-1">(${cols[colName].length})</span>
        </div>
        <div id="kanban-${colName}" data-unit="${colName}" class="p-2 flex-grow overflow-y-auto space-y-2 min-h-[100px] kanban-col">
          ${cols[colName].map(c => `
            <div data-resourcename="${c.resourceName}" class="bg-white dark:bg-darkinput p-2 rounded shadow-sm border border-gray-200 dark:border-darkborder cursor-grab active:cursor-grabbing text-sm flex flex-col">
              <span class="font-bold text-gray-800 dark:text-gray-100">${c.name}</span>
              <span class="text-xs text-gray-500">${c.phone}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  board.innerHTML = html;
  
  // Attach Sortable
  document.querySelectorAll('.kanban-col').forEach(el => {
    kanbanSortables.push(new Sortable(el, {
      group: 'kanban',
      animation: 150,
      ghostClass: 'opacity-50',
      onEnd: function (evt) {
        const itemEl = evt.item;
        const toCol = evt.to.dataset.unit;
        const resName = itemEl.dataset.resourcename;
        
        // Track the change
        pendingStructureChanges[resName] = toCol;
      }
    }));
  });
}

async function saveCompanyStructure() {
  showLoader(true);
  try {
    // 1. Save the structure configuration
    await apiCall('saveSettings', { 
      adminPass: user.pass, 
      companyStructure: companyStructure 
    });
    
    // 2. If there are pending user moves, send them to the backend
    if (Object.keys(pendingStructureChanges).length > 0) {
      await apiCall('updateUserUnits', {
        adminPass: user.pass,
        changes: pendingStructureChanges
      });
      alert("Hierarchy and Personnel assignments successfully updated!");
    } else {
      alert("Hierarchy successfully updated!");
    }
    
    // Hard refresh to reload data properly into arrays
    window.location.reload();
  } catch (err) {
    alert("Error saving: " + err.message);
    showLoader(false);
  }
}
