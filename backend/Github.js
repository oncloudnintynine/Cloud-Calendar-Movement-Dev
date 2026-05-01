// ==========================================
// Github.js - Code Backup Integrations
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
  
  // Move to folder
  var docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(folder);

  var body = doc.getBody();
  body.appendParagraph("#####*****");
  body.appendParagraph("Full File Hierarchy");
  body.appendParagraph("#####*****");
  body.appendParagraph(data.hierarchy);

  data.files.forEach(function(file) {
    body.appendParagraph("#####*****");
    body.appendParagraph(file.url);
    body.appendParagraph("#####*****");
    body.appendParagraph(file.content);
  });

  doc.saveAndClose();
  return { url: doc.getUrl() };
}
