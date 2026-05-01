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

function logout() { 
  localStorage.removeItem('user'); 
  user = null; 
  showLogin(); 
}
