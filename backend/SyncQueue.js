// ==========================================
// SyncQueue.js - Background Processing Engine
// ==========================================

function setupBackgroundSyncTrigger() {
var triggers = ScriptApp.getProjectTriggers();
for (var i = 0; i < triggers.length; i++) {
  if (triggers[i].getHandlerFunction() === 'processSyncQueueBg') {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}
ScriptApp.newTrigger('processSyncQueueBg').timeBased().everyMinutes(5).create();
}

function enqueueSyncTask(action, payload) {
var props = PropertiesService.getScriptProperties();
var accountsStr = props.getProperty('oauthLinkedAccounts');
if (!accountsStr || JSON.parse(accountsStr).length === 0) return; // No targets linked, skip queue

var dbId = props.getProperty('dbSheetId');
if (!dbId) return;

try {
  var ss = SpreadsheetApp.openById(dbId);
  var queueSheet = ss.getSheetByName('Company_Sync_Queue');
  if (queueSheet) {
    queueSheet.appendRow([new Date().toISOString(), action, JSON.stringify(payload), 'PENDING', 0]);
  }
} catch(e) {
  console.error("Failed to enqueue sync task: " + e.message);
}
}

function processSyncQueueBg() {
var lock = LockService.getScriptLock();
if (!lock.tryLock(10000)) return; // Prevent concurrent queue processing

var props = PropertiesService.getScriptProperties();
var dbId = props.getProperty('dbSheetId');
if (!dbId) { lock.releaseLock(); return; }

var ss = SpreadsheetApp.openById(dbId);
var queueSheet = ss.getSheetByName('Company_Sync_Queue');
if (!queueSheet) { lock.releaseLock(); return; }

var lastRow = queueSheet.getLastRow();
if (lastRow <= 1) { lock.releaseLock(); return; }

var dataRange = queueSheet.getRange(2, 1, lastRow - 1, 5);
var rows = dataRange.getValues();
var accounts = getLinkedAccounts();
if (accounts.length === 0) {
  // If accounts were unlinked but tasks remain, clear them out
  queueSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  lock.releaseLock();
  return;
}

var modified = false;

for (var i = 0; i < rows.length; i++) {
  var status = rows[i][3];
  var retries = rows[i][4];
  
  if (status !== 'PENDING') continue;
  if (retries >= 3) {
      rows[i][3] = 'FAILED';
      modified = true;
      continue;
  }
  
  var action = rows[i][1];
  var payload;
  try { payload = JSON.parse(rows[i][2]); } catch(e) { rows[i][3] = 'FAILED'; modified = true; continue; }
  
  var allAccountsSucceeded = true;
  
  for (var j = 0; j < accounts.length; j++) {
      var email = accounts[j];
      var service = getOAuthService(email);
      if (!service.hasAccess()) {
          console.error("OAuth token expired or revoked for " + email);
          continue; // Skip this account but keep trying others
      }
      
      try {
          if (action === 'REGISTER_USER') {
              pushRegisterUserToAccount(service, payload);
          } else if (action === 'UPDATE_USER') {
              pushUpdateUserToAccount(service, payload);
          } else if (action === 'DELETE_USER') {
              pushDeleteUserToAccount(service, payload);
          } else if (action === 'FORCE_SYNC') {
              pushForceSyncToAccount(service, payload);
          } else if (action === 'RENAME_UNIT') {
              pushRenameUnitToAccount(service, payload);
          }
      } catch (e) {
          console.error("Sync error for account " + email + ": " + e.message);
          allAccountsSucceeded = false;
      }
  }
  
  if (allAccountsSucceeded) {
      rows[i][3] = 'COMPLETED';
  } else {
      rows[i][4] = retries + 1;
      if (rows[i][4] >= 3) rows[i][3] = 'FAILED';
  }
  modified = true;
}

if (modified) {
  dataRange.setValues(rows);
  
  // Cleanup completed/failed tasks older than 7 days
  var now = new Date().getTime();
  for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i][3] === 'COMPLETED' || rows[i][3] === 'FAILED') {
          var taskTime = new Date(rows[i][0]).getTime();
          if (now - taskTime > 7 * 24 * 60 * 60 * 1000) {
              queueSheet.deleteRow(i + 2);
          }
      }
  }
}

lock.releaseLock();
}

// ---------------------------------------------------------
// External Account Sync Logic (Using OAuth Token)
// ---------------------------------------------------------

function fetchExternalContactsAndGroups(service) {
var groupMap = {};
var groupsRes = JSON.parse(urlFetchWithRetry('https://people.googleapis.com/v1/contactGroups?groupFields=name,groupType&pageSize=1000', service));

if (groupsRes.contactGroups) {
  groupsRes.contactGroups.forEach(function(g) {
    var groupName = g.name || g.formattedName;
    if (g.groupType === 'USER_CONTACT_GROUP' && groupName !== "DSTA Contacts") {
      groupMap[g.resourceName] = groupName;
    }
  });
}

var connections = [];
var pageToken = null;
do {
  var url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,memberships,birthdays&pageSize=1000';
  if (pageToken) url += '&pageToken=' + encodeURIComponent(pageToken);
  var res = JSON.parse(urlFetchWithRetry(url, service));
  if (res.connections) connections = connections.concat(res.connections);
  pageToken = res.nextPageToken;
} while (pageToken);

return { groupMap: groupMap, connections: connections };
}

function findExternalContactByPhone(extData, targetPhoneDigits) {
for (var i = 0; i < extData.connections.length; i++) {
  var person = extData.connections[i];
  if (person.phoneNumbers) {
    for (var j = 0; j < person.phoneNumbers.length; j++) {
      var phoneObj = person.phoneNumbers[j];
      if (phoneObj.value && phoneObj.value.replace(/\D/g, '').slice(-8) === targetPhoneDigits) {
        return person;
      }
    }
  }
}
return null;
}

function getExternalGroupId(extData, service, unitName) {
for (var grpRes in extData.groupMap) {
  if (extData.groupMap[grpRes].toUpperCase() === unitName.toUpperCase()) {
    return grpRes;
  }
}
var payload = { contactGroup: { name: unitName } };
var newGroup = JSON.parse(urlFetchWithRetry('https://people.googleapis.com/v1/contactGroups', service, 'POST', payload));
return newGroup.resourceName;
}

function modifyExternalGroupMembers(service, resourceNamesToAdd, resourceNamesToRemove, targetGroupId) {
var payload = {};
if (resourceNamesToAdd && resourceNamesToAdd.length > 0) payload.resourceNamesToAdd = resourceNamesToAdd;
if (resourceNamesToRemove && resourceNamesToRemove.length > 0) payload.resourceNamesToRemove = resourceNamesToRemove;

if (Object.keys(payload).length > 0) {
  urlFetchWithRetry('https://people.googleapis.com/v1/' + targetGroupId + '/members:modify', service, 'POST', payload);
}
}

// ---------------------------------------------------------
// Translators
// ---------------------------------------------------------

function pushRegisterUserToAccount(service, payload) {
var extData = fetchExternalContactsAndGroups(service);
var targetDigits = payload.mobile.replace(/\D/g, '').slice(-8);

if (findExternalContactByPhone(extData, targetDigits)) return; // Already exists in target

var contactPayload = {
  names: [{ givenName: formatContactName(payload.fullName, payload.unit) }],
  phoneNumbers: [{ value: payload.mobile, type: "mobile" }]
};

if (payload.birthday) {
  var parts = payload.birthday.split('-');
  contactPayload.birthdays = [{
    date: { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) }
  }];
}

var newContact = JSON.parse(urlFetchWithRetry('https://people.googleapis.com/v1/people:createContact', service, 'POST', contactPayload));
var resourceName = newContact.resourceName;

var targetGroupId = getExternalGroupId(extData, service, payload.unit);
modifyExternalGroupMembers(service, [resourceName], [], targetGroupId);
}

function pushUpdateUserToAccount(service, payload) {
var extData = fetchExternalContactsAndGroups(service);
var targetDigits = payload.mobile.replace(/\D/g, '').slice(-8);
var contact = findExternalContactByPhone(extData, targetDigits);

if (!contact) {
  // If they don't exist in target, create them
  pushRegisterUserToAccount(service, payload);
  return;
}

contact.names = [{ givenName: formatContactName(payload.fullName, payload.unit) }];
contact.phoneNumbers = [{ value: payload.mobile, type: "mobile" }];

if (payload.birthday) {
  var parts = payload.birthday.split('-');
  contact.birthdays = [{
    date: { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) }
  }];
} else {
  contact.birthdays = []; 
}

urlFetchWithRetry('https://people.googleapis.com/v1/' + contact.resourceName + ':updateContact?updatePersonFields=names,phoneNumbers,birthdays', service, 'PATCH', contact);

var targetGroupId = getExternalGroupId(extData, service, payload.unit);

var currentGroupIds = [];
if (contact.memberships) {
  contact.memberships.forEach(function(m) {
    if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
      if (extData.groupMap[m.contactGroupMembership.contactGroupResourceName]) {
        currentGroupIds.push(m.contactGroupMembership.contactGroupResourceName);
      }
    }
  });
}

var toRemove = currentGroupIds.filter(function(id) { return id !== targetGroupId; });
var toAdd = currentGroupIds.indexOf(targetGroupId) === -1 ? [contact.resourceName] : [];

modifyExternalGroupMembers(service, toAdd, [contact.resourceName], targetGroupId); // Added Add, but toRemove requires iteration
if (toRemove.length > 0) {
  toRemove.forEach(function(gId) {
     modifyExternalGroupMembers(service, [], [contact.resourceName], gId);
  });
}
}

function pushDeleteUserToAccount(service, payload) {
var extData = fetchExternalContactsAndGroups(service);
var targetDigits = payload.mobile.replace(/\D/g, '').slice(-8);
var contact = findExternalContactByPhone(extData, targetDigits);

if (contact) {
  urlFetchWithRetry('https://people.googleapis.com/v1/' + contact.resourceName + ':deleteContact', service, 'DELETE');
}
}

function pushRenameUnitToAccount(service, payload) {
var extData = fetchExternalContactsAndGroups(service);
var oldName = payload.oldName.toUpperCase();
var newName = payload.newName.toUpperCase();

var oldGroupId = null;
var newGroupId = getExternalGroupId(extData, service, newName);

for (var grpRes in extData.groupMap) {
  if (extData.groupMap[grpRes].toUpperCase() === oldName) {
    oldGroupId = grpRes;
    break;
  }
}

var contactsToMove = [];
extData.connections.forEach(function(contact) {
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
         try {
           urlFetchWithRetry('https://people.googleapis.com/v1/' + contact.resourceName + ':updateContact?updatePersonFields=names', service, 'PATCH', contact);
         } catch(e) {}
     }
  }
});

if (contactsToMove.length > 0) {
  modifyExternalGroupMembers(service, contactsToMove, [], newGroupId);
  if (oldGroupId) {
     modifyExternalGroupMembers(service, [], contactsToMove, oldGroupId);
  }
}

if (oldGroupId && oldGroupId !== newGroupId) {
  try {
     urlFetchWithRetry('https://people.googleapis.com/v1/' + oldGroupId + '?deleteContacts=false', service, 'DELETE');
  } catch(e) {}
}
}

function pushForceSyncToAccount(service, payload) {
var extData = fetchExternalContactsAndGroups(service);
var structureGroupIds = {};

// Create all groups first
payload.structure.forEach(function(unit) {
  structureGroupIds[unit.toUpperCase()] = getExternalGroupId(extData, service, unit);
});

payload.contacts.forEach(function(fc) {
  var targetDigits = fc.phone.replace(/\D/g, '').slice(-8);
  var contact = findExternalContactByPhone(extData, targetDigits);
  
  if (!contact) {
      // Create if missing during force sync
      var contactPayload = {
          names: [{ givenName: formatContactName(fc.name, fc.unit) }],
          phoneNumbers: [{ value: fc.phone, type: "mobile" }]
      };
      try {
          var newContact = JSON.parse(urlFetchWithRetry('https://people.googleapis.com/v1/people:createContact', service, 'POST', contactPayload));
          contact = { resourceName: newContact.resourceName, memberships: [] };
      } catch(e) { return; }
  }

  var targetUnit = (fc.unit || "UNASSIGNED").toUpperCase();
  var targetGroupId = structureGroupIds[targetUnit] || null;

  var currentGroupIds = [];
  if (contact.memberships) {
     contact.memberships.forEach(function(m) {
         if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
             currentGroupIds.push(m.contactGroupMembership.contactGroupResourceName);
         }
     });
  }

  var toRemove = currentGroupIds.filter(function(id) { 
     return id !== targetGroupId && extData.groupMap[id]; 
  });

  var toAdd = targetGroupId && currentGroupIds.indexOf(targetGroupId) === -1 ? [contact.resourceName] : [];

  if (toAdd.length > 0) {
     modifyExternalGroupMembers(service, toAdd, [], targetGroupId);
  }
  if (toRemove.length > 0) {
     toRemove.forEach(function(gId) { 
         modifyExternalGroupMembers(service, [], [contact.resourceName], gId);
     });
  }

  if (contact.names && contact.names.length > 0) {
     var nameObj = contact.names[0];
     var cleanNm = extractName(fc.name || nameObj.displayName || nameObj.givenName || "");
     contact.names = [{ givenName: targetUnit !== "UNASSIGNED" ? formatContactName(cleanNm, targetUnit) : cleanNm }];
     try {
       urlFetchWithRetry('https://people.googleapis.com/v1/' + contact.resourceName + ':updateContact?updatePersonFields=names', service, 'PATCH', contact);
     } catch(e) {}
  }
});
}

// Utilities

function urlFetchWithRetry(url, service, method, payload) {
var options = {
  method: method || 'GET',
  headers: { 'Authorization': 'Bearer ' + service.getAccessToken() },
  muteHttpExceptions: true
};
if (payload) {
  options.contentType = 'application/json';
  options.payload = JSON.stringify(payload);
}

for (var i = 0; i < 3; i++) {
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
      return response.getContentText();
  } else if (response.getResponseCode() === 429) {
      Utilities.sleep(1000 * (i + 1)); // Exponential backoff
  } else {
      throw new Error("HTTP " + response.getResponseCode() + ": " + response.getContentText());
  }
}
throw new Error("Max retries exceeded for API call.");
}