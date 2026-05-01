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
    var req = { personFields: 'names,phoneNumbers,memberships', pageSize: 1000 };
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

  if (pass.endsWith('peace')) {
    var phone = pass.slice(0, -5).replace(/\D/g, '').slice(-8);
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
  // Create contact mapping
  var contactPayload = {
    names:[{ givenName: data.fullName + " (Cloud Group : " + data.unit + ")" }],
    phoneNumbers:[{ value: data.mobile, type: "mobile" }]
  };
  
  if (data.birthday) {
    var parts = data.birthday.split('-');
    contactPayload.birthdays =[{
      date: {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),
        day: parseInt(parts[2], 10)
      }
    }];
  }
  
  // 1. Create the base contact
  var newContact = People.People.createContact(contactPayload);
  var resourceName = newContact.resourceName;
  
  // 2. Fetch existing groups
  var cg = getContactsAndGroups();
  var groupId = null;
  
  for (var grpRes in cg.groupMap) {
    if (cg.groupMap[grpRes].toLowerCase() === data.unit.toLowerCase()) {
      groupId = grpRes;
      break;
    }
  }
  
  // 3. Create the group if it doesn't exist
  if (!groupId) {
    var newGroup = People.ContactGroups.create({
      contactGroup: { name: data.unit }
    });
    groupId = newGroup.resourceName;
  }
  
  // 4. Add the new contact to the group
  People.ContactGroups.Members.modify({
    resourceNamesToAdd: [resourceName]
  }, groupId);
  
  return { success: true, message: "User registered successfully." };
}