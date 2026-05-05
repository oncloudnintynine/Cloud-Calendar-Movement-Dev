// ==========================================
// Main Application Initialization
// ==========================================

const savedTheme = localStorage.getItem('theme');
const wantsDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

if(wantsDark) document.documentElement.classList.add('dark');

document.addEventListener('DOMContentLoaded', () => {
 const metaTheme = document.getElementById('theme-color-meta');
 if (metaTheme) metaTheme.setAttribute('content', wantsDark ? '#121212' : '#ffffff');
 if (ENV === 'Dev') document.getElementById('dev-banner').classList.remove('hidden');
 
 if (user) {
   if (!user.pass) {
       logout(); // Force login if old cache format lacks password
   } else {
       showApp(); 
   }
 } else {
   showLogin();
 }
 
 document.getElementById('login-pass').addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
 
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
   if(!e.target.closest('#admin-manage-search') && !e.target.closest('#admin-manage-results')) {
     const resM = document.getElementById('admin-manage-results');
     if(resM) resM.classList.add('hidden-view');
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
   const settings = await apiCall('getSettings', { adminPass: user.role === 'admin' ? user.pass : null }); 
   window.appLeaveTypes = settings.leaveTypes; 
   appMode = settings.appMode || 'separated';
   
   window.kahPhones = (settings.kahList ||[]).map(k => String(k.phone));
   
   companyStructure = settings.companyStructure ? (Array.isArray(settings.companyStructure) ? settings.companyStructure : Object.keys(settings.companyStructure)) :[];
   companyContacts = settings.allContacts ||[];
   
   const formLeaveType = document.getElementById('form-leave-type');
   if (formLeaveType) formLeaveType.innerHTML = settings.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('');
   
   const mOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
   applyMenuOrder(mOrder);
   
   if (user.role !== 'admin' && companyContacts.length > 0) {
       const myContact = companyContacts.find(c => c.phone == user.phone);
       if (myContact && myContact.dept) {
           user.departments = myContact.dept.split(',').map(s=>s.trim());
           localStorage.setItem('user', JSON.stringify(user));
       }
   }
   
   let allUnits = new Set(companyStructure);
   if (allUnits.size === 0 && companyContacts.length > 0) {
     companyContacts.forEach(c => {
       if (c.dept && c.dept !== 'Unassigned') {
         allUnits.add(c.dept.toUpperCase());
       }
     });
     companyStructure = Array.from(allUnits);
   }
   
   const uniqueDepts = Array.from(allUnits).sort((a, b) => {
       if (a.toUpperCase() === 'HQ') return -1;
       if (b.toUpperCase() === 'HQ') return 1;
       return a.localeCompare(b);
   });

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
   
   if (companyContacts.length > 0) {
     const uniqueNames =[...new Set(companyContacts.map(c => c.name))];
     validContactNames = uniqueNames.map(n => n.toLowerCase());
     fuseAllContacts = new Fuse(companyContacts, { keys:['name', 'dept', 'phone'], threshold: 0.3 });
     
     let attendeeOptions = companyContacts.map(c => ({ id: c.phone, name: c.name, dept: c.dept, type: 'contact' }));
     uniqueDepts.forEach(dept => {
       attendeeOptions.push({ id: dept, name: `zz All in ${dept}`, dept: dept, type: 'group' });
     });
     fuseAttendees = new Fuse(attendeeOptions, { keys:['name'], threshold: 0.3 });
   }

   if (user.role === 'admin') {
     document.getElementById('menu-admin-group').classList.remove('hidden');
     document.getElementById('admin-behalf-leave').classList.remove('hidden-view');
     document.getElementById('admin-behalf-event').classList.remove('hidden-view');
     populateAdminSettingsForm(settings);
   } else {
     document.getElementById('menu-admin-group').classList.add('hidden');
     document.getElementById('admin-behalf-leave').classList.add('hidden-view');
     document.getElementById('admin-behalf-event').classList.add('hidden-view');
   }

   await loadLeavesData();
   switchTab(user.role === 'admin' ? 'admin' : mOrder[0]); 

 } catch(e) {
   console.error("Error loading settings: ", e);
   alertError('login-alert', 'Error initializing app.');
 }
 showLoader(false);
}

if ('serviceWorker' in navigator) {
   window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => {}));
}
