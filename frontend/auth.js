// ==========================================
// Authentication & Registration Logic
// ==========================================

let unitsLoaded = false;

function showLogin() {
 document.getElementById('login-view').classList.remove('hidden-view');
 document.getElementById('app-view').classList.add('hidden-view');
 document.getElementById('logout-btn').classList.add('hidden');
 document.getElementById('menu-btn').classList.add('hidden');
 document.getElementById('active-tab-title').classList.add('hidden');
 
 const deptNav = document.getElementById('dash-dept-nav');
 const viewToggle = document.getElementById('dash-view-toggle');
 if (deptNav) deptNav.classList.add('hidden');
 if (viewToggle) {
   viewToggle.classList.add('hidden');
   viewToggle.classList.remove('flex');
 }
}

function toggleRegisterView(show) {
 if (show) {
   document.getElementById('login-form-container').classList.add('hidden-view');
   document.getElementById('register-form-container').classList.remove('hidden-view');
   
   if (!unitsLoaded) {
     apiCall('getSettings', { adminPass: null }).then(settings => {
       if (settings) {
         let allUnits = new Set();
         if (settings.companyStructure) {
           Object.keys(settings.companyStructure).forEach(p => {
             allUnits.add(p);
             settings.companyStructure[p].forEach(c => allUnits.add(c));
           });
         }
         if (allUnits.size === 0 && settings.allContacts) {
           settings.allContacts.forEach(c => { if(c.dept && c.dept !== 'Unassigned') allUnits.add(c.dept.toUpperCase()); });
         }
         
         const uniqueDepts = Array.from(allUnits).sort((a, b) => {
             if (a.toUpperCase() === 'HQ') return -1;
             if (b.toUpperCase() === 'HQ') return 1;
             return a.localeCompare(b);
         });
         
         const options = '<option value="" disabled selected>Select...</option>' + 
                         uniqueDepts.map(d => `<option value="${d}">${d}</option>`).join('');
         
         const regUnit = document.getElementById('reg-unit');
         const adminRegUnit = document.getElementById('admin-reg-unit');
         
         if (regUnit) regUnit.innerHTML = options;
         if (adminRegUnit) adminRegUnit.innerHTML = options;
         
         unitsLoaded = true;
       }
     }).catch(e => console.error("Error loading units", e));
   }
 } else {
   document.getElementById('login-form-container').classList.remove('hidden-view');
   document.getElementById('register-form-container').classList.add('hidden-view');
 }
}

async function handleLogin() {
 const pass = document.getElementById('login-pass').value;
 if (!pass) return alertError('login-alert', 'Please enter your password');
 
 showLoader(true);
 try {
   user = await apiCall('login', { password: pass });
   
   // FIX: Ensure the user object explicitly has the password so getLeaves succeeds 
   // even if an older GAS backend script forgot to return it
   if (!user.pass) {
       user.pass = pass;
   }
   
   localStorage.setItem('user', JSON.stringify(user));
   document.getElementById('login-pass').value = '';
   showApp(); 
 } catch (err) { 
   alertError('login-alert', err.message); 
   showLoader(false); 
 }
}

async function handleRegister(context) {
 const prefix = context === 'admin' ? 'admin-reg-' : 'reg-';
 const ctxObj = context === 'admin' ? 'adminRegister' : 'register';
 
 const name = document.getElementById(prefix + 'name').value.trim();
 const mobile = document.getElementById(prefix + 'mobile').value.trim();
 const unit = document.getElementById(prefix + 'unit').value;
 
 if (!name || !mobile || !unit) {
   alertError(context === 'admin' ? 'admin-alert' : 'register-alert', 'Please fill in all fields including the Unit.');
   return;
 }
 
 if (!appData[ctxObj].birthdaySelected) {
   alertError(context === 'admin' ? 'admin-alert' : 'register-alert', 'Please select a Birthday.');
   return;
 }
 
 const bday = appData[ctxObj].birthdayD;
 const bdayStr = `${bday.getFullYear()}-${String(bday.getMonth()+1).padStart(2,'0')}-${String(bday.getDate()).padStart(2,'0')}`;
 
 showLoader(true);
 try {
   await apiCall('registerUser', { fullName: name, mobile: mobile, unit: unit, birthday: bdayStr });
   alert('User successfully registered!');
   if (context === 'self') toggleRegisterView(false);
   
   document.getElementById(prefix + 'name').value = '';
   document.getElementById(prefix + 'mobile').value = '';
   document.getElementById(prefix + 'unit').value = '';
   initDates(); 
 } catch(e) { alertError(context === 'admin' ? 'admin-alert' : 'register-alert', e.message); } finally { showLoader(false); }
}

function logout() { localStorage.removeItem('user'); user = null; showLogin(); }
