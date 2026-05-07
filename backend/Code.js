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
 if (!props.getProperty('kahCustomGroups')) props.setProperty('kahCustomGroups', JSON.stringify([]));
 if (!props.getProperty('menuOrder')) props.setProperty('menuOrder', JSON.stringify(['dashboard', 'parade-state', 'my-leaves', 'submit-leave', 'submit-event', 'submit-combined']));
 if (!props.getProperty('adminSectionsOrder')) props.setProperty('adminSectionsOrder', JSON.stringify(['app-mode', 'form-mode', 'register-user', 'manage-users', 'admin-pass', 'user-keyword', 'menu-order', 'event-types', 'display-templates', 'code-backup']));
 
 if (!props.getProperty('kahEmailSubject')) props.setProperty('kahEmailSubject', 'Leave Requires Approval: KAH Limit Crossed for {Unit}');
 if (!props.getProperty('kahEmailBody')) props.setProperty('kahEmailBody', 'User {Name} applied for {LeaveType} but KAH limit was crossed for {Unit}.\n\nRemarks: {Remarks}');
 
 if (!props.getProperty('userKeyword')) props.setProperty('userKeyword', 'peace');
 if (!props.getProperty('appMode')) props.setProperty('appMode', 'separated');
 if (!props.getProperty('formMode')) props.setProperty('formMode', 'separated');
 if (!props.getProperty('companyStructure')) props.setProperty('companyStructure', JSON.stringify({}));
 
 // Default Event Types (Merging old Leave Types)
 if (!props.getProperty('eventTypes')) {
    props.setProperty('eventTypes', JSON.stringify([
      { name: 'Meeting', style: 'event', isKAH: false, reqCountry: false },
      { name: 'Others', style: 'event', isKAH: false, reqCountry: false },
      { name: 'Official Trip', style: 'leave', isKAH: true, reqCountry: true },
      { name: 'Overseas Leave', style: 'leave', isKAH: true, reqCountry: true },
      { name: 'Local Leave', style: 'leave', isKAH: false, reqCountry: false }
    ]));
 }

 // Default Templates
 if (!props.getProperty('displayTemplates')) {
    props.setProperty('displayTemplates', JSON.stringify({
       gcalLeaveTitle: '{Type} - {Name} {HalfDay}',
       gcalEventTitle: '{Type} - {Name}, {Attendees} {HalfDay}',
       agendaLeaveTitle: '{Name} ({Dept})',
       agendaEventTitle: '{Type}'
    }));
 }
 
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
 
 var needsLock =['submitLeave', 'editLeave', 'cancelLeave', 'registerUser', 'updateUser', 'deleteUser', 'updateUserUnits', 'saveSettings'].indexOf(action) !== -1;
 if (needsLock) lock.waitLock(15000); 
 
 try {
   var data = payload.data || {};
   var credentials = payload.credentials || {};
   var responseData = {};

   // SECURITY: Enforce API authentication for sensitive endpoints
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

// ==========================================
// Settings.js - Admin Settings Logic
// ==========================================

function getSettings(data) {
 var props = PropertiesService.getScriptProperties();

 var cg = getContactsAndGroups();
 var allContacts =[];
 var phoneToDepts = {};

 cg.connections.forEach(function(person) {
   var phone = (person.phoneNumbers && person.phoneNumbers.length > 0) ? person.phoneNumbers[0].value.replace(/\D/g, '').slice(-8) : "";
   if (phone && person.names && person.names.length > 0) {
     var name = cleanName(person.names[0].displayName);
     if (person.memberships) {
       var depts =[];
       person.memberships.forEach(function(m) {
         if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
           var gName = cg.groupMap[m.contactGroupMembership.contactGroupResourceName];
           if (gName) depts.push(gName);
         }
       });
       if (depts.length > 0) {
         var deptsStr = depts.join(',');
         phoneToDepts[phone] = deptsStr;
         
         var bdayStr = "";
         if (person.birthdays && person.birthdays.length > 0 && person.birthdays[0].date) {
           var d = person.birthdays[0].date;
           if (d.year && d.month && d.day) {
             bdayStr = d.year + "-" + ('0' + d.month).slice(-2) + "-" + ('0' + d.day).slice(-2);
           }
         }
         
         allContacts.push({ name: name, phone: phone, dept: deptsStr, resourceName: person.resourceName, birthday: bdayStr });
       }
     }
   }
 });

 var rawKahList = JSON.parse(props.getProperty('kahList') || "[]");
 var syncedKahList = rawKahList.map(function(k) {
   if (phoneToDepts[k.phone] && phoneToDepts[k.phone] !== k.dept) {
     k.dept = phoneToDepts[k.phone];
   }
   return k;
 });
 props.setProperty('kahList', JSON.stringify(syncedKahList));

 return {
   kahLimit: props.getProperty('kahLimit'),
   eventTypes: JSON.parse(props.getProperty('eventTypes') || "[]"),
   approvingAuthority: props.getProperty('approvingAuthority'),
   kahList: syncedKahList,
   kahCustomGroups: JSON.parse(props.getProperty('kahCustomGroups') || "[]"),
   kahEmailSubject: props.getProperty('kahEmailSubject') || "Leave Requires Approval: KAH Limit Crossed for {Unit}",
   kahEmailBody: props.getProperty('kahEmailBody') || "User {Name} applied for {LeaveType} but KAH limit was crossed for {Unit}.\n\nRemarks: {Remarks}",
   menuOrder: JSON.parse(props.getProperty('menuOrder') || 'null'),
   adminSectionsOrder: JSON.parse(props.getProperty('adminSectionsOrder') || "null"),
   displayTemplates: JSON.parse(props.getProperty('displayTemplates') || "{}"),
   githubRepo: props.getProperty('githubRepo') || '',
   backupFolder: props.getProperty('backupFolder') || '',
   userKeyword: props.getProperty('userKeyword') || 'peace',
   appMode: props.getProperty('appMode') || 'separated',
   formMode: props.getProperty('formMode') || 'separated',
   companyStructure: JSON.parse(props.getProperty('companyStructure') || "{}"),
   allContacts: allContacts
 };
}

function saveSettings(data) {
 if (data._userRole !== 'admin') throw new Error("Unauthorized");
 var props = PropertiesService.getScriptProperties();
 
 var triggerKahRecalc = false;
 
 if (data.newAdminPass) props.setProperty('adminPassword', data.newAdminPass);
 if (data.kahLimit !== undefined) {
     props.setProperty('kahLimit', data.kahLimit.toString());
     triggerKahRecalc = true;
 }
 if (data.eventTypes !== undefined) props.setProperty('eventTypes', JSON.stringify(data.eventTypes));
 if (data.approvingAuthority !== undefined) props.setProperty('approvingAuthority', data.approvingAuthority);
 if (data.kahList !== undefined) {
     props.setProperty('kahList', JSON.stringify(data.kahList));
     triggerKahRecalc = true;
 }
 if (data.kahCustomGroups !== undefined) {
     props.setProperty('kahCustomGroups', JSON.stringify(data.kahCustomGroups));
     triggerKahRecalc = true;
 }
 if (data.kahEmailSubject !== undefined) props.setProperty('kahEmailSubject', data.kahEmailSubject);
 if (data.kahEmailBody !== undefined) props.setProperty('kahEmailBody', data.kahEmailBody);
 if (data.displayTemplates !== undefined) props.setProperty('displayTemplates', JSON.stringify(data.displayTemplates));
 if (data.userKeyword !== undefined) props.setProperty('userKeyword', data.userKeyword);
 if (data.appMode !== undefined) props.setProperty('appMode', data.appMode);
 if (data.formMode !== undefined) props.setProperty('formMode', data.formMode);
 if (data.companyStructure !== undefined) props.setProperty('companyStructure', JSON.stringify(data.companyStructure));
 if (data.menuOrder !== undefined) props.setProperty('menuOrder', JSON.stringify(data.menuOrder));
 if (data.adminSectionsOrder !== undefined) props.setProperty('adminSectionsOrder', JSON.stringify(data.adminSectionsOrder));
 if (data.githubRepo !== undefined) props.setProperty('githubRepo', data.githubRepo);
 if (data.backupFolder !== undefined) props.setProperty('backupFolder', data.backupFolder);
 
 if (triggerKahRecalc && typeof recalculateAllKahStatuses === 'function') {
     recalculateAllKahStatuses(props);
 }
 
 return { updated: true };
}

function deleteUser(data) {
 if (data._userRole !== 'admin') throw new Error("Unauthorized");
 if (!data.resourceName) throw new Error("Missing contact identifier.");
 try {
   People.People.deleteContact(data.resourceName);
   invalidateContactsCache();
 } catch(e) { throw new Error("Failed to delete user: " + e.message); }
 return { success: true };
}

function updateUserUnits(data) {
 if (data._userRole !== 'admin') throw new Error("Unauthorized");
 var cg = getContactsAndGroups();
 
 for (var resName in data.changes) {
   var newUnit = data.changes[resName];
   var targetGroupId = null;
   
   if (newUnit !== "UNASSIGNED") {
     for (var grpRes in cg.groupMap) {
       if (cg.groupMap[grpRes].toUpperCase() === newUnit.toUpperCase()) {
         targetGroupId = grpRes; break;
       }
     }
     if (!targetGroupId) {
       var newGroup = People.ContactGroups.create({ contactGroup: { name: newUnit } });
       targetGroupId = newGroup.resourceName;
       cg.groupMap[targetGroupId] = newUnit;
     }
   }

   var contact = People.People.get(resName, { personFields: 'names,memberships' });
   var currentGroupIds =[];
   if (contact.memberships) {
     contact.memberships.forEach(function(m) {
       if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
         currentGroupIds.push(m.contactGroupMembership.contactGroupResourceName);
       }
     });
   }

   var toRemove = currentGroupIds.filter(function(id) { return id !== targetGroupId && cg.groupMap[id]; });
   var toAdd = targetGroupId && currentGroupIds.indexOf(targetGroupId) === -1 ?[resName] :[];

   if (toAdd.length > 0) People.ContactGroups.Members.modify({ resourceNamesToAdd: toAdd }, targetGroupId);
   if (toRemove.length > 0) {
     toRemove.forEach(function(gId) { People.ContactGroups.Members.modify({ resourceNamesToRemove:[resName] }, gId); });
   }
   
   if (contact.names && contact.names.length > 0) {
      var nameObj = contact.names[0];
      var cleanName = (nameObj.displayName || nameObj.givenName || "").replace(/\s*\(.*?\)\s*/g, '').trim();
      nameObj.givenName = newUnit !== "UNASSIGNED" ? cleanName + " (Cloud Group : " + newUnit + ")" : cleanName;
      contact.names =[nameObj];
      try { People.People.updateContact(contact, resName, { updatePersonFields: 'names' }); } catch(e) {}
   }
 }
 invalidateContactsCache();
 return { success: true };
}
