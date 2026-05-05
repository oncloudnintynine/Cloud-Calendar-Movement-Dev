Code Review: Security, Performance, Optimization
335,930 tokens

Model 2:11 PM
ThinkingThoughts
Expand to view model thoughts

chevron_right
I have thoroughly reviewed your codebase. I fully understand the architecture: it is a serverless Progressive Web App (PWA) using Google Apps Script (GAS) as the backend router (doPost), Google Sheets as the database, Google Contacts (People API) as the authentication/user management system, and Google Calendar for event tracking. The frontend is built with Vanilla JS, Tailwind CSS, and bundled locally.
Overall, the architecture is quite creative—using Google Contacts as a source of truth for organizational structure and departments is a clever way to keep everything within the Google Workspace ecosystem.
However, there are several critical security vulnerabilities, massive performance bottlenecks, and frontend optimization opportunities that need to be addressed before deploying this to production.
Here is my senior-level review of the codebase.
1. Critical Security Vulnerability: Unauthenticated API Endpoints
File: backend/Code.js & backend/Leaves.js
The Issue:
Your doPost router checks the adminPassword for settings and user management, and handleLogin checks the phone/password combination. However, actions like submitLeave, editLeave, and cancelLeave do not validate the user's credentials.
The frontend api.js currently sends { action: 'submitLeave', data: { phone: user.phone, ... } }. A malicious actor (or someone inspecting the network tab) could easily send a POST request with someone else's phone number to submit or delete their leaves.
The Fix:
You must enforce authentication on every request. Since you don't have session tokens, pass the user's password (or a hashed version/session token) in every API call from the frontend and verify it in GAS before executing the action.
code
JavaScript
// In frontend/api.js
body: JSON.stringify({ action, data, credentials: { phone: user.phone, pass: user.pass } })

// In backend/Code.js (doPost)
if (['submitLeave', 'editLeave', 'cancelLeave', 'getLeaves'].includes(action)) {
    var authCheck = handleLogin({ password: payload.credentials.pass });
    if (authCheck.phone !== payload.credentials.phone) throw new Error("Unauthorized");
}
2. Critical Performance Bug: The "N+1 Query" Problem
File: backend/Leaves.js (in the getLeaves function)
The Issue:
Inside the getLeaves loop, you are doing two heavily expensive operations for every single row in the spreadsheet:
sheet.getRange(...).setValue(...) (to update departments/cancelled status).
CalendarApp.getCalendarById(...) and cal.getEventById(...) (to check if an event was deleted from Google Calendar).
Google Apps Script API calls take ~100ms - 300ms each. If you have 500 records in your database, getLeaves will make over 1,000 API calls sequentially. This will cause the script to quickly hit the 6-minute execution limit and crash, blocking users from seeing the dashboard.
The Fix:
Batch Sheet Writes: Never use .setValue() inside a loop. Modify the 2D array in memory, and then use sheet.getRange(2, 1, resultData.length, headers.length).setValues(resultData) at the very end.
Decouple Calendar Sync: Do not check CalendarApp synchronously when a user requests the dashboard. Instead, move the "event deletion check" to a separate GAS Time-Driven Trigger (e.g., running every 1 hour) that cleans up the sheet in the background.
3. API Quota Risk: Excessive Google Contacts Fetching
File: backend/Auth.js (getContactsAndGroups)
The Issue:
Every time a user logs in, fetches leaves, or updates settings, getContactsAndGroups() is executed. This makes pagination calls to People.People.Connections.list and People.ContactGroups.list. As your company scales, calling the People API this frequently will hit Google's strict read quotas (e.g., quota exceeded for API).
The Fix:
Use CacheService to cache the organizational structure and contacts for 15-30 minutes.
code
JavaScript
function getContactsAndGroups() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("contacts_groups");
  if (cached) return JSON.parse(cached);

  // ... run existing People API logic ...
  
  cache.put("contacts_groups", JSON.stringify(result), 1800); // cache for 30 minutes
  return result;
}
(Note: Be sure to invalidate/clear this cache inside registerUser and updateUserUnits).
4. Frontend Memory & Jank: Picker.js DOM Bloat
File: frontend/picker.js
The Issue:
Your infinite rolodex picker generates a massive amount of DOM elements.
code
JavaScript
const loops = 15;
For the year wheel (100 years for birthdays), 100 years * 15 loops = 1,500 <div> elements.
With 5 wheels (Day, Month, Year, Hour, Min), the modal generates around 4,500+ DOM nodes every time openPicker() is called. Mobile devices will experience heavy scroll jank and memory spikes.
The Fix:
Instead of brute-forcing the infinite scroll by multiplying the list 15 times, standard implementations use 3-5 loops and re-center the scroll position silently when the user hits the boundary (which you are already trying to do). Drop loops down to 3 or 5.
5. Minor Bugs & Logic Optimizations
Frontend / isEventOnDate Performance (calendar.js):
You are evaluating isEventOnDate repeatedly for every day of the calendar loop. For a 31-day month and 1000 leave records, that's 31,000 evaluations.
Optimization: Pre-filter the data array before the loop to only include events that overlap the current month's start and end dates.
KAH Limit Edge Case (backend/Leaves.js):
In checkKahLimit: (((overlappingKAHPhones.length) / totalKahInDept) * 100 > limit).
If a department has 0 KAH personnel registered, totalKahInDept is 0, leading to a Division by Zero (Infinity > limit -> evaluates to true). Ensure you check if (totalKahInDept === 0) return false;.
GAS Lock Service Scope (backend/Code.js):
lock.waitLock(15000); is applied globally to all doPost actions. This means if one user is fetching getLeaves, a completely different user cannot login until the lock is released.
Optimization: Only acquire the lock for action === 'submitLeave', editLeave, cancelLeave, and registerUser. Read-only actions (login, getLeaves, getSettings) should bypass the lock to ensure the app remains responsive.
Global Variables Context Leak (frontend/app.js):
In your frontend JS, you rely heavily on global variables (user, allLeaves, companyContacts, etc.) without explicit window. declarations or closures. While JS allows this, it makes the code brittle. Consider encapsulating app state into a single global state object.
Summary of Next Steps
If you plan to ship this soon, prioritize Issue #1 (Security) and Issue #2 (N+1 Sheet/Calendar API loop). Without those fixed, users can alter each other's data, and the dashboard will inevitably crash due to GAS execution timeouts.
Let me know if you would like me to rewrite any specific modules (e.g., the batched getLeaves logic or the authenticated doPost router) to apply these fixes!
Model 4:20 PM
ThinkingThoughts
Expand to view model thoughts

chevron_right
Here is the first batch of updates addressing the Critical Security Vulnerabilities, Performance Bottlenecks (N+1 queries & Quota risks), and the DOM Bloat in picker.js.
This batch updates backend/Code.js, backend/Auth.js, backend/Leaves.js, backend/Settings.js, frontend/api.js, and frontend/picker.js.
Batch 1: Backend Security, Performance Optimization & Picker Fixes
code
JavaScript
#####*****
backend/Code.js
#####*****
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