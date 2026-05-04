// ==========================================
// Auth.js - Login & People API Logic
// ==========================================

function getContactsAndGroups() {
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
    var req = { personFields: 'names,phoneNumbers,memberships,birthdays', pageSize: 1000 };
    if (pageToken) req.pageToken = pageToken;
    var res = People.People.Connections.list('people/me', req);
    if (res.connections) connections = connections.concat(res.connections);
    pageToken = res.nextPageToken;
  } while (pageToken);

  return { groupMap: groupMap, connections: connections };
}

function cleanName(name) {
  return name ? name.replace(/\s*\(.*?\)\s*/g, '').trim() : "";
}

function handleLogin(data) {
  var pass = data.password;
  var props = PropertiesService.getScriptProperties();
  if (pass === (props.getProperty('adminPassword') || 'P@ssw0rd')) return { role: 'admin', name: 'Administrator', pass: pass };

  var keyword = props.getProperty('userKeyword') || 'peace';

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
            if (!userName && person.names && person.names.length > 0) userName = cleanName(person.names[0].displayName);
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
    return { role: 'user', name: userName, phone: phone, departments: userDepts };
  }
  
  throw new Error("Invalid password");
}

function registerUser(data) {
  var cg = getContactsAndGroups();
  
  // Check if Mobile No already exists
  var targetDigits = data.mobile.replace(/\D/g, '').slice(-8);
  var phoneExists = cg.connections.some(function(person) {
    if (!person.phoneNumbers) return false;
    return person.phoneNumbers.some(function(p) {
      return p.value && p.value.replace(/\D/g, '').slice(-8) === targetDigits;
    });
  });
  
  if (phoneExists) {
    throw new Error("This Mobile No is already registered. Please check the number and try again.");
  }

  var contactPayload = {
    names:[{ givenName: data.fullName + " (Cloud Group : " + data.unit + ")" }],
    phoneNumbers:[{ value: data.mobile, type: "mobile" }]
  };
  
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
  return { success: true, message: "User registered successfully." };
}

function updateUser(data) {
  var props = PropertiesService.getScriptProperties();
  if (data.adminPass !== props.getProperty('adminPassword')) throw new Error("Invalid/Expired Admin Password");
  if (!data.resourceName) throw new Error("Missing contact identifier.");

  try {
    var contact = People.People.get(data.resourceName, { personFields: 'names,phoneNumbers,memberships,birthdays' });
    
    contact.names =[{ givenName: data.fullName + " (Cloud Group : " + data.unit + ")" }];
    contact.phoneNumbers =[{ value: data.mobile, type: "mobile" }];
    
    if (data.birthday) {
      var parts = data.birthday.split('-');
      contact.birthdays =[{
        date: { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10), day: parseInt(parts[2], 10) }
      }];
    } else {
      contact.birthdays =[]; 
    }
    
    People.People.updateContact(contact, data.resourceName, { updatePersonFields: 'names,phoneNumbers,birthdays' });

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
    var toAdd = currentGroupIds.indexOf(targetGroupId) === -1 ?[data.resourceName] :[];

    if (toAdd.length > 0) People.ContactGroups.Members.modify({ resourceNamesToAdd: toAdd }, targetGroupId);
    if (toRemove.length > 0) {
      toRemove.forEach(function(gId) { People.ContactGroups.Members.modify({ resourceNamesToRemove:[data.resourceName] }, gId); });
    }

    return { success: true };
  } catch(e) {
    throw new Error("Failed to update user: " + e.message);
  }
}