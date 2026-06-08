// ==========================================
// Settings.js - Admin Settings Logic 
// ==========================================

function getSettings(data) {
var props = PropertiesService.getScriptProperties();

var cg = getContactsAndGroups();
var allContacts =[];
var phoneToDepts = {};
var format = getContactNameFormat();

cg.connections.forEach(function(person) {
var phone = (person.phoneNumbers && person.phoneNumbers.length > 0) ? person.phoneNumbers[0].value.replace(/\D/g, '').slice(-8) : "";
if (phone && person.names && person.names.length > 0) {
var name = extractName(person.names[0].displayName, format);
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

var response = {
kahLimit: props.getProperty('kahLimit'),
approvingAuthority: props.getProperty('approvingAuthority'),
kahList: syncedKahList,
kahEmailSubject: props.getProperty('kahEmailSubject') || "Leave Requires Approval: KAH Limit Crossed for {Unit}",
kahEmailBody: props.getProperty('kahEmailBody') || "User {Name} applied for {EventType} but KAH limit was crossed for {Unit}.",

typicalEventTypes: JSON.parse(props.getProperty('typicalEventTypes') || "[]"),
gcalTemplate: props.getProperty('gcalTemplate') || '{EventType} - {Name}, {Attendees}',
agendaTemplate: props.getProperty('agendaTemplate') !== null ? props.getProperty('agendaTemplate') : '{EventType} - {Name} ({Department})',
agendaDetailsTemplate: props.getProperty('agendaDetailsTemplate') !== null ? props.getProperty('agendaDetailsTemplate') : 'Start: {StartTime}\nEnd: {EndTime}\nLocation: {Location}\nAttendees: {Attendees}\nEvent Description: {EventDescription}',
infoAllTemplate: props.getProperty('infoAllTemplate') !== null ? props.getProperty('infoAllTemplate') : '{EventType} - {Name} ({Department})',
infoAllDetailsTemplate: props.getProperty('infoAllDetailsTemplate') !== null ? props.getProperty('infoAllDetailsTemplate') : 'Start: {StartTime}\nEnd: {EndTime}\nLocation: {Location}\nEvent Description: {EventDescription}',
contactNameFormat: props.getProperty('contactNameFormat') || '{Name} (Cloud Group : {Unit})',

acronyms: JSON.parse(props.getProperty('acronyms') || "{}"),
customKahGroups: JSON.parse(props.getProperty('customKahGroups') || "[]"),

landingPage: props.getProperty('landingPage') || 'dashboard',
dashboardDeptOrder: JSON.parse(props.getProperty('dashboardDeptOrder') || "[]"),
menuOrder: JSON.parse(props.getProperty('menuOrder') || 'null'),
adminSectionsOrder: JSON.parse(props.getProperty('adminSectionsOrder') || "null"),
userKeyword: props.getProperty('userKeyword') || 'peace',
appMode: props.getProperty('appMode') || 'combined',
companyStructure: JSON.parse(props.getProperty('companyStructure') || "{}"),
allContacts: allContacts
};

if (data._userRole === 'admin') {
response.oauthClientId = props.getProperty('oauthClientId') || '';
var linked = props.getProperty('oauthLinkedAccounts');
response.linkedAccounts = linked ? JSON.parse(linked) : [];
}

return response;
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
if (data.approvingAuthority !== undefined) props.setProperty('approvingAuthority', data.approvingAuthority);
if (data.kahList !== undefined) {
props.setProperty('kahList', JSON.stringify(data.kahList));
triggerKahRecalc = true;
}
if (data.kahEmailSubject !== undefined) props.setProperty('kahEmailSubject', data.kahEmailSubject);
if (data.kahEmailBody !== undefined) props.setProperty('kahEmailBody', data.kahEmailBody);

if (data.typicalEventTypes !== undefined) props.setProperty('typicalEventTypes', JSON.stringify(data.typicalEventTypes));
if (data.gcalTemplate !== undefined) props.setProperty('gcalTemplate', data.gcalTemplate);
if (data.agendaTemplate !== undefined) props.setProperty('agendaTemplate', data.agendaTemplate);
if (data.agendaDetailsTemplate !== undefined) props.setProperty('agendaDetailsTemplate', data.agendaDetailsTemplate);
if (data.infoAllTemplate !== undefined) props.setProperty('infoAllTemplate', data.infoAllTemplate);
if (data.infoAllDetailsTemplate !== undefined) props.setProperty('infoAllDetailsTemplate', data.infoAllDetailsTemplate);

if (data.contactNameFormat !== undefined) {
var oldFormat = props.getProperty('contactNameFormat') || '{Name} (Cloud Group : {Unit})';
if (data.contactNameFormat !== oldFormat) {
  props.setProperty('contactNameFormat', data.contactNameFormat);
  var cg = getContactsAndGroups();
  var batchChanges = [];
  
  cg.connections.forEach(function(person) {
      var phone = (person.phoneNumbers && person.phoneNumbers.length > 0) ? person.phoneNumbers[0].value.replace(/\D/g, '').slice(-8) : "";
      if (phone && person.names && person.names.length > 0) {
          var baseName = extractName(person.names[0].displayName, oldFormat);
          var depts = [];
          if (person.memberships) {
              person.memberships.forEach(function(m) {
                  if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
                      var gName = cg.groupMap[m.contactGroupMembership.contactGroupResourceName];
                      if (gName) depts.push(gName);
                  }
              });
          }
          var primaryUnit = depts.length > 0 ? depts[0] : "UNASSIGNED";
          if (primaryUnit !== "UNASSIGNED") {
              person.names = [{ givenName: formatContactName(baseName, primaryUnit, data.contactNameFormat) }];
              try { People.People.updateContact(person, person.resourceName, { updatePersonFields: 'names' }); } catch(e) {}
              
              // Only push to sync if names actually change
              batchChanges.push({ fullName: baseName, unit: primaryUnit, mobile: phone });
          }
      }
  });
  invalidateContactsCache();

  // Queue updates for all modified contacts sequentially to avoid queue size overflow
  if (typeof enqueueSyncTask === 'function' && batchChanges.length > 0) {
      batchChanges.forEach(function(cData) {
          enqueueSyncTask('UPDATE_USER', cData);
      });
  }
}
}

if (data.acronyms !== undefined) props.setProperty('acronyms', JSON.stringify(data.acronyms));
if (data.customKahGroups !== undefined) props.setProperty('customKahGroups', JSON.stringify(data.customKahGroups));

if (data.landingPage !== undefined) props.setProperty('landingPage', data.landingPage);
if (data.dashboardDeptOrder !== undefined) props.setProperty('dashboardDeptOrder', JSON.stringify(data.dashboardDeptOrder));
if (data.userKeyword !== undefined) props.setProperty('userKeyword', data.userKeyword);
if (data.appMode !== undefined) props.setProperty('appMode', data.appMode);
if (data.companyStructure !== undefined) props.setProperty('companyStructure', JSON.stringify(data.companyStructure));
if (data.menuOrder !== undefined) props.setProperty('menuOrder', JSON.stringify(data.menuOrder));
if (data.adminSectionsOrder !== undefined) props.setProperty('adminSectionsOrder', JSON.stringify(data.adminSectionsOrder));

if (triggerKahRecalc && typeof recalculateAllKahStatuses === 'function') {
recalculateAllKahStatuses(props);
}

return { updated: true };
}

function deleteUser(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
if (!data.resourceName) throw new Error("Missing contact identifier.");
try {
// Need to lookup phone number before deleting so we can push sync
var targetContact = People.People.get(data.resourceName, { personFields: 'phoneNumbers' });
var phone = (targetContact.phoneNumbers && targetContact.phoneNumbers.length > 0) ? targetContact.phoneNumbers[0].value : "";

People.People.deleteContact(data.resourceName);
invalidateContactsCache();

if (phone && typeof enqueueSyncTask === 'function') {
  enqueueSyncTask('DELETE_USER', { mobile: phone });
}
} catch(e) { throw new Error("Failed to delete user: " + e.message); }
return { success: true };
}

function updateUserUnits(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var cg = getContactsAndGroups();

var syncQueuePayload = [];

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

var contact = People.People.get(resName, { personFields: 'names,memberships,phoneNumbers' });
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
var cleanNm = extractName(nameObj.displayName || nameObj.givenName || "");
contact.names = [{ givenName: newUnit !== "UNASSIGNED" ? formatContactName(cleanNm, newUnit) : cleanNm }];
try { People.People.updateContact(contact, resName, { updatePersonFields: 'names' }); } catch(e) {}

var phone = (contact.phoneNumbers && contact.phoneNumbers.length > 0) ? contact.phoneNumbers[0].value : "";
if (phone) {
  syncQueuePayload.push({ fullName: cleanNm, unit: newUnit, mobile: phone });
}
}
}
invalidateContactsCache();

if (typeof enqueueSyncTask === 'function') {
syncQueuePayload.forEach(function(p) {
  enqueueSyncTask('UPDATE_USER', p);
});
}

return { success: true };
}

function renameUnit(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var oldName = data.oldName.trim();
var newName = data.newName.trim().toUpperCase();
if (!oldName || !newName || oldName === newName) return { success: true };

var props = PropertiesService.getScriptProperties();

// 1. Update companyStructure
var structArr = JSON.parse(props.getProperty('companyStructure') || "[]");
if (!Array.isArray(structArr)) structArr = Object.keys(structArr);
var newStructArr = structArr.map(function(path) {
if (path === oldName) return newName;
if (path.startsWith(oldName + '-')) return newName + path.substring(oldName.length);
return path;
});
props.setProperty('companyStructure', JSON.stringify(newStructArr));

// 2. Google Contacts - Dynamic Group Migration
var cg = getContactsAndGroups();
var oldGroupId = null;
var newGroupId = null;

for (var grpRes in cg.groupMap) {
if (cg.groupMap[grpRes].toUpperCase() === oldName.toUpperCase()) oldGroupId = grpRes;
if (cg.groupMap[grpRes].toUpperCase() === newName) newGroupId = grpRes;
}

if (!newGroupId) {
var newGroup = People.ContactGroups.create({ contactGroup: { name: newName } });
newGroupId = newGroup.resourceName;
cg.groupMap[newGroupId] = newName;
}

var contactsToMove =[];
cg.connections.forEach(function(contact) {
var inOldGroup = false;
if (contact.memberships) {
   contact.memberships.forEach(function(m) {
       if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName === oldGroupId) inOldGroup = true;
   });
}

if (inOldGroup) {
   contactsToMove.push(contact.resourceName);
   if (contact.names && contact.names.length > 0) {
       var nameObj = contact.names[0];
       var clean = extractName(nameObj.displayName || nameObj.givenName || "");
       contact.names = [{ givenName: formatContactName(clean, newName) }];
       try { People.People.updateContact(contact, contact.resourceName, { updatePersonFields: 'names' }); } catch(e) {}
   }
}
});

if (contactsToMove.length > 0) {
try { People.ContactGroups.Members.modify({ resourceNamesToAdd: contactsToMove }, newGroupId); } catch(e) {}
if (oldGroupId) {
   try { People.ContactGroups.Members.modify({ resourceNamesToRemove: contactsToMove }, oldGroupId); } catch(e) {}
}
}

if (oldGroupId && oldGroupId !== newGroupId) {
try { People.ContactGroups.delete(oldGroupId, { deleteContacts: false }); } catch(e) {}
}

// 3. Update Calendar Name
var cals = CalendarApp.getCalendarsByName(oldName);
if (cals.length > 0) {
try { cals[0].setName(newName); } catch(e) {}
}

// 4. Update Database Sheet (Department column)
var sheetId = props.getProperty('dbSheetId');
if (sheetId) {
var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
var dataRange = sheet.getDataRange();
var values = dataRange.getValues();
var headers = values[0];
var deptIdx = headers.indexOf('Department');
if (deptIdx !== -1) {
   for (var i = 1; i < values.length; i++) {
       var depts = (values[i][deptIdx] || "").split(',');
       var changed = false;
       for (var d = 0; d < depts.length; d++) {
           if (depts[d].trim().toUpperCase() === oldName.toUpperCase()) {
               depts[d] = newName; 
               changed = true;
           }
       }
       if (changed) {
           sheet.getRange(i + 1, deptIdx + 1).setValue(depts.join(','));
       }
   }
}
}

invalidateContactsCache();

if (typeof enqueueSyncTask === 'function') {
enqueueSyncTask('RENAME_UNIT', { oldName: oldName, newName: newName });
}

return { success: true };
}

function forceSyncContacts(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var cg = getContactsAndGroups();
var structure = data.structure ||[]; 
var frontendContacts = data.contacts ||[]; 

var structureGroupIds = {};
structure.forEach(function(unit) {
var foundId = null;
for (var grpRes in cg.groupMap) {
   if (cg.groupMap[grpRes].toUpperCase() === unit.toUpperCase()) {
       foundId = grpRes; break;
   }
}
if (!foundId) {
   var newGroup = People.ContactGroups.create({ contactGroup: { name: unit } });
   foundId = newGroup.resourceName;
   cg.groupMap[foundId] = unit;
}
structureGroupIds[unit.toUpperCase()] = foundId;
});

frontendContacts.forEach(function(fc) {
var contact;
try {
   contact = People.People.get(fc.resourceName, { personFields: 'names,memberships' });
} catch(e) { return; } 

var targetUnit = (fc.unit || "UNASSIGNED").toUpperCase();
var targetGroupId = structureGroupIds[targetUnit] || null;

var currentGroupIds =[];
if (contact.memberships) {
   contact.memberships.forEach(function(m) {
       if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
           currentGroupIds.push(m.contactGroupMembership.contactGroupResourceName);
       }
   });
}

var toRemove = currentGroupIds.filter(function(id) { 
   return id !== targetGroupId && cg.groupMap[id]; 
});

var toAdd = targetGroupId && currentGroupIds.indexOf(targetGroupId) === -1 ? [fc.resourceName] :[];

if (toAdd.length > 0) {
   try { People.ContactGroups.Members.modify({ resourceNamesToAdd: toAdd }, targetGroupId); } catch(e) {}
}
if (toRemove.length > 0) {
   toRemove.forEach(function(gId) { 
       try { People.ContactGroups.Members.modify({ resourceNamesToRemove: [fc.resourceName] }, gId); } catch(e) {}
   });
}

if (contact.names && contact.names.length > 0) {
   var nameObj = contact.names[0];
   var cleanNm = extractName(fc.name || nameObj.displayName || nameObj.givenName || "");
   contact.names = [{ givenName: targetUnit !== "UNASSIGNED" ? formatContactName(cleanNm, targetUnit) : cleanNm }];
   try { People.People.updateContact(contact, fc.resourceName, { updatePersonFields: 'names' }); } catch(e) {}
}
});

invalidateContactsCache();

if (typeof enqueueSyncTask === 'function') {
// Since the frontend payload might only contain resourceNames, we need to inject the phone numbers for the external sync engine to locate them.
var enhancedContacts = [];
frontendContacts.forEach(function(fc) {
  try {
      var contact = People.People.get(fc.resourceName, { personFields: 'phoneNumbers' });
      var phone = (contact.phoneNumbers && contact.phoneNumbers.length > 0) ? contact.phoneNumbers[0].value : "";
      if (phone) {
          enhancedContacts.push({ name: fc.name, unit: fc.unit, phone: phone });
      }
  } catch(e) {}
});

enqueueSyncTask('FORCE_SYNC', { structure: structure, contacts: enhancedContacts });
}

return { success: true };
}