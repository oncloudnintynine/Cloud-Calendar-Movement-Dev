// ==========================================
// API & Network Communication
// ==========================================

window.syncQueue = [];
window.isSyncing = false;
window.isOffline = !navigator.onLine;

window.addEventListener('online', () => { window.isOffline = false; processSyncQueue(); });
window.addEventListener('offline', () => { window.isOffline = true; updateSyncPill(); });

function showLoader(show) { 
document.getElementById('loader').style.display = show ? 'flex' : 'none'; 
}

function alertError(id, msg) {
const el = document.getElementById(id);
el.innerText = msg; 
el.classList.remove('hidden');
setTimeout(() => el.classList.add('hidden'), 5000);
}

async function apiCall(action, data = {}) {
try {
let credentials = {};
if (user && user.pass) {
    credentials = { phone: user.phone || '', pass: user.pass };
}

const response = await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  redirect: 'follow',
  body: JSON.stringify({ action, data, credentials })
});

const result = await response.json();

if (!result.success) {
    throw new Error(result.error);
}

return result.data;
} catch (err) {
if(err.message.includes('Failed to fetch')) {
  alert("Network Error or Google Permissions Expired.\nIf you are the Administrator, please open the script editor and run INITIAL_SETUP().");
}
throw err;
}
}

// --- OPTIMISTIC UI BACKGROUND SYNC ---

function queueSyncAction(action, payload) {
window.syncQueue.push({ action, payload, id: payload.id || Date.now() });
processSyncQueue();
}

function updateSyncPill() {
let pill = document.getElementById('sync-pill');
if (!pill) {
pill = document.createElement('div');
pill.id = 'sync-pill';
pill.className = 'fixed bottom-[30px] left-1/2 transform -translate-x-1/2 z-[90] rounded-full shadow-lg text-xs font-bold px-4 py-2 transition-all duration-300 pointer-events-none opacity-0 translate-y-10 flex items-center space-x-2';
document.body.appendChild(pill);
}

if (window.isOffline && window.syncQueue.length > 0) {
pill.className = 'fixed bottom-[30px] left-1/2 transform -translate-x-1/2 z-[90] rounded-full shadow-lg text-xs font-bold px-4 py-2 transition-all duration-300 pointer-events-none flex items-center space-x-2 bg-red-600 text-white opacity-100 translate-y-0';
pill.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span>Offline - Sync paused</span>`;
return;
}

if (window.syncQueue.length > 0) {
pill.className = 'fixed bottom-[30px] left-1/2 transform -translate-x-1/2 z-[90] rounded-full shadow-lg text-xs font-bold px-4 py-2 transition-all duration-300 pointer-events-none flex items-center space-x-2 bg-blue-600 text-white opacity-100 translate-y-0';
pill.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg><span>Syncing ${window.syncQueue.length} item${window.syncQueue.length > 1 ? 's' : ''}...</span>`;
} else if (window.isSyncing) {
// Just finished
pill.className = 'fixed bottom-[30px] left-1/2 transform -translate-x-1/2 z-[90] rounded-full shadow-lg text-xs font-bold px-4 py-2 transition-all duration-300 pointer-events-none flex items-center space-x-2 bg-emerald-600 text-white opacity-100 translate-y-0';
pill.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>Up to date</span>`;
setTimeout(() => {
    if (window.syncQueue.length === 0) {
        pill.classList.remove('opacity-100', 'translate-y-0');
        pill.classList.add('opacity-0', 'translate-y-10');
    }
}, 3000);
}
}

async function processSyncQueue() {
if (window.isSyncing || window.isOffline || window.syncQueue.length === 0) {
updateSyncPill();
return;
}

window.isSyncing = true;
updateSyncPill();

while (window.syncQueue.length > 0 && !window.isOffline) {
const task = window.syncQueue[0];
try {
    const res = await apiCall(task.action, task.payload);
    
    // Update local ID if it was a new creation to prevent future edit issues locally
    if (task.action === 'submitLeave' && res && res.status) {
        const localRec = allLeaves.find(l => l.ID === task.payload.id);
        if (localRec) localRec.Status = res.status;
    }
    window.syncQueue.shift(); 
    updateSyncPill();
} catch(e) {
    console.error("Background sync failed for task", task, e);
    // If it's a fatal hard error from the server (e.g., KAH rules strictly blocked it)
    if (e.message.includes('Unauthorized') || e.message.includes('fatal')) {
        window.syncQueue.shift(); 
        alert("A background save was rejected by the server: " + e.message);
    } else {
        break; // Network issue, break and retry later
    }
}
}

window.isSyncing = false;
updateSyncPill();

// Clean background master state fetch to auto-heal and catch concurrent multi-user edits
if (window.syncQueue.length === 0 && !window.isOffline) {
try {
    const freshData = await apiCall('getLeaves');
    if (window.syncQueue.length === 0) { 
        allLeaves = freshData;
        window.agendaDirty = true;
        window.myAgendaDirty = true;
        renderDashboard();
        renderMyLeaves();
    }
} catch(e) {}
}
}

// Generate UUID matching Google Apps Script format
function generateLocalUUID() {
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
}