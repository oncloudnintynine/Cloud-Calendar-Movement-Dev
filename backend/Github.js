// ==========================================
// Github.js - Code Backup & Auto Updater
// ==========================================

function backupCode(data) {
 var folder;
 try {
   folder = DriveApp.getFolderById(data.folderId);
 } catch(e) {
   throw new Error("Could not access Google Drive folder. Please verify the Folder ID/URL and ensure the admin account has Editor access to it.");
 }

 var docName = "Cloud Moves Code Backup - " + Utilities.formatDate(new Date(), "Asia/Singapore", "yyyy-MM-dd HH:mm");
 var doc = DocumentApp.create(docName);
 
 var docFile = DriveApp.getFileById(doc.getId());
 docFile.moveTo(folder);

 var body = doc.getBody();
 body.appendParagraph("#####*****");
 body.appendParagraph("Full File Hierarchy");
 body.appendParagraph("#####*****");
 body.appendParagraph(data.hierarchy);
 body.appendParagraph("");

 // Export in the exact format required for the Code Updater
 data.files.forEach(function(file) {
   body.appendParagraph("$$$ FILE: " + file.path + " $$$");
   body.appendParagraph("```javascript");
   body.appendParagraph(file.content);
   body.appendParagraph("```");
   body.appendParagraph("");
 });

 doc.saveAndClose();
 return { url: doc.getUrl() };
}

function pushCodeUpdate(data) {
 if (data._userRole !== 'admin') throw new Error("Unauthorized");
 
 var token = data.githubToken;
 var repo = data.githubRepo; 
 var branch = data.branch || "main";
 var files = data.files; // array of {path, content}

 if (!token || !repo || !files || files.length === 0) {
    throw new Error("Missing required parameters for GitHub push.");
 }

 var headers = { 
    "Authorization": "Bearer " + token, 
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28"
 };
 var baseUrl = "https://api.github.com/repos/" + repo;

 try {
    var refRes = UrlFetchApp.fetch(baseUrl + "/git/refs/heads/" + branch, {headers: headers});
    var refData = JSON.parse(refRes.getContentText());
    var commitSha = refData.object.sha;

    var commitRes = UrlFetchApp.fetch(baseUrl + "/git/commits/" + commitSha, {headers: headers});
    var commitData = JSON.parse(commitRes.getContentText());
    var baseTreeSha = commitData.tree.sha;

    var treeData = {
        base_tree: baseTreeSha,
        tree: files.map(function(f) {
            return { path: f.path, mode: "100644", type: "blob", content: f.content };
        })
    };
    var newTreeRes = UrlFetchApp.fetch(baseUrl + "/git/trees", {
        method: "post", headers: headers, payload: JSON.stringify(treeData)
    });
    var newTreeSha = JSON.parse(newTreeRes.getContentText()).sha;

    var newCommitData = {
        message: "Automated App Code Update via Cloud Moves Updater",
        tree: newTreeSha,
        parents: [commitSha]
    };
    var newCommitRes = UrlFetchApp.fetch(baseUrl + "/git/commits", {
        method: "post", headers: headers, payload: JSON.stringify(newCommitData)
    });
    var newCommitSha = JSON.parse(newCommitRes.getContentText()).sha;

    UrlFetchApp.fetch(baseUrl + "/git/refs/heads/" + branch, {
        method: "patch", headers: headers, payload: JSON.stringify({sha: newCommitSha})
    });

    return { commitUrl: "https://github.com/" + repo + "/commit/" + newCommitSha };
 } catch (err) {
    throw new Error("GitHub API Error: " + err.message);
 }
}
