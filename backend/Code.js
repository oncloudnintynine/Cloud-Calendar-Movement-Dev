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
if (!props.getProperty('approvingAuthority')) props.setProperty('approvingAuthority', Session.getActiveUser().getEmail());
if (!props.getProperty('kahList')) props.setProperty('kahList', JSON.stringify([]));
if (!props.getProperty('menuOrder')) props.setProperty('menuOrder', JSON.stringify(['dashboard', 'parade-state', 'my-leaves', 'submit-combined']));
if (!props.getProperty('adminSectionsOrder')) props.setProperty('adminSectionsOrder', JSON.stringify(['app-mode', 'register-user', 'manage-users', 'admin-pass', 'user-keyword', 'menu-order', 'code-backup']));

if (!props.getProperty('typicalEventTypes')) {
 var oldLeaveTypes = JSON.parse(props.getProperty('leaveTypes') || "[]");
 var defaultTypes =[
   {name: 'Meeting', isEvent: true, defaultLoc: 'Conference Room'},
   {name: 'Others', isEvent: true},
   {name: 'Official Trip', isEvent: false},
   {name: 'Overseas Leave', isEvent: false},
   {name: 'Local Leave', isEvent: false}
 ];
 oldLeaveTypes.forEach(function(lt) {
   if (!defaultTypes.some(function(dt) { return dt.name === lt; })) {
     defaultTypes.push({name: lt, isEvent: false});
   }
 });
 props.setProperty('typicalEventTypes', JSON.stringify(defaultTypes));
}

if (!props.getProperty('kahEmailSubject')) props.setProperty('kahEmailSubject', 'Leave Requires Approval: KAH Limit Crossed for {Unit}');
if (!props.getProperty('kahEmailBody')) props.setProperty('kahEmailBody', 'User {Name} applied for {EventType} but KAH limit was crossed for {Unit}.');

if (!props.getProperty('gcalTemplate')) props.setProperty('gcalTemplate', '{EventType} - {Name}, {Attendees} {Time}');
if (!props.getProperty('agendaTemplate')) props.setProperty('agendaTemplate', '{EventType} - {Name} ({Department})');
if (!props.getProperty('acronyms')) props.setProperty('acronyms', JSON.stringify({}));
if (!props.getProperty('customKahGroups')) props.setProperty('customKahGroups', JSON.stringify([]));

if (!props.getProperty('userKeyword')) props.setProperty('userKeyword', 'peace');
if (!props.getProperty('appMode')) props.setProperty('appMode', 'combined');
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

function applyAcronyms(text, acronymsObj) {
if (!text || !acronymsObj) return text;
var result = text;
for (var key in acronymsObj) {
  if (!key) continue;
  var val = acronymsObj[key];
  var full = typeof val === 'object' ? val.full : val;
  var active = typeof val === 'object' ? val.active : true; 
  if (!active) continue;

  var escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  var regex = new RegExp("\\b" + escapedKey + "\\b", "gi");
  result = result.replace(regex, full);
}
return result;
}

function doPost(e) {
var lock = LockService.getScriptLock();
var payload = JSON.parse(e.postData.contents);
var action = payload.action;

var needsLock =['submitLeave', 'editLeave', 'cancelLeave', 'registerUser', 'updateUser', 'deleteUser', 'updateUserUnits', 'saveSettings'].indexOf(action) !== -1;
if (needsLock) lock.waitLock(15000); 

try {
 var data = payload.data || {};
 var credentials = payload.credentials || {};
 var responseData = {};

 var secureActions =['getSettings', 'saveSettings', 'submitLeave', 'editLeave', 'cancelLeave', 'getLeaves', 'backupCode', 'updateUser', 'deleteUser', 'updateUserUnits'];
 if (secureActions.indexOf(action) !== -1) {
   if (!credentials.pass && !data.adminPass) throw new Error("Unauthorized: Missing credentials");
   
   var checkPass = data.adminPass || credentials.pass;
   var verifiedUser = handleLogin({ password: checkPass });
   
   if (verifiedUser.role !== 'admin' && String(verifiedUser.phone) !== String(credentials.phone)) {
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