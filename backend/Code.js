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
if (!props.getProperty('menuOrder')) props.setProperty('menuOrder', JSON.stringify(['dashboard', 'parade-state', 'my-leaves', 'submit-combined']));
if (!props.getProperty('landingPage')) props.setProperty('landingPage', 'dashboard');
if (!props.getProperty('dashboardDeptOrder')) props.setProperty('dashboardDeptOrder', JSON.stringify([]));
if (!props.getProperty('adminSectionsOrder')) props.setProperty('adminSectionsOrder', JSON.stringify(['landing-page', 'app-mode', 'dashboard-filter-order', 'admin-pass', 'user-keyword', 'menu-order']));
if (!props.getProperty('adminContactsSectionsOrder')) props.setProperty('adminContactsSectionsOrder', JSON.stringify(['contact-format', 'register-user', 'manage-users']));

var typicalEventTypes = props.getProperty('typicalEventTypes');
if (!typicalEventTypes) {
var defaultTypes =[
{name: 'Generic', isEvent: true, defaultLoc: 'In Camp', isKahRelevant: false, fields: { location:{show:true, req:true}, locationDetails:{show:true,req:false}, attendees:{show:true,req:false}, remarks:{show:true,req:true,label:'Meeting Description'} }, fieldOrder: ['time', 'location', 'attendees', 'remarks', 'repeat', 'overseas']},
{name: 'Others', isEvent: true, defaultLoc: 'Out of Camp', isKahRelevant: false, fields: { location:{show:true, req:true}, locationDetails:{show:true,req:false}, attendees:{show:true,req:false}, remarks:{show:true,req:false,label:'Remarks'} }, fieldOrder: ['time', 'location', 'attendees', 'remarks', 'repeat', 'overseas']},
{name: 'Official Trip', isEvent: false, isKahRelevant: true, fields: { location:{show:false, req:false}, locationDetails:{show:false,req:false}, attendees:{show:true,req:false}, remarks:{show:true,req:false,label:'Remarks'} }, fieldOrder: ['overseas', 'time', 'remarks', 'attendees', 'location', 'repeat']},
{name: 'Overseas Leave', isEvent: false, isKahRelevant: true, fields: { location:{show:false, req:false}, locationDetails:{show:false,req:false}, attendees:{show:false,req:false}, remarks:{show:true,req:false,label:'Remarks'} }, fieldOrder: ['overseas', 'time', 'remarks', 'attendees', 'location', 'repeat']},
{name: 'Local Leave', isEvent: false, isKahRelevant: false, fields: { location:{show:false, req:false}, locationDetails:{show:false,req:false}, attendees:{show:false,req:false}, remarks:{show:true,req:false,label:'Remarks'} }, fieldOrder: ['time', 'remarks', 'attendees', 'location', 'repeat', 'overseas']}
];
props.setProperty('typicalEventTypes', JSON.stringify(defaultTypes));
} else {
var existing = JSON.parse(typicalEventTypes);
var updated = false;
existing.forEach(function(t) {
if (t.name === 'Meeting') { t.name = 'Generic'; updated = true; }
if (t.defaultLoc === 'Office') { t.defaultLoc = 'In Camp'; updated = true; }
if (t.defaultLoc === 'Others') { t.defaultLoc = 'Out of Camp'; updated = true; }
if (!t.fields) {
t.fields = {
    location: {show: t.isEvent, req: t.isEvent},
    locationDetails: {show: t.isEvent, req: false},
    attendees: {show: t.isEvent || t.name === 'Official Trip', req: false},
    remarks: {show: true, req: t.name==='Generic', label: t.name==='Generic'?'Meeting Description':'Remarks'}
};
updated = true;
}
if (!t.fieldOrder) {
if (t.name === 'Official Trip' || t.name === 'Overseas Leave') {
    t.fieldOrder = ['overseas', 'time', 'remarks', 'attendees', 'location', 'repeat'];
} else {
    t.fieldOrder = ['time', 'location', 'attendees', 'remarks', 'repeat', 'overseas'];
}
updated = true;
}
if (typeof t.isKahRelevant === 'undefined') {
t.isKahRelevant = (t.name === 'Official Trip' || t.name === 'Overseas Leave');
updated = true;
}
});
if (updated) props.setProperty('typicalEventTypes', JSON.stringify(existing));
}

if (!props.getProperty('kahEmailSubject')) props.setProperty('kahEmailSubject', 'Leave Requires Approval: KAH Limit Crossed for {Unit}');
if (!props.getProperty('kahEmailBody')) props.setProperty('kahEmailBody', 'User {Name} applied for {EventType} but KAH limit was crossed for {Unit}.');

if (!props.getProperty('gcalTemplate')) props.setProperty('gcalTemplate', '{EventType} - {Name}, {Attendees}');
if (props.getProperty('agendaTemplate') === null) props.setProperty('agendaTemplate', '{EventType} - {Name} ({Department})');
if (props.getProperty('agendaDetailsTemplate') === null) props.setProperty('agendaDetailsTemplate', 'Start: {StartTime}\nEnd: {EndTime}\nLocation: {Location}\nAttendees: {Attendees}\nEvent Description: {EventDescription}');
if (props.getProperty('infoAllTemplate') === null) props.setProperty('infoAllTemplate', '{EventType} - {Name} ({Department})');
if (props.getProperty('infoAllDetailsTemplate') === null) props.setProperty('infoAllDetailsTemplate', 'Start: {StartTime}\nEnd: {EndTime}\nLocation: {Location}\nEvent Description: {EventDescription}');
if (!props.getProperty('contactNameFormat')) props.setProperty('contactNameFormat', '{Name} (Cloud Group : {Unit})');

if (!props.getProperty('acronyms')) props.setProperty('acronyms', JSON.stringify({}));
if (!props.getProperty('customKahGroups')) props.setProperty('customKahGroups', JSON.stringify([]));

if (!props.getProperty('userKeyword')) props.setProperty('userKeyword', 'peace');
if (!props.getProperty('appMode')) props.setProperty('appMode', 'combined');
if (!props.getProperty('companyStructure')) props.setProperty('companyStructure', JSON.stringify({}));

var dbId = props.getProperty('dbSheetId');
if (!dbId) {
var ss = SpreadsheetApp.create("Company_Leaves_DB");
var sheet = ss.getActiveSheet();
sheet.setName("Leaves");
sheet.appendRow(['ID', 'Timestamp', 'Phone', 'Name', 'Department', 'LeaveType', 'StartDate', 'EndDate', 'HalfDay', 'CoveringPerson', 'Country', 'State', 'Remarks', 'Status', 'EventIDs', 'Location', 'Attendees', 'InfoAll', 'IsAllDay', 'UntilDate', 'LocationDetails']);
props.setProperty('dbSheetId', ss.getId());
} else {
var ss = SpreadsheetApp.openById(dbId);
var mainSheet = ss.getSheetByName("Leaves") || ss.getSheets()[0];
verifySchema(mainSheet);
}
}

function verifySchema(sheet) {
var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
if (headers.indexOf('Location') === -1) { sheet.getRange(1, headers.length + 1).setValue('Location'); headers.push('Location'); }
if (headers.indexOf('Attendees') === -1) { sheet.getRange(1, headers.length + 1).setValue('Attendees'); headers.push('Attendees'); }
if (headers.indexOf('InfoAll') === -1) { sheet.getRange(1, headers.length + 1).setValue('InfoAll'); headers.push('InfoAll'); }
if (headers.indexOf('IsAllDay') === -1) { sheet.getRange(1, headers.length + 1).setValue('IsAllDay'); headers.push('IsAllDay'); }
if (headers.indexOf('UntilDate') === -1) { sheet.getRange(1, headers.length + 1).setValue('UntilDate'); headers.push('UntilDate'); }
if (headers.indexOf('LocationDetails') === -1) { sheet.getRange(1, headers.length + 1).setValue('LocationDetails'); headers.push('LocationDetails'); }
return headers;
}

function applyAcronyms(text, acronymsObj) {
if (!text || !acronymsObj) return text;
var result = text;

var acronymKeys = Object.keys(acronymsObj);

// Sort by length of full text descending to avoid partial replacements of nested words
acronymKeys.sort(function(a, b) {
var fullA = typeof acronymsObj[a] === 'object' ? (acronymsObj[a].full || "") : (acronymsObj[a] || "");
var fullB = typeof acronymsObj[b] === 'object' ? (acronymsObj[b].full || "") : (acronymsObj[b] || "");
return fullB.length - fullA.length;
});

for (var i = 0; i < acronymKeys.length; i++) {
var key = acronymKeys[i];
if (!key) continue;
var val = acronymsObj[key];
var full = typeof val === 'object' ? val.full : val;
var active = typeof val === 'object' ? val.active : true; 

if (!active || !full) continue;

var escapedFull = full.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Safe boundary application. Avoids regex breaking when full phrases contain punctuation.
var prefix = /^[\w\u00C0-\u017F]/.test(full) ? "\\b" : "";
var suffix = /[\w\u00C0-\u017F]$/.test(full) ? "\\b" : "";

var regex = new RegExp(prefix + escapedFull + suffix, "gi");
result = result.replace(regex, key);
}
return result;
}

function doPost(e) {
var lock = LockService.getScriptLock();
var payload = JSON.parse(e.postData.contents);
var action = payload.action;

var needsLock =['submitLeave', 'editLeave', 'cancelLeave', 'registerUser', 'updateUser', 'deleteUser', 'updateUserUnits', 'saveSettings', 'renameUnit', 'forceSyncContacts', 'backfillCustomCalendar', 'addCalendarAcl', 'removeCalendarAcl'].indexOf(action) !== -1;
if (needsLock) lock.waitLock(15000); 

try {
var data = payload.data || {};
var credentials = payload.credentials || {};
var responseData = {};

var secureActions =['getSettings', 'saveSettings', 'submitLeave', 'editLeave', 'cancelLeave', 'getLeaves', 'updateUser', 'deleteUser', 'updateUserUnits', 'renameUnit', 'forceSyncContacts', 'deleteCalendar', 'backfillCustomCalendar', 'getInitialData', 'getCalendarAcls', 'addCalendarAcl', 'removeCalendarAcl'];
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
else if (action === 'registerUser') responseData = registerUser(data);
else if (action === 'updateUser') responseData = updateUser(data);
else if (action === 'deleteUser') responseData = deleteUser(data);
else if (action === 'updateUserUnits') responseData = updateUserUnits(data);
else if (action === 'renameUnit') responseData = renameUnit(data);
else if (action === 'forceSyncContacts') responseData = forceSyncContacts(data);
else if (action === 'deleteCalendar') responseData = deleteCalendar(data);
else if (action === 'backfillCustomCalendar') responseData = backfillCustomCalendar(data);
else if (action === 'getCalendarAcls') responseData = getCalendarAcls(data);
else if (action === 'addCalendarAcl') responseData = addCalendarAcl(data);
else if (action === 'removeCalendarAcl') responseData = removeCalendarAcl(data);
else if (action === 'getInitialData') responseData = { settings: getSettings(data), leaves: getLeaves(data) };

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