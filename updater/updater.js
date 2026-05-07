// ==========================================
// Isolated Client-Side GitHub Committer
// ==========================================

document.getElementById('updater-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const repo = document.getElementById('gh-repo').value.trim();
    const branch = document.getElementById('gh-branch').value.trim();
    const token = document.getElementById('gh-token').value.trim();
    const payload = document.getElementById('gh-payload').value.trim();
    
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const submitBtn = document.getElementById('submit-btn');
    const statusMsg = document.getElementById('status-message');
    
    const setStatus = (msg, isError = false) => {
        statusMsg.textContent = msg;
        statusMsg.className = `mb-3 p-3 rounded-lg text-sm font-semibold text-center ${isError ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-green-900/50 text-green-400 border border-green-800'}`;
        statusMsg.classList.remove('hidden');
    };

    submitBtn.disabled = true;
    btnText.textContent = "Processing...";
    btnSpinner.classList.remove('hidden');
    statusMsg.classList.add('hidden');

    try {
        // 1. Parse the AI Payload using the exact Regex pattern
        const files =[];
        const fileRegex = /\$\$\$\s*FILE:\s*([^\$]+)\s*\$\$\$\s*