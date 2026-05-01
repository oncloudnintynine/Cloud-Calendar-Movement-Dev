// ==========================================
// Main Application Initialization
// ==========================================

// Handle Dark Mode Init and Status Bar Color
const savedTheme = localStorage.getItem('theme');
const wantsDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

if(wantsDark) {
    document.documentElement.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', () => {
  // Set initial status bar color
  const metaTheme = document.getElementById('theme-color-meta');
  if (metaTheme) {
    metaTheme.setAttribute('content', wantsDark ? '#121212' : '#ffffff');
  }

  if (ENV === 'Dev') document.getElementById('dev-banner').classList.remove('hidden');
  
  if (user) showApp(); 
  else showLogin();
  
  // Login Enter Key binding
  document.getElementById('login-pass').addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
  
  // Global Click-Outside handlers for dropdowns
  document.addEventListener('click', function(e) {
    if(!e.target.closest('#form-leave-cover') && !e.target.closest('#cover-results-leave')) {
      const resCL = document.getElementById('cover-results-leave');
      if(resCL) resCL.classList.add('hidden-view');
    }
    if(!e.target.closest('#form-event-attendee-search') && !e.target.closest('#attendees-results')) {
      const resA = document.getElementById('attendees-results');
      if(resA) resA.classList.add('hidden-view');
    }
    if(!e.target.closest('#kah-search') && !e.target.closest('#kah-results')) {
      const resK = document.getElementById('kah-results');
      if(resK) resK.classList.add('hidden-view');
    }
  });
  
  initDates();
});

async function showApp() {
  showLoader(true);
  document.getElementById('login-view').classList.add('hidden-view');
  document.getElementById('app-view').classList.remove('hidden-view');
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('menu-btn').classList.remove('hidden');
  document.getElementById('active-tab-title').classList.remove('hidden');
  
  if (user.role === 'admin') {
    document.getElementById('nav-user-name').innerText = "Administrator";['menu-dashboard','menu-parade-state','menu-my-leaves','menu-submit-leave','menu-submit-event'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('menu-admin').classList.remove('hidden'); 
    
    switchTab('admin'); 
    await loadAdminSettings();
  } else {
    document.getElementById('nav-user-name').innerText = user.departments.length ? `${user.name}` : user.name;['menu-dashboard','menu-parade-state','menu-my-leaves','menu-submit-leave','menu-submit-event'].forEach(id => document.getElementById(id).classList.remove('hidden'));
    document.getElementById('menu-admin').classList.add('hidden'); 
    
    try {
      const settings = await apiCall('getSettings', { adminPass: null }); 
      window.appLeaveTypes = settings.leaveTypes; 
      
      const formLeaveType = document.getElementById('form-leave-type');
      if (formLeaveType) formLeaveType.innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
      
      const mOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
      applyMenuOrder(mOrder);
      
      if (settings.allContacts) {
        companyContacts = settings.allContacts;
        const uniqueNames = [...new Set(companyContacts.map(c => c.name))];
        validContactNames = uniqueNames.map(n => n.toLowerCase());
        
        const uniqueDepts =[...new Set(companyContacts.map(c => c.dept))];
        const deptNav = document.getElementById('dash-dept-nav');
        
        if (deptNav) {
          deptNav.innerHTML = '<option value="">All Depts</option>' + uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        // Also pre-populate the registration dropdowns
        const regOptions = '<option value="" disabled selected>Select...</option>' + uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
        const regUnit = document.getElementById('reg-unit');
        const adminRegUnit = document.getElementById('admin-reg-unit');
        if (regUnit) regUnit.innerHTML = regOptions;
        if (adminRegUnit) adminRegUnit.innerHTML = regOptions;
        unitsLoaded = true; // Mark as loaded for auth.js
        
        fuseAllContacts = new Fuse(companyContacts, { keys:['name', 'dept'], threshold: 0.3 });
        
        let attendeeOptions = companyContacts.map(c => ({ id: c.phone, name: c.name, dept: c.dept, type: 'contact' }));
        uniqueDepts.forEach(dept => {
          attendeeOptions.push({ id: dept, name: `zz All in ${dept}`, dept: dept, type: 'group' });
        });
        fuseAttendees = new Fuse(attendeeOptions, { keys:['name'], threshold: 0.3 });
      }

      await loadLeavesData();
      switchTab(mOrder[0]); 

    } catch(e) {
      console.error("Error loading settings: ", e);
    }
  }
  showLoader(false);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => {
        console.error("SW Registration failed:", err);
    }));
}
