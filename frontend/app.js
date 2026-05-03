// ==========================================
// Main Application Initialization
// ==========================================

// Handle Dark Mode Init and Status Bar Color
const savedTheme = localStorage.getItem('theme');
const wantsDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

if(wantsDark) document.documentElement.classList.add('dark');

document.addEventListener('DOMContentLoaded', () => {
  const metaTheme = document.getElementById('theme-color-meta');
  if (metaTheme) metaTheme.setAttribute('content', wantsDark ? '#121212' : '#ffffff');
  if (ENV === 'Dev') document.getElementById('dev-banner').classList.remove('hidden');
  
  if (user) showApp(); else showLogin();
  
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
    if(!e.target.closest('#admin-behalf-leave') && !e.target.closest('#behalf-results-leave')) {
      const resBHL = document.getElementById('behalf-results-leave');
      if(resBHL) resBHL.classList.add('hidden-view');
    }
    if(!e.target.closest('#admin-behalf-event') && !e.target.closest('#behalf-results-event')) {
      const resBHE = document.getElementById('behalf-results-event');
      if(resBHE) resBHE.classList.add('hidden-view');
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
  
  document.getElementById('nav-user-name').innerText = user.role === 'admin' ? "Administrator" : (user.departments.length ? `${user.name}` : user.name);

  try {
    // Both Admin and User need settings to build the dashboard now
    const settings = await apiCall('getSettings', { adminPass: user.role === 'admin' ? user.pass : null }); 
    window.appLeaveTypes = settings.leaveTypes; 
    appMode = settings.appMode || 'separated';
    companyStructure = settings.companyStructure || {};
    
    // Inject form dropdown options
    const formLeaveType = document.getElementById('form-leave-type');
    if (formLeaveType) formLeaveType.innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    
    // Setup Unified vs Separated Menu
    const mOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
    applyMenuOrder(mOrder);
    
    // Process Contacts & Departments
    if (settings.allContacts) {
      companyContacts = settings.allContacts;
      const uniqueNames = [...new Set(companyContacts.map(c => c.name))];
      validContactNames = uniqueNames.map(n => n.toLowerCase());
      
      const uniqueDepts =[...new Set(companyContacts.map(c => c.dept))];
      const deptNav = document.getElementById('dash-dept-nav');
      
      if (deptNav) {
        let deptHtml = '<option value="">All Depts</option>';
        if (appMode === 'unified') deptHtml += '<option value="MY_CALENDAR">My Calendar</option>';
        deptHtml += uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
        deptNav.innerHTML = deptHtml;
      }
      
      const regOptions = '<option value="" disabled selected>Select...</option>' + uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
      const regUnit = document.getElementById('reg-unit');
      const adminRegUnit = document.getElementById('admin-reg-unit');
      if (regUnit) regUnit.innerHTML = regOptions;
      if (adminRegUnit) adminRegUnit.innerHTML = regOptions;
      unitsLoaded = true;
      
      fuseAllContacts = new Fuse(companyContacts, { keys:['name', 'dept', 'phone'], threshold: 0.3 });
      
      let attendeeOptions = companyContacts.map(c => ({ id: c.phone, name: c.name, dept: c.dept, type: 'contact' }));
      uniqueDepts.forEach(dept => {
        attendeeOptions.push({ id: dept, name: `zz All in ${dept}`, dept: dept, type: 'group' });
      });
      fuseAttendees = new Fuse(attendeeOptions, { keys:['name'], threshold: 0.3 });
    }

    // Admin UI Reveals
    if (user.role === 'admin') {
      document.getElementById('menu-admin-group').classList.remove('hidden');
      document.getElementById('admin-behalf-leave').classList.remove('hidden-view');
      document.getElementById('admin-behalf-event').classList.remove('hidden-view');
      populateAdminSettingsForm(settings);
    } else {
      document.getElementById('menu-admin-group').classList.add('hidden');
    }

    await loadLeavesData();
    switchTab(user.role === 'admin' ? 'dashboard' : mOrder[0]); 

  } catch(e) {
    console.error("Error loading settings: ", e);
    alertError('login-alert', 'Error initializing app.');
  }
  showLoader(false);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => {}));
}
