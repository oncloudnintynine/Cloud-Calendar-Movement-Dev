// ==========================================
// API & Network Communication
// ==========================================

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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ action, data })
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
