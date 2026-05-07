// ==========================================
// Github.js - Code Backup Utility
// ==========================================
// NOTE: Automated Code Updater logic has been migrated to the standalone Client Updater application
// to ensure 100% fail-safe deployment resilience.

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
  body.appendParagraph("