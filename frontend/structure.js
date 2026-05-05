// ==========================================
// Company Structure & Custom Drag/Drop Engine
// ==========================================

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
      const keys = Object.keys(node).filter(k => k !== '_fullPath').sort();
      
      keys.forEach(k => {
          const fullPath = node[k]._fullPath;
          const isRoot = depth === 0;
          const isGrandChild = depth === 2; // Support up to 3 tiers!
          
          if (isRoot) {
              html += `
              <div class="bg-white dark:bg-darksurface rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 mb-5 overflow-hidden">
                <div class="bg-gray-200 dark:bg-gray-800 p-2 flex justify-between items-center font-bold">
                  <span class="text-blue-700 dark:text-blue-300 text-lg">${k}</span>
                  <button onclick="removeUnit('${fullPath}')" class="text-red-500 hover:text-red-700 text-xl leading-none">&times;</button>
                </div>
                <div class="p-3">
                  <div class="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Directly in ${k}:</div>
                  <div class="dnd-dropzone min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2 mb-4" data-target-id="${fullPath}">
                      ${renderCards(cols[fullPath], true)}
                  </div>
                  <div class="ml-2 pl-3 border-l-2 border-blue-200 dark:border-blue-900 space-y-4">
                      ${buildTreeHtml(node[k], depth + 1)}
                      <div class="flex space-x-2 mt-2 pt-2">
                          <input type="text" id="new-child-${fullPath}" placeholder="Add Child Unit..." class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 text-xs bg-white dark:bg-black text-gray-900 dark:text-white uppercase outline-none focus:border-blue-500 transition">
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
                  <div class="dnd-dropzone min-h-[60px] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 space-y-2" data-target-id="${fullPath}">
                      ${renderCards(cols[fullPath], true)}
                  </div>
                  ${!isGrandChild ? `
                  <div class="ml-2 pl-3 border-l-2 border-purple-200 dark:border-purple-900 mt-2 space-y-3">
                      ${buildTreeHtml(node[k], depth + 1)}
                      <div class="flex space-x-2 mt-1 pt-1">
                          <input type="text" id="new-child-${fullPath}" placeholder="Add Sub-Unit..." class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1 text-[11px] bg-white dark:bg-black text-gray-900 dark:text-white uppercase outline-none focus:border-blue-500 transition">
                          <button onclick="addChildUnit('${fullPath}')" class="bg-purple-600 text-white text-[11px] font-bold px-2 rounded-lg hover:bg-purple-700 transition">Add</button>
                      </div>
                  </div>
                  ` : ''}
              </div>`;
          }
      });
      return html;
  }
  
  leftContainer.innerHTML = companyStructure.length === 0 
    ? `<p class="text-gray-500 italic text-sm">No parent units created yet. Add one above.</p>` 
    : buildTreeHtml(tree, 0);

  rightContainer.innerHTML = `
      <div class="dnd-dropzone min-h-[300px] h-full pb-10 space-y-2 bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded-xl border-2 border-dashed border-red-300 dark:border-red-900/50" data-target-id="UNASSIGNED">
          ${renderCards(cols["UNASSIGNED"], false)}
      </div>
  `;
}

function renderCards(contacts, showCross) {
  if (!contacts) return '';
  return contacts.map(c => `
      <div class="dnd-draggable relative bg-white dark:bg-darkinput p-2 rounded-lg shadow border border-gray-200 dark:border-darkborder text-sm flex items-center group transition-colors hover:border-blue-300 dark:hover:border-blue-700 select-none touch-manipulation" data-item-id="${c.resourceName}">
        <div class="drag-handle px-1 mr-2 text-gray-400 text-lg">☰</div>
        <div class="main-name-pill flex flex-col flex-grow">
            <span class="font-bold text-gray-800 dark:text-gray-100">${c.name}</span>
            <span class="text-[10px] text-gray-500 dark:text-darkmuted mt-0.5">${c.phone}</span>
        </div>
        ${showCross ? `
        <button onclick="unassignUser('${c.resourceName}')" class="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition z-10">&times;</button>
        ` : ''}
      </div>
  `).join('');
}

function unassignUser(resName) { pendingStructureChanges[resName] = "UNASSIGNED"; renderStructureUI(); }

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

// ==========================================
// Custom Robust Drag & Drop Engine
// ==========================================
if (!window.dndInitialized) {
    window.dndInitialized = true;

    let dndState = { timer: null, isDragging: false, el: null, clone: null };

    document.addEventListener('touchstart', (e) => {
        if(e.touches.length > 1) return;
        startDrag(e, e.touches[0].clientX, e.touches[0].clientY, true);
    }, {passive: false});

    document.addEventListener('touchmove', (e) => {
        if (dndState.isDragging) {
            e.preventDefault(); 
            moveDrag(e, e.touches[0].clientX, e.touches[0].clientY);
        } else if (dndState.timer) {
            clearTimeout(dndState.timer); dndState.timer = null; dndState.el = null;
        }
    }, {passive: false});

    document.addEventListener('touchend', (e) => {
        const touch = e.changedTouches ? e.changedTouches[0] : e.touches[0];
        endDrag(e, touch.clientX, touch.clientY);
    });

    document.addEventListener('touchcancel', (e) => {
        const touch = e.changedTouches ? e.changedTouches[0] : e.touches[0];
        endDrag(e, touch.clientX, touch.clientY);
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        startDrag(e, e.clientX, e.clientY, false);
    });

    document.addEventListener('mousemove', (e) => {
        if (dndState.isDragging) { e.preventDefault(); moveDrag(e, e.clientX, e.clientY); }
    });

    document.addEventListener('mouseup', (e) => { endDrag(e, e.clientX, e.clientY); });

    function startDrag(e, clientX, clientY, isTouch) {
        if(e.target.closest('button')) return;
        let draggable = e.target.closest('.dnd-draggable');
        if(!draggable) return;

        dndState.el = draggable;
        const nodeToClone = dndState.el;
        const rect = nodeToClone.getBoundingClientRect();

        const delay = isTouch ? 150 : 0; // Allows normal scrolling on touch

        dndState.timer = setTimeout(() => {
            dndState.isDragging = true;
            if(isTouch && navigator.vibrate) navigator.vibrate(50);

            dndState.el.classList.add('locked-for-drag');
            dndState.clone = nodeToClone.cloneNode(true);
            dndState.clone.classList.add('dragging-clone');
            dndState.clone.style.width = rect.width + 'px';
            dndState.clone.style.height = rect.height + 'px';

            document.body.appendChild(dndState.clone);
            updateClonePosition(clientX, clientY, rect.width, rect.height);
        }, delay);
    }

    function moveDrag(e, clientX, clientY) {
        if (!dndState.isDragging || !dndState.clone) return;
        const w = parseFloat(dndState.clone.style.width);
        const h = parseFloat(dndState.clone.style.height);
        updateClonePosition(clientX, clientY, w, h);

        const elAtPoint = document.elementFromPoint(clientX, clientY);
        const activeDz = elAtPoint ? elAtPoint.closest('.dnd-dropzone') : null;

        document.querySelectorAll('.dnd-dropzone').forEach(dz => {
            if (dz === activeDz) dz.classList.add('drag-over-highlight');
            else dz.classList.remove('drag-over-highlight');
        });
    }

    function endDrag(e, clientX, clientY) {
        if(dndState.timer) { clearTimeout(dndState.timer); dndState.timer = null; }
        if(dndState.el) dndState.el.classList.remove('locked-for-drag');

        if (dndState.isDragging && dndState.clone) {
            dndState.clone.remove();
            dndState.clone = null;
            dndState.isDragging = false;

            document.querySelectorAll('.dnd-dropzone').forEach(dz => dz.classList.remove('drag-over-highlight'));

            const elAtPoint = document.elementFromPoint(clientX, clientY);
            const dropZone = elAtPoint ? elAtPoint.closest('.dnd-dropzone') : null;

            if(dropZone && dndState.el) {
                const sourceId = dndState.el.dataset.itemId;
                const targetId = dropZone.dataset.targetId;
                
                // EXECUTE CUSTOM APP LOGIC
                pendingStructureChanges[sourceId] = targetId;
                renderStructureUI();
            }
        }
        dndState.el = null;
    }

    function updateClonePosition(x, y, w, h) {
        if(dndState.clone) {
            dndState.clone.style.left = (x - (w / 2)) + 'px';
            dndState.clone.style.top = (y - (h / 2)) + 'px';
        }
    }
}
