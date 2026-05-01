// ==========================================
// Code.js - Main Router & DB Setup
// ==========================================

function INITIAL_SETUP() {
  try {
    People.ContactGroups.list({ pageSize: 1 });
    People.People.Connections.list('people/me', { pageSize: 1, personFields: 'names' });
    CalendarApp.getAllCalendars();
    MailApp.getRemainingDailyQuota();
    DriveApp.getFiles(1);
    DocumentApp.create('dummy'); // Added to trigger Google Docs OAuth Scope
  } catch(e) {}

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('adminPassword')) props.setProperty('adminPassword', 'P@ssw0rd');
  if (!props.getProperty('kahLimit')) props.setProperty('kahLimit', '50');
  if (!props.getProperty('leaveTypes')) props.setProperty('leaveTypes', JSON.stringify(['Annual Leave', 'Sick Leave', 'Overseas Leave', 'Official Trip']));
  if (!props.getProperty('approvingAuthority')) props.setProperty('approvingAuthority', Session.getActiveUser().getEmail());
  if (!props.getProperty('kahList')) props.setProperty('kahList', JSON.stringify([]));
  if (!props.getProperty('menuOrder')) props.setProperty('menuOrder', JSON.stringify(['dashboard', 'parade-state', 'my-leaves', 'submit-leave', 'submit-event']));
  
  var dbId = props.getProperty('dbSheetId');
  if (!dbId) {
    var ss = SpreadsheetApp.create("Company_Leaves_DB");
    var sheet = ss.getActiveSheet();
    sheet.appendRow(['ID', 'Timestamp', 'Phone', 'Name', 'Department', 'LeaveType', 'StartDate', 'EndDate', 'HalfDay', 'CoveringPerson', 'Country', 'State', 'Remarks', 'Status', 'EventIDs', 'Location', 'Attendees', 'InfoAll']);
    props.setProperty('dbSheetId', ss.getId());
  } else {
    verifySchema(SpreadsheetApp.openById(dbId).getActiveSheet());
  }
}

function verifySchema(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('Location') === -1) { sheet.getRange(1, headers.length + 1).setValue('Location'); headers.push('Location'); }
  if (headers.indexOf('Attendees') === -1) { sheet.getRange(1, headers.length + 1).setValue('Attendees'); headers.push('Attendees'); }
  if (headers.indexOf('InfoAll') === -1) { sheet.getRange(1, headers.length + 1).setValue('InfoAll'); headers.push('InfoAll'); }
  return headers;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000); 
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var responseData = {};

    if (action === 'login') responseData = handleLogin(data);
    else if (action === 'getSettings') responseData = getSettings(data);
    else if (action === 'saveSettings') responseData = saveSettings(data);
    else if (action === 'submitLeave') responseData = submitLeave(data);
    else if (action === 'editLeave') responseData = editLeave(data);
    else if (action === 'getLeaves') responseData = getLeaves(data);
    else if (action === 'cancelLeave') responseData = cancelLeave(data);
    else if (action === 'backupCode') responseData = backupCode(data);

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: responseData })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doOptions(e) { 
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON); 
}
