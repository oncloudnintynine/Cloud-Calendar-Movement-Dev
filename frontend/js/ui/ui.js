// ==========================================
// UI, Navigation, & Formatter Logic
// ==========================================

function toggleMenu() {
const menu = document.getElementById('slide-menu');
const panel = document.getElementById('slide-menu-panel');
if (menu.classList.contains('hidden-view')) {
menu.classList.remove('hidden-view');
setTimeout(() => { panel.classList.remove('-translate-x-full'); }, 10);
} else closeMenu();
}

function closeMenu() {
const menu = document.getElementById('slide-menu');
const panel = document.getElementById('slide-menu-panel');
panel.classList.add('-translate-x-full');
setTimeout(() => { menu.classList.add('hidden-view'); }, 300); 
}

function applyMenuOrder(orderArr) {
const menuContainer = document.getElementById('slide-menu-items');
const btnCombined = document.getElementById('unified-btn-combined');
const btnLeave = document.getElementById('unified-btn-leave');
const btnEvent = document.getElementById('unified-btn-event');

if(menuContainer) {
orderArr.forEach(id => {
const btn = document.getElementById(`menu-${id}`);
if (btn) {
  if (appMode === 'combined' && ['submit-leave', 'submit-event', 'my-leaves'].includes(id)) {
    btn.classList.add('hidden');
  } else if (appMode === 'separated' && id === 'submit-combined') {
    btn.classList.add('hidden');
  } else {
    btn.classList.remove('hidden');
    menuContainer.appendChild(btn);
  }
}
});
}

if (appMode === 'combined') {
if(btnCombined) btnCombined.classList.remove('hidden');
if(btnLeave) btnLeave.classList.add('hidden');
if(btnEvent) btnEvent.classList.add('hidden');
} else {
if(btnCombined) btnCombined.classList.add('hidden');
if(btnLeave) btnLeave.classList.remove('hidden');
if(btnEvent) btnEvent.classList.remove('hidden');
}
}

function switchTab(tabId) {
closeMenu();
document.querySelectorAll('.tab-content').forEach(el => { el.classList.add('hidden-view'); el.classList.remove('flex'); });

const view = document.getElementById(`view-${tabId}`);
if (view) { view.classList.remove('hidden-view'); view.classList.add('flex'); }

document.querySelectorAll('#slide-menu-panel button[id^="menu-"]').forEach(btn => {
btn.classList.remove('bg-blue-50', 'text-blue-600', 'dark:bg-darkhover', 'dark:text-blue-400');
});

const activeMenu = document.getElementById(`menu-${tabId}`);
if (activeMenu && activeMenu.tagName === 'BUTTON') activeMenu.classList.add('bg-blue-50', 'text-blue-600', 'dark:bg-darkhover', 'dark:text-blue-400');

const titleEl = document.getElementById('active-tab-title');
if (titleEl) {
if (currentEditId && tabId.startsWith('submit-')) titleEl.innerText = "Update Record";
else titleEl.innerText = TAB_NAMES[tabId] || '';
}

const deptNav = document.getElementById('dash-dept-nav');
const controlsWrapper = document.getElementById('dash-controls-wrapper');

if (controlsWrapper) {
if (tabId === 'dashboard' || tabId === 'my-leaves') {
  if (tabId === 'dashboard') {
      if (deptNav) deptNav.classList.remove('hidden');
  } else {
      if (deptNav) deptNav.classList.add('hidden');
  }
  controlsWrapper.classList.remove('hidden');
  controlsWrapper.classList.add('flex');
} else {
  controlsWrapper.classList.add('hidden');
  controlsWrapper.classList.remove('flex');
}
}

if (tabId === 'parade-state' && typeof renderParadeState === 'function') renderParadeState();
if (tabId === 'admin-structure' && typeof renderStructureUI === 'function') renderStructureUI();
}

function toggleTheme() {
document.documentElement.classList.toggle('dark');
const isDark = document.documentElement.classList.contains('dark');
localStorage.setItem('theme', isDark ? 'dark' : 'light');
const metaTheme = document.getElementById('theme-color-meta');
if (metaTheme) metaTheme.setAttribute('content', isDark ? '#121212' : '#ffffff');
}

function togglePassword(id, btnElement) {
const el = document.getElementById(id);
const isPassword = el.type === 'password';
el.type = isPassword ? 'text' : 'password';
if (btnElement) {
btnElement.innerHTML = isPassword 
? `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>`
: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>`;
}
}

function formatDisplayDate(dateObj) {
if (isNaN(dateObj)) return '';
return `${String(dateObj.getDate()).padStart(2,'0')} ${mos[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function formatDisplayDateTime(dateObj) {
if (isNaN(dateObj)) return '';
return `${formatDisplayDate(dateObj)} ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
}

function initDates() {
const now = new Date();
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

appData.leave.startD = new Date(now); appData.leave.endD = new Date(now);
appData.event.startD = new Date(now); appData.event.endD = new Date(oneHourLater);
appData.combined.startD = new Date(now); appData.combined.endD = new Date(oneHourLater);
appData.parade.targetD = new Date(now);

appData.register.birthdayD = new Date(2000, 0, 1);
appData.adminRegister.birthdayD = new Date(2000, 0, 1);
appData.manageUser.birthdayD = new Date(2000, 0, 1);

appData.register.birthdaySelected = false;
appData.adminRegister.birthdaySelected = false;
appData.manageUser.birthdaySelected = false;

updateButtonLabels();
}

function updateButtonLabels() {
const checkAndUpdate = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

checkAndUpdate('btn-leave-start', formatDisplayDate(appData.leave.startD));
checkAndUpdate('btn-leave-end', formatDisplayDate(appData.leave.endD));

checkAndUpdate('btn-event-start', appData.event.isAllDay ? formatDisplayDate(appData.event.startD) : formatDisplayDateTime(appData.event.startD));
checkAndUpdate('btn-event-end', appData.event.isAllDay ? formatDisplayDate(appData.event.endD) : formatDisplayDateTime(appData.event.endD));
checkAndUpdate('btn-event-until', formatDisplayDate(appData.event.untilD));

checkAndUpdate('btn-combined-event-start', appData.combined.isAllDay ? formatDisplayDate(appData.combined.startD) : formatDisplayDateTime(appData.combined.startD));
checkAndUpdate('btn-combined-event-end', appData.combined.isAllDay ? formatDisplayDate(appData.combined.endD) : formatDisplayDateTime(appData.combined.endD));
checkAndUpdate('btn-combined-leave-start', formatDisplayDate(appData.combined.startD));
checkAndUpdate('btn-combined-leave-end', formatDisplayDate(appData.combined.endD));
checkAndUpdate('btn-combined-until', formatDisplayDate(appData.combined.untilD));

checkAndUpdate('btn-parade-target', formatDisplayDateTime(appData.parade.targetD));

checkAndUpdate('btn-register-birthday', appData.register.birthdaySelected ? formatDisplayDate(appData.register.birthdayD) : "Select...");
checkAndUpdate('btn-admin-register-birthday', appData.adminRegister.birthdaySelected ? formatDisplayDate(appData.adminRegister.birthdayD) : "Select...");
checkAndUpdate('btn-manage-user-birthday', appData.manageUser.birthdaySelected ? formatDisplayDate(appData.manageUser.birthdayD) : "Select...");
}

function animateAndUpdate(btn) { 
const icon = btn.querySelector('svg'); 
if (icon) icon.classList.add('animate-spin'); 
setTimeout(async () => { 
  await updateApp(); 
  if (icon) icon.classList.remove('animate-spin'); 
}, 300); 
}

async function updateApp() {
if ('serviceWorker' in navigator) {
try { 
const regs = await navigator.serviceWorker.getRegistrations(); 
for (let reg of regs) await reg.unregister(); 
if (window.caches) {
  const names = await caches.keys(); 
  for (let name of names) await caches.delete(name); 
}
} catch(err) {}
}
window.location.reload();
}