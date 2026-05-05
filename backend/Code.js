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
   DocumentApp.create('dummy'); 
 } catch(e) {}

 var props = PropertiesService.getScriptProperties();
 if (!props.getProperty('adminPassword')) props.setProperty('adminPassword', 'P@ssw0rd');
 if (!props.getProperty('kahLimit')) props.setProperty('kahLimit', '50');
 if (!props.getProperty('leaveTypes')) props.setProperty('leaveTypes', JSON.stringify(['Annual Leave', 'Sick Leave', 'Overseas Leave', 'Official Trip']));
 if (!props.getProperty('approvingAuthority')) props.setProperty('approvingAuthority', Session.getActiveUser().getEmail());
 if (!props.getProperty('kahList')) props.setProperty('kahList', JSON.stringify([]));
 if (!props.getProperty('menuOrder')) props.setProperty('menuOrder', JSON.stringify(['dashboard', 'parade-state', 'my-leaves', 'submit-leave', 'submit-event']));
 
 if (!props.getProperty('userKeyword')) props.setProperty('userKeyword', 'peace');
 if (!props.getProperty('appMode')) props.setProperty('appMode', 'separated');
 if (!props.getProperty('companyStructure')) props.setProperty('companyStructure', JSON.stringify({}));
 
 var dbId = props.getProperty('dbSheetId');
 if (!dbId) {
   var ss = SpreadsheetApp.create("Company_Leaves_DB");
   var sheet = ss.getActiveSheet();
   sheet.appendRow(['ID', 'Timestamp', 'Phone', 'Name', 'Department', 'LeaveType', 'StartDate', 'EndDate', 'HalfDay', 'CoveringPerson', 'Country', 'State', 'Remarks', 'Status', 'EventIDs', 'Location', 'Attendees', 'InfoAll', 'IsAllDay', 'UntilDate']);
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
 if (headers.indexOf('IsAllDay') === -1) { sheet.getRange(1, headers.length + 1).setValue('IsAllDay'); headers.push('IsAllDay'); }
 if (headers.indexOf('UntilDate') === -1) { sheet.getRange(1, headers.length + 1).setValue('UntilDate'); headers.push('UntilDate'); }
 return headers;
}

function doPost(e) {
 var lock = LockService.getScriptLock();
 var payload = JSON.parse(e.postData.contents);
 var action = payload.action;
 
 // OPTIMIZATION: Only lock the script for mutating actions to prevent read-only blocking
 var needsLock =['submitLeave', 'editLeave', 'cancelLeave', 'registerUser', 'updateUser', 'deleteUser', 'updateUserUnits', 'saveSettings'].indexOf(action) !== -1;
 if (needsLock) lock.waitLock(15000); 
 
 try {
   var data = payload.data || {};
   var credentials = payload.credentials || {};
   var responseData = {};

   // SECURITY: Enforce API authentication for sensitive endpoints
   var secureActions =['getSettings', 'saveSettings', 'submitLeave', 'editLeave', 'cancelLeave', 'getLeaves', 'backupCode', 'updateUser', 'deleteUser', 'updateUserUnits'];
   if (secureActions.indexOf(action) !== -1) {
     if (!credentials.phone && !credentials.pass && !data.adminPass) throw new Error("Unauthorized: Missing credentials");
     
     // Determine if it's admin explicit override or normal user pass
     var checkPass = data.adminPass || credentials.pass;
     var verifiedUser = handleLogin({ password: checkPass });
     
     if (verifiedUser.role !== 'admin' && verifiedUser.phone !== credentials.phone) {
       throw new Error("Unauthorized: Invalid credentials");
     }
     
     data._userRole = verifiedUser.role;
     data._userPhone = verifiedUser.phone;
   }

   if (action === 'login') responseData = handleLogin(data);
   else if (action === 'getSettings') responseData = getSettings(data);
   else if (action === 'saveSettings') responseData = saveSettings(data);
   else if (action === 'submitLeave') responseData = submitLeave(data);
   else if (action === 'editLeave') responseData = editLeave(data);
   else if (action === 'getLeaves') responseData = getLeaves(data);
   else if (action === 'cancelLeave') responseData = cancelLeave(data);
   else if (action === 'backupCode') responseData = backupCode(data);
   else if (action === 'registerUser') responseData = registerUser(data);
   else if (action === 'updateUser') responseData = updateUser(data);
   else if (action === 'deleteUser') responseData = deleteUser(data);
   else if (action === 'updateUserUnits') responseData = updateUserUnits(data);

   return ContentService.createTextOutput(JSON.stringify({ success: true, data: responseData })).setMimeType(ContentService.MimeType.JSON);
 } catch (err) {
   return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
 } finally {
   if (needsLock) lock.releaseLock();
 }
}

function doOptions(e) { 
 return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON); 
}
