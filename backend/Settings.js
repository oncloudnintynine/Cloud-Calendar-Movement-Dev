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
   leaveTypes: JSON.parse(props.getProperty('leaveTypes') || "[]"),
   approvingAuthority: props.getProperty('approvingAuthority'),
   kahList: syncedKahList,
   menuOrder: JSON.parse(props.getProperty('menuOrder') || 'null'),
   githubRepo: props.getProperty('githubRepo') || '',
   backupFolder: props.getProperty('backupFolder') || '',
   userKeyword: props.getProperty('userKeyword') || 'peace',
   appMode: props.getProperty('appMode') || 'separated',
   companyStructure: JSON.parse(props.getProperty('companyStructure') || "{}"),
   allContacts: allContacts
 };
}

function saveSettings(data) {
 if (data._userRole !== 'admin') throw new Error("Unauthorized");
 var props = PropertiesService.getScriptProperties();
 
 if (data.newAdminPass) props.setProperty('adminPassword', data.newAdminPass);
 if (data.kahLimit !== undefined) props.setProperty('kahLimit', data.kahLimit.toString());
 if (data.leaveTypes !== undefined) props.setProperty('leaveTypes', JSON.stringify(data.leaveTypes));
 if (data.approvingAuthority !== undefined) props.setProperty('approvingAuthority', data.approvingAuthority);
 if (data.kahList !== undefined) props.setProperty('kahList', JSON.stringify(data.kahList));
 if (data.userKeyword !== undefined) props.setProperty('userKeyword', data.userKeyword);
 if (data.appMode !== undefined) props.setProperty('appMode', data.appMode);
 if (data.companyStructure !== undefined) props.setProperty('companyStructure', JSON.stringify(data.companyStructure));
 if (data.menuOrder !== undefined) props.setProperty('menuOrder', JSON.stringify(data.menuOrder));
 if (data.githubRepo !== undefined) props.setProperty('githubRepo', data.githubRepo);
 if (data.backupFolder !== undefined) props.setProperty('backupFolder', data.backupFolder);
 
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
   var toAdd = targetGroupId && currentGroupIds.indexOf(targetGroupId) === -1 ? [resName] :[];

   if (toAdd.length > 0) People.ContactGroups.Members.modify({ resourceNamesToAdd: toAdd }, targetGroupId);
   if (toRemove.length > 0) {
     toRemove.forEach(function(gId) { People.ContactGroups.Members.modify({ resourceNamesToRemove: [resName] }, gId); });
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
