// ==========================================
// API & Network Communication (MPA Cross-Page Support)
// ==========================================

window.syncQueue = JSON.parse(localStorage.getItem('cloudy_syncQueue')) || [];
window.failedSyncRecoveryCache = JSON.parse(localStorage.getItem('cloudy_failedSync')) || {};
window.isSyncing = false;
window.isOffline = !navigator.onLine;

window.addEventListener('online', () => { window.isOffline = false; processSyncQueue(); });
window.addEventListener('offline', () => { window.isOffline = true; updateSyncPill(); });

function showLoader(show) { 
const loader = document.getElementById('loader');
if (loader) loader.style.display = show ? 'flex' : 'none'; 
}

function alertError(id, msg) {
const el = document.getElementById(id);
if(!el) return;
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

function queueSyncAction(action, payload, snapshot) {
lastLocalChange = Date.now();
window.syncQueue.push({ action, payload, id: payload.id || Date.now() });
if (snapshot && payload.id) {
window.failedSyncRecoveryCache[payload.id] = snapshot;
}
localStorage.setItem('cloudy_syncQueue', JSON.stringify(window.syncQueue));
localStorage.setItem('cloudy_failedSync', JSON.stringify(window.failedSyncRecoveryCache));
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
  const fetchStartTime = Date.now();
  const res = await apiCall(task.action, task.payload);
  
  if ((task.action === 'submitLeave' || task.action === 'editLeave' || task.action === 'cancelLeave') && res && res.status) {
      if (lastLocalChange < fetchStartTime) {
          const localRec = allLeaves.find(l => l.ID === task.payload.id);
          if (localRec) {
              localRec.Status = res.status;
              localStorage.setItem('cloudy_allLeaves', JSON.stringify(allLeaves));
              
              const page = document.body.dataset.page;
              if (page === 'index') { window.agendaDirty = true; renderDashboard(); }
              if (page === 'my-leaves') { window.myAgendaDirty = true; renderMyLeaves(); }
          }
      }
  }
  
  delete window.failedSyncRecoveryCache[task.payload.id];
  window.syncQueue.shift(); 
  localStorage.setItem('cloudy_syncQueue', JSON.stringify(window.syncQueue));
  localStorage.setItem('cloudy_failedSync', JSON.stringify(window.failedSyncRecoveryCache));
  updateSyncPill();
} catch(e) {
  console.error("Background sync failed for task", task, e);
  if (e.message.includes('Unauthorized') || e.message.includes('busy processing') || e.message.includes('fatal')) {
      if (task.action === 'submitLeave') {
          allLeaves = allLeaves.filter(l => l.ID !== task.payload.id);
      } else if (task.action === 'editLeave' || task.action === 'cancelLeave') {
          const backup = window.failedSyncRecoveryCache[task.payload.id];
          if (backup) {
              const idx = allLeaves.findIndex(l => l.ID === task.payload.id);
              if (idx !== -1) allLeaves[idx] = backup;
          }
      }
      
      delete window.failedSyncRecoveryCache[task.payload.id];
      window.syncQueue.shift(); 
      localStorage.setItem('cloudy_syncQueue', JSON.stringify(window.syncQueue));
      localStorage.setItem('cloudy_failedSync', JSON.stringify(window.failedSyncRecoveryCache));
      localStorage.setItem('cloudy_allLeaves', JSON.stringify(allLeaves));
      
      const page = document.body.dataset.page;
      if (page === 'index') { window.agendaDirty = true; renderDashboard(); }
      if (page === 'my-leaves') { window.myAgendaDirty = true; renderMyLeaves(); }
      
      alert("A background save was rejected by the server and has been reverted: " + e.message);
  } else {
      break; 
  }
}
}

window.isSyncing = false;
updateSyncPill();

if (window.syncQueue.length === 0 && !window.isOffline) {
try {
  const fetchStartTime = Date.now();
  const freshData = await apiCall('getLeaves');
  if (window.syncQueue.length === 0 && lastLocalChange < fetchStartTime) { 
      allLeaves = freshData;
      localStorage.setItem('cloudy_allLeaves', JSON.stringify(allLeaves));
      const page = document.body.dataset.page;
      if (page === 'index') { window.agendaDirty = true; renderDashboard(); }
      if (page === 'my-leaves') { window.myAgendaDirty = true; renderMyLeaves(); }
  }
} catch(e) {}
}
}

function generateLocalUUID() {
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
}

let backgroundPollTimer = null;
function startForegroundPoller() {
if (backgroundPollTimer) clearInterval(backgroundPollTimer);

backgroundPollTimer = setInterval(async () => {
if (window.isOffline || window.isSyncing || window.syncQueue.length > 0 || document.hidden) return;

try {
  const fetchStartTime = Date.now();
  const freshData = await apiCall('getLeaves');
  if (!window.isSyncing && window.syncQueue.length === 0) {
      if (lastLocalChange > fetchStartTime) return; // Prevent overwriting optimistic changes
      allLeaves = freshData;
      localStorage.setItem('cloudy_allLeaves', JSON.stringify(allLeaves));
      
      const page = document.body.dataset.page;
      if (page === 'index') {
          window.agendaDirty = true;
          renderDashboard();
      } else if (page === 'my-leaves') {
          window.myAgendaDirty = true;
          renderMyLeaves();
      } else if (page === 'parade' && typeof renderParadeState === 'function') {
          renderParadeState(); 
      }
  }
} catch(e) {}
}, 35000);
}

document.addEventListener("visibilitychange", () => {
if (document.hidden) {
if (backgroundPollTimer) clearInterval(backgroundPollTimer);
} else {
if (!window.isOffline && window.syncQueue.length === 0) {
  processSyncQueue(); 
}
startForegroundPoller();
}
});