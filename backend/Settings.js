// ==========================================
// Settings.js - Admin Settings Logic
// ==========================================

function getSettings(data) {
  var props = PropertiesService.getScriptProperties();
  if (data && data.adminPass && data.adminPass !== props.getProperty('adminPassword')) throw new Error("Invalid Admin Password");

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
          allContacts.push({ name: name, phone: phone, dept: deptsStr });
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
    leaveTypes: JSON.parse(props.getProperty('leaveTypes') || "[]"),
    approvingAuthority: props.getProperty('approvingAuthority'),
    kahList: syncedKahList,
    menuOrder: JSON.parse(props.getProperty('menuOrder') || 'null'),
    githubRepo: props.getProperty('githubRepo') || '',
    backupFolder: props.getProperty('backupFolder') || '',
    allContacts: allContacts
  };
}

function saveSettings(data) {
  var props = PropertiesService.getScriptProperties();
  if (data.adminPass !== props.getProperty('adminPassword')) throw new Error("Invalid/Expired Admin Password");
  if(data.newAdminPass) props.setProperty('adminPassword', data.newAdminPass);
  
  props.setProperty('kahLimit', data.kahLimit.toString());
  props.setProperty('leaveTypes', JSON.stringify(data.leaveTypes));
  props.setProperty('approvingAuthority', data.approvingAuthority);
  props.setProperty('kahList', JSON.stringify(data.kahList));
  if(data.menuOrder) props.setProperty('menuOrder', JSON.stringify(data.menuOrder));
  
  if (data.githubRepo !== undefined) props.setProperty('githubRepo', data.githubRepo);
  if (data.backupFolder !== undefined) props.setProperty('backupFolder', data.backupFolder);
  
  return { updated: true };
}
