// ==========================================
// Admin Settings, User Management & GitHub Backup
// ==========================================

// ... (keep loadAdminSettings, renderMenuOrder, renderLeaveTypes, addLeaveType, removeLeaveType, updateLeaveType, searchKAH, addKAH, removeKAH unchanged from previous) ...

function renderKAHSelected() {
  const list = document.getElementById('kah-selected-list');
  if(!list) return;
  if (adminKAHList.length === 0) {
    list.innerHTML = `<p class="text-gray-500 dark:text-darkmuted text-sm text-center italic py-2">No KAH personnel added yet.</p>`;
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
        if (!grouped[parent][child]) grouped[parent][child] = [];
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

// ... (keep the rest of admin.js manage users and code backup identical) ...