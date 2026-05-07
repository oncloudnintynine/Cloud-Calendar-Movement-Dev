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
        const fileRegex = /\$\$\$\s*FILE:\s*([^\$]+)\s*\$\$\$\s*```javascript([\s\S]*?)```/g;
        let match;
        
        while ((match = fileRegex.exec(payload)) !== null) {
            files.push({
                path: match[1].trim(),
                content: match[2].trim()
            });
        }

        if (files.length === 0) {
            throw new Error("No files parsed. Ensure you copied the exact format ($$$ FILE: path $$$ followed by ```javascript code block).");
        }

        btnText.textContent = "Pushing to GitHub API...";

        // 2. Client-side direct GitHub API configuration
        const headers = { 
            "Authorization": `Bearer ${token}`, 
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        };
        const baseUrl = `https://api.github.com/repos/${repo}`;

        // Step A: Get current branch reference to find the latest commit
        let res = await fetch(`${baseUrl}/git/refs/heads/${branch}`, { headers });
        if (!res.ok) throw new Error(`GitHub API Error: Could not find branch '${branch}'. Verify repo and token.`);
        const refData = await res.json();
        const commitSha = refData.object.sha;

        // Step B: Get the commit object to find the base tree
        res = await fetch(`${baseUrl}/git/commits/${commitSha}`, { headers });
        const commitData = await res.json();
        const baseTreeSha = commitData.tree.sha;

        // Step C: Create a new tree with the updated files
        const treeNodes = files.map(f => ({
            path: f.path,
            mode: "100644",
            type: "blob",
            content: f.content
        }));

        res = await fetch(`${baseUrl}/git/trees`, {
            method: "POST",
            headers,
            body: JSON.stringify({ base_tree: baseTreeSha, tree: treeNodes })
        });
        if (!res.ok) throw new Error("GitHub API Error: Failed to construct Git Tree.");
        const treeData = await res.json();
        const newTreeSha = treeData.sha;

        // Step D: Create a new commit object
        res = await fetch(`${baseUrl}/git/commits`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                message: "Automated emergency update via Fail-Safe Client Updater",
                tree: newTreeSha,
                parents: [commitSha]
            })
        });
        if (!res.ok) throw new Error("GitHub API Error: Failed to create Commit.");
        const newCommitData = await res.json();
        const newCommitSha = newCommitData.sha;

        // Step E: Fast-forward the branch reference to the new commit
        res = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ sha: newCommitSha })
        });
        if (!res.ok) throw new Error("GitHub API Error: Failed to update branch reference.");

        setStatus(`Success! Pushed ${files.length} files. GitHub Actions is deploying...`);
        document.getElementById('gh-payload').value = '';

    } catch (err) {
        setStatus(err.message, true);
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Push Code to GitHub";
        btnSpinner.classList.add('hidden');
    }
});
