// ==========================================
// UI, Navigation, & Formatter Logic
// ==========================================

// --- Menu UI Logic ---
function toggleMenu() {
  const menu = document.getElementById('slide-menu');
  const panel = document.getElementById('slide-menu-panel');
  if (menu.classList.contains('hidden-view')) {
    menu.classList.remove('hidden-view');
    setTimeout(() => { panel.classList.remove('-translate-x-full'); }, 10);
  } else {
    closeMenu();
  }
}

function closeMenu() {
  const menu = document.getElementById('slide-menu');
  const panel = document.getElementById('slide-menu-panel');
  panel.classList.add('-translate-x-full');
  setTimeout(() => { menu.classList.add('hidden-view'); }, 300); 
}

function applyMenuOrder(orderArr) {
  const menuContainer = document.getElementById('slide-menu-items');
  const adminBtn = document.getElementById('menu-admin');
  
  if(menuContainer) {
    orderArr.forEach(id => {
      const btn = document.getElementById(`menu-${id}`);
      if (btn) menuContainer.appendChild(btn);
    });
    if (adminBtn) menuContainer.appendChild(adminBtn); 
  }
}

function switchTab(tabId) {
  closeMenu();
  
  // Hide all views
  document.querySelectorAll('.tab-content').forEach(el => { 
    el.classList.add('hidden-view'); 
    el.classList.remove('flex'); 
  });
  
  // Show target view
  const view = document.getElementById(`view-${tabId}`);
  if (view) {
    view.classList.remove('hidden-view');
    view.classList.add('flex'); 
  }
  
  // Update Menu Highlights
  document.querySelectorAll('#slide-menu-panel button[id^="menu-"]').forEach(btn => {
    btn.classList.remove('bg-blue-50', 'text-blue-600', 'dark:bg-darkhover', 'dark:text-blue-400');
  });
  const activeMenu = document.getElementById(`menu-${tabId}`);
  if (activeMenu) {
    activeMenu.classList.add('bg-blue-50', 'text-blue-600', 'dark:bg-darkhover', 'dark:text-blue-400');
  }
  
  // Update Header Title
  const titleEl = document.getElementById('active-tab-title');
  if (titleEl) {
    if (currentEditId && tabId === 'submit-event') titleEl.innerText = "Update Event";
    else if (currentEditId && tabId === 'submit-leave') titleEl.innerText = "Update Record";
    else titleEl.innerText = TAB_NAMES[tabId] || '';
  }
  
  // Update Dashboard specific nav
  const deptNav = document.getElementById('dash-dept-nav');
  if (deptNav) {
    if (tabId === 'dashboard') deptNav.classList.remove('hidden');
    else deptNav.classList.add('hidden');
  }
  
  // Trigger specific renders if needed
  if (tabId === 'parade-state' && typeof renderParadeState === 'function') {
    renderParadeState();
  }
}

// --- Theme & Generic Toggles ---
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Dynamically update the mobile status bar color
  const metaTheme = document.getElementById('theme-color-meta');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#121212' : '#ffffff');
  }
}

function togglePassword(id, btnElement) {
  const el = document.getElementById(id);
  const isPassword = el.type === 'password';
  el.type = isPassword ? 'text' : 'password';
  if (btnElement) {
    btnElement.innerHTML = isPassword 
      ? `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`
      : `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
  }
}

// --- Date & Time Formatters ---
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
  appData.leave.startD = new Date(now); appData.leave.endD = new Date(now);
  appData.event.startD = new Date(now); appData.event.endD = new Date(now);
  appData.parade.targetD = new Date(now);
  updateButtonLabels();
}

function updateButtonLabels() {
  const lblLStart = document.getElementById('btn-leave-start');
  const lblLEnd = document.getElementById('btn-leave-end');
  const lblEStart = document.getElementById('btn-event-start');
  const lblEEnd = document.getElementById('btn-event-end');
  const lblEUntil = document.getElementById('btn-event-until');
  const lblParade = document.getElementById('btn-parade-target');

  if(lblLStart) lblLStart.innerText = formatDisplayDate(appData.leave.startD);
  if(lblLEnd) lblLEnd.innerText = formatDisplayDate(appData.leave.endD);
  
  if(lblEStart) lblEStart.innerText = appData.event.isAllDay ? formatDisplayDate(appData.event.startD) : formatDisplayDateTime(appData.event.startD);
  if(lblEEnd) lblEEnd.innerText = appData.event.isAllDay ? formatDisplayDate(appData.event.endD) : formatDisplayDateTime(appData.event.endD);
  if(lblEUntil) lblEUntil.innerText = formatDisplayDate(appData.event.untilD);
  
  if(lblParade) lblParade.innerText = formatDisplayDateTime(appData.parade.targetD);
}

// --- App Updates (PWA/Cache) ---
function animateAndUpdate(btn) { 
  const icon = btn.querySelector('svg'); 
  if (icon) icon.classList.add('animate-spin'); 
  setTimeout(() => { updateApp(); }, 300); 
}

async function updateApp() {
  if ('serviceWorker' in navigator) {
    try { 
      const regs = await navigator.serviceWorker.getRegistrations(); 
      for (let reg of regs) await reg.unregister(); 
      const names = await caches.keys(); 
      for (let name of names) await caches.delete(name); 
    } catch(err) {}
  }
  window.location.href = window.location.pathname + '?v=' + new Date().getTime();
}
