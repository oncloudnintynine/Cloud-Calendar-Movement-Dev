// ==========================================
// Authentication Logic
// ==========================================

function showLogin() {
  document.getElementById('login-view').classList.remove('hidden-view');
  document.getElementById('app-view').classList.add('hidden-view');
  document.getElementById('logout-btn').classList.add('hidden');
  document.getElementById('menu-btn').classList.add('hidden');
  document.getElementById('active-tab-title').classList.add('hidden');
  
  const deptNav = document.getElementById('dash-dept-nav');
  if (deptNav) deptNav.classList.add('hidden');
}

function toggleRegisterView(show) {
  if (show) {
    document.getElementById('login-form-container').classList.add('hidden-view');
    document.getElementById('register-form-container').classList.remove('hidden-view');
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
    localStorage.setItem('user', JSON.stringify(user));
    document.getElementById('login-pass').value = '';
    showApp(); // Called from app.js
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
  const unit = document.getElementById(prefix + 'unit').value.trim();
  
  if (!name || !mobile || !unit) {
    alertError(context === 'admin' ? 'admin-alert' : 'register-alert', 'Please fill in all fields.');
    return;
  }
  
  const bday = appData[ctxObj].birthdayD;
  const bdayStr = `${bday.getFullYear()}-${String(bday.getMonth()+1).padStart(2,'0')}-${String(bday.getDate()).padStart(2,'0')}`;
  
  showLoader(true);
  try {
    await apiCall('registerUser', {
      fullName: name,
      mobile: mobile,
      unit: unit.toUpperCase(),
      birthday: bdayStr
    });
    
    alert('User successfully registered! You can now log in.');
    
    if (context === 'self') {
      toggleRegisterView(false);
    }
    
    document.getElementById(prefix + 'name').value = '';
    document.getElementById(prefix + 'mobile').value = '';
    document.getElementById(prefix + 'unit').value = '';
    initDates(); // Reset birthday picker
  } catch(e) {
    alertError(context === 'admin' ? 'admin-alert' : 'register-alert', e.message);
  } finally {
    showLoader(false);
  }
}

function logout() { 
  localStorage.removeItem('user'); 
  user = null; 
  showLogin(); 
}
