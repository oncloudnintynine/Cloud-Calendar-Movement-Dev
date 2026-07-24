// ==========================================
// Auth.js - Login & People API Logic
// ==========================================

function getContactsAndGroups() {
var cacheKey = "contacts_groups";
var cached = getCachedData(cacheKey);
if (cached) return cached;

var lock = LockService.getScriptLock();
lock.waitLock(20000);
try {
cached = getCachedData(cacheKey);
if (cached) return cached;

var groupMap = {};
var groupsRes = People.ContactGroups.list({ groupFields: "name,groupType", pageSize: 1000 });
if (groupsRes.contactGroups) {
groupsRes.contactGroups.forEach(function(g) {
var groupName = g.name || g.formattedName;
if (g.groupType === 'USER_CONTACT_GROUP' && groupName !== "DSTA Contacts") {
  groupMap[g.resourceName] = groupName;
}
});
}

var connections =[];
var pageToken = null;
do {
var req = { personFields: 'names,phoneNumbers,emailAddresses,memberships,birthdays', pageSize: 1000 };
if (pageToken) req.pageToken = pageToken;
var res = People.People.Connections.list('people/me', req);
if (res.connections) connections = connections.concat(res.connections);
pageToken = res.nextPageToken;
} while (pageToken);

var result = { groupMap: groupMap, connections: connections };
putCachedData(cacheKey, result, 1800); 

return result;
} finally {
lock.releaseLock();
}
}

function invalidateContactsCache() {
removeCachedData("contacts_groups");
removeCachedData("settings_cache");
removeCachedData("external_data_cache");
}

function getContactNameFormat() {
return PropertiesService.getScriptProperties().getProperty('contactNameFormat') || "{Name} (CG : {Unit})";
}

function formatContactName(name, unit, format) {
if (!format) format = getContactNameFormat();
return format.replace(/{Name}/g, name).replace(/{Unit}/g, unit);
}

function extractName(fullName, format) {
if (!fullName) return "";
if (!format) format = getContactNameFormat();

try {
var escapedFormat = format.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
var regexStr = "^" + escapedFormat.replace('\\{Name\\}', '(?<name>.*?)').replace('\\{Unit\\}', '(?:.*?)') + "$";
var regex = new RegExp(regexStr, "i");
var match = regex.exec(fullName);
if (match && match.groups && match.groups.name) {
   return match.groups.name.trim();
}
} catch (e) {}

// Fallback for transition / robust cleanup
return fullName.replace(/\s*\((?:Cloud Group|CG)\s*:\s*.*?\)\s*/gi, '').trim();
}

function handleLogin(data) {
var pass = data.password;
var props = PropertiesService.getScriptProperties();
if (pass === (props.getProperty('adminPassword') || 'P@ssw0rd')) return { role: 'admin', name: 'Administrator', pass: pass };

var keyword = props.getProperty('userKeyword') || 'peace';
var format = getContactNameFormat();

if (pass.endsWith(keyword)) {
var phone = pass.slice(0, -keyword.length).replace(/\D/g, '').slice(-8);
if (phone.length !== 8) throw new Error("Invalid password format.");

var cg = getContactsAndGroups();
var userDepts =[];
var userName = "";

cg.connections.forEach(function(person) {
if (person.phoneNumbers) {
  person.phoneNumbers.forEach(function(phoneObj) {
    if (phoneObj.value && phoneObj.value.replace(/\D/g, '').slice(-8) === phone) {
      if (!userName && person.names && person.names.length > 0) userName = extractName(person.names[0].displayName, format);
      if (person.memberships) {
        person.memberships.forEach(function(m) {
          if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
            var gName = cg.groupMap[m.contactGroupMembership.contactGroupResourceName];
            if (gName && userDepts.indexOf(gName) === -1) userDepts.push(gName);
          }
        });
      }
    }
  });
}
});

if (!userName) throw new Error("User phone number not found in Google Contacts. If you just registered, please wait a minute for Google to sync.");
return { role: 'user', name: userName, phone: phone, pass: pass, departments: userDepts };
}

throw new Error("Invalid password");
}

function registerUser(data) {
var cg = getContactsAndGroups();

var targetDigits = data.mobile.replace(/\D/g, '').slice(-8);
var phoneExists = cg.connections.some(function(person) {
if (!person.phoneNumbers) return false;
return person.phoneNumbers.some(function(p) {
return p.value && p.value.replace(/\D/g, '').slice(-8) === targetDigits;
});
});

if (phoneExists) throw new Error("This Mobile No is already registered.");

var contactPayload = {
names: [{ givenName: formatContactName(data.fullName, data.unit) }],
phoneNumbers: [{ value: data.mobile, type: "mobile" }]
};

if (data.email) {
contactPayload.emailAddresses = [{ value: data.email }];
}

if (data.birthday) {
var parts = data.birthday.split('-');
contactPayload.birthdays =[{
date: { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) }
}];
}

var newContact = People.People.createContact(contactPayload);
var resourceName = newContact.resourceName;
var groupId = null;

for (var grpRes in cg.groupMap) {
if (cg.groupMap[grpRes].toLowerCase() === data.unit.toLowerCase()) {
groupId = grpRes;
break;
}
}

if (!groupId) {
var newGroup = People.ContactGroups.create({ contactGroup: { name: data.unit } });
groupId = newGroup.resourceName;
}

People.ContactGroups.Members.modify({ resourceNamesToAdd: [resourceName] }, groupId);

if (data.email) {
  try {
      var cals = CalendarApp.getCalendarsByName(data.unit);
      if (cals.length > 0) {
          Calendar.Acl.insert({role: 'writer', scope: {type: 'user', value: data.email}}, cals[0].getId());
      }
  } catch(e) {}
}

invalidateContactsCache();

return { success: true, message: "User registered successfully." };
}

function updateUser(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
if (!data.resourceName) throw new Error("Missing contact identifier.");

try {
var contact = People.People.get(data.resourceName, { personFields: 'names,phoneNumbers,emailAddresses,memberships,birthdays' });
var oldEmail = (contact.emailAddresses && contact.emailAddresses.length > 0) ? contact.emailAddresses[0].value : null;

// Provide a fresh array with only givenName to explicitly erase any orphaned familyName strings
contact.names = [{ givenName: formatContactName(data.fullName, data.unit) }];
contact.phoneNumbers =[{ value: data.mobile, type: "mobile" }];

if (data.email) {
contact.emailAddresses = [{ value: data.email }];
} else {
contact.emailAddresses = [];
}

if (data.birthday) {
var parts = data.birthday.split('-');
contact.birthdays = [{
  date: { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) }
}];
} else {
contact.birthdays =[]; 
}

People.People.updateContact(contact, data.resourceName, { updatePersonFields: 'names,phoneNumbers,emailAddresses,birthdays' });

var cg = getContactsAndGroups();
var targetGroupId = null;
var targetGroupName = data.unit.toUpperCase();

for (var grpRes in cg.groupMap) {
if (cg.groupMap[grpRes].toUpperCase() === targetGroupName) { targetGroupId = grpRes; break; }
}

if (!targetGroupId) {
var newGroup = People.ContactGroups.create({ contactGroup: { name: targetGroupName } });
targetGroupId = newGroup.resourceName;
}

var currentGroupIds =[];
if (contact.memberships) {
contact.memberships.forEach(function(m) {
  if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
    var gName = cg.groupMap[m.contactGroupMembership.contactGroupResourceName];
    if (gName) currentGroupIds.push(m.contactGroupMembership.contactGroupResourceName);
  }
});
}

var toRemove = currentGroupIds.filter(function(id) { return id !== targetGroupId; });
var toAdd = currentGroupIds.indexOf(targetGroupId) === -1 ? [data.resourceName] :[];

if (toAdd.length > 0) People.ContactGroups.Members.modify({ resourceNamesToAdd: toAdd }, targetGroupId);
if (toRemove.length > 0) {
toRemove.forEach(function(gId) { People.ContactGroups.Members.modify({ resourceNamesToRemove: [data.resourceName] }, gId); });
}

// Update Calendar ACLs
var emailChanged = (oldEmail || '').toLowerCase() !== (data.email || '').toLowerCase();
var deptChanged = (toAdd.length > 0 || toRemove.length > 0);

if (emailChanged || deptChanged) {
  // Remove old email from old and current groups
  if (oldEmail) {
      currentGroupIds.forEach(function(gId) {
          var gName = cg.groupMap[gId];
          if (gName) {
              try {
                  var cals = CalendarApp.getCalendarsByName(gName);
                  if (cals.length > 0) {
                      var calId = cals[0].getId();
                      var acls = Calendar.Acl.list(calId).items || [];
                      acls.forEach(function(rule) {
                          if (rule.scope && rule.scope.type === 'user' && rule.scope.value.toLowerCase() === oldEmail.toLowerCase()) {
                              Calendar.Acl.remove(calId, rule.id);
                          }
                      });
                  }
              } catch(e) {}
          }
      });
  }
  // Add new email to new target group
  if (data.email) {
      try {
          var cals = CalendarApp.getCalendarsByName(targetGroupName);
          if (cals.length > 0) {
              Calendar.Acl.insert({role: 'writer', scope: {type: 'user', value: data.email}}, cals[0].getId());
          }
      } catch(e) {}
  }
}

invalidateContactsCache();
return { success: true };
} catch(e) {
throw new Error("Failed to update user: " + e.message);
}
}