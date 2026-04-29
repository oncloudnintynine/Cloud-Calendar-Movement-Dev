// ==========================================
// Code.gs - Apps Script Backend
// ==========================================

function INITIAL_SETUP() {
  try {
    People.ContactGroups.list({ pageSize: 1 });
    People.People.Connections.list('people/me', { pageSize: 1, personFields: 'names' });
    CalendarApp.getAllCalendars();
    MailApp.getRemainingDailyQuota();
    DriveApp.getFiles(1);
  } catch(e) {}

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('adminPassword')) props.setProperty('adminPassword', 'P@ssw0rd');
  if (!props.getProperty('kahLimit')) props.setProperty('kahLimit', '50');
  if (!props.getProperty('leaveTypes')) props.setProperty('leaveTypes', JSON.stringify(['Annual Leave', 'Sick Leave', 'Overseas Leave', 'Official Trip']));
  if (!props.getProperty('approvingAuthority')) props.setProperty('approvingAuthority', Session.getActiveUser().getEmail());
  if (!props.getProperty('kahList')) props.setProperty('kahList', JSON.stringify([]));
  if (!props.getProperty('menuOrder')) props.setProperty('menuOrder', JSON.stringify(['dashboard', 'parade-state', 'my-leaves', 'submit-leave', 'submit-event']));
  
  var dbId = props.getProperty('dbSheetId');
  if (!dbId) {
    var ss = SpreadsheetApp.create("Company_Leaves_DB");
    var sheet = ss.getActiveSheet();
    sheet.appendRow(['ID', 'Timestamp', 'Phone', 'Name', 'Department', 'LeaveType', 'StartDate', 'EndDate', 'HalfDay', 'CoveringPerson', 'Country', 'State', 'Remarks', 'Status', 'EventIDs', 'Location', 'Attendees']);
    props.setProperty('dbSheetId', ss.getId());
  } else {
    verifySchema(SpreadsheetApp.openById(dbId).getActiveSheet());
  }
}

function verifySchema(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('Location') === -1) { sheet.getRange(1, headers.length + 1).setValue('Location'); headers.push('Location'); }
  if (headers.indexOf('Attendees') === -1) { sheet.getRange(1, headers.length + 1).setValue('Attendees'); headers.push('Attendees'); }
  return headers;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000); 
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var responseData = {};

    if (action === 'login') responseData = handleLogin(data);
    else if (action === 'getSettings') responseData = getSettings(data);
    else if (action === 'saveSettings') responseData = saveSettings(data);
    else if (action === 'submitLeave') responseData = submitLeave(data);
    else if (action === 'editLeave') responseData = editLeave(data);
    else if (action === 'getLeaves') responseData = getLeaves(data);
    else if (action === 'cancelLeave') responseData = cancelLeave(data);

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: responseData })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doOptions(e) { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON); }

// ================= HELPER FUNCTIONS =================
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

// ================= ACTION HANDLERS =================
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
    if (!userName) throw new Error("User phone number not found in Google Contacts.");
    return { role: 'user', name: userName, phone: phone, departments: userDepts };
  }
  throw new Error("Invalid password");
}

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

  // Auto-sync KAH List departments in background to fix mismatches if user moves department
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
  return { updated: true };
}

function submitLeave(data) {
  var props = PropertiesService.getScriptProperties();
  var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
  var headers = verifySchema(sheet);
  
  var id = Utilities.getUuid();
  var status = checkKahLimit(data, props, sheet) ? "Cal Updated (KAH Limit Reached)" : "Cal Updated";
  var eventIds = createGCalEvents(data, props);

  var row = new Array(headers.length).fill('');
  row[headers.indexOf('ID')] = id;
  row[headers.indexOf('Timestamp')] = new Date();
  row[headers.indexOf('Phone')] = data.phone;
  row[headers.indexOf('Name')] = data.name;
  row[headers.indexOf('Department')] = data.departments.join(',');
  row[headers.indexOf('LeaveType')] = data.leaveType;
  row[headers.indexOf('StartDate')] = data.startDate;
  row[headers.indexOf('EndDate')] = data.endDate;
  row[headers.indexOf('HalfDay')] = data.halfDay;
  row[headers.indexOf('CoveringPerson')] = data.coveringPerson;
  row[headers.indexOf('Country')] = data.country || '';
  row[headers.indexOf('State')] = data.state || '';
  row[headers.indexOf('Remarks')] = data.remarks || '';
  row[headers.indexOf('Status')] = status;
  row[headers.indexOf('EventIDs')] = eventIds.join(',');
  row[headers.indexOf('Location')] = data.location || '';
  row[headers.indexOf('Attendees')] = data.attendees || '';

  sheet.appendRow(row);
  return { status: status };
}

function editLeave(data) {
  var props = PropertiesService.getScriptProperties();
  var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
  var headers = verifySchema(sheet);
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('ID')] === data.id && rows[i][headers.indexOf('Phone')] == data.phone) {
      
      var oldEventIds = (rows[i][headers.indexOf('EventIDs')] || '').split(',');
      oldEventIds.forEach(function(calAndEvt) {
        if (!calAndEvt) return;
        try {
          var parts = calAndEvt.split('|');
          if (parts.length === 2) CalendarApp.getCalendarById(parts[0]).getEventById(parts[1]).deleteEvent();
        } catch(e) {}
      });

      var status = checkKahLimit(data, props, sheet, data.id) ? "Cal Updated (KAH Limit Reached)" : "Cal Updated";
      var newEventIds = createGCalEvents(data, props);

      var newRow = new Array(headers.length).fill('');
      newRow[headers.indexOf('ID')] = data.id;
      newRow[headers.indexOf('Timestamp')] = new Date();
      newRow[headers.indexOf('Phone')] = data.phone;
      newRow[headers.indexOf('Name')] = data.name;
      newRow[headers.indexOf('Department')] = data.departments.join(',');
      newRow[headers.indexOf('LeaveType')] = data.leaveType;
      newRow[headers.indexOf('StartDate')] = data.startDate;
      newRow[headers.indexOf('EndDate')] = data.endDate;
      newRow[headers.indexOf('HalfDay')] = data.halfDay;
      newRow[headers.indexOf('CoveringPerson')] = data.coveringPerson;
      newRow[headers.indexOf('Country')] = data.country || '';
      newRow[headers.indexOf('State')] = data.state || '';
      newRow[headers.indexOf('Remarks')] = data.remarks || '';
      newRow[headers.indexOf('Status')] = status;
      newRow[headers.indexOf('EventIDs')] = newEventIds.join(',');
      newRow[headers.indexOf('Location')] = data.location || '';
      newRow[headers.indexOf('Attendees')] = data.attendees || '';

      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return { status: status };
    }
  }
  throw new Error("Record not found or unauthorized");
}

function getLeaves(data) {
  var props = PropertiesService.getScriptProperties();
  var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
  var headers = verifySchema(sheet);
  var rows = sheet.getDataRange().getValues();
  rows.shift(); 
  var result =[];

  var cg = getContactsAndGroups();
  var phoneToDepts = {};
  cg.connections.forEach(function(person) {
    var phone = (person.phoneNumbers && person.phoneNumbers.length > 0) ? person.phoneNumbers[0].value.replace(/\D/g, '').slice(-8) : "";
    if (phone && person.memberships) {
      var depts =[];
      person.memberships.forEach(function(m) {
        if (m.contactGroupMembership && m.contactGroupMembership.contactGroupResourceName) {
          var gName = cg.groupMap[m.contactGroupMembership.contactGroupResourceName];
          if (gName) depts.push(gName);
        }
      });
      if(depts.length > 0) phoneToDepts[phone] = depts.join(',');
    }
  });

  for(var i = 0; i < rows.length; i++) {
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = rows[i][idx]; });

    var currentActualDepts = phoneToDepts[obj.Phone];
    if (currentActualDepts && currentActualDepts !== obj.Department) {
       obj.Department = currentActualDepts;
       sheet.getRange(i + 2, headers.indexOf('Department') + 1).setValue(currentActualDepts);
    }

    if (obj.Status !== 'Cancelled' && obj.EventIDs) {
      var firstEvtId = obj.EventIDs.split(',')[0].split('|'); 
      if (firstEvtId.length === 2) {
        try {
          var cal = CalendarApp.getCalendarById(firstEvtId[0]);
          var evt = cal ? cal.getEventById(firstEvtId[1]) : null;
          if (!evt) {
            obj.Status = 'Cancelled';
            sheet.getRange(i + 2, headers.indexOf('Status') + 1).setValue('Cancelled');
          }
        } catch(e) {
          obj.Status = 'Cancelled';
          sheet.getRange(i + 2, headers.indexOf('Status') + 1).setValue('Cancelled');
        }
      } else {
        obj.Status = 'Cancelled';
        sheet.getRange(i + 2, headers.indexOf('Status') + 1).setValue('Cancelled');
      }
    }
    result.push(obj);
  }
  return result;
}

function cancelLeave(data) {
  var props = PropertiesService.getScriptProperties();
  var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
  var headers = verifySchema(sheet);
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('ID')] === data.id && rows[i][headers.indexOf('Phone')] == data.phone) {
      sheet.getRange(i + 1, headers.indexOf('Status') + 1).setValue('Cancelled');
      var eventIds = (rows[i][headers.indexOf('EventIDs')] || '').split(',');
      eventIds.forEach(function(calAndEvt) {
        if (!calAndEvt) return;
        try {
          var parts = calAndEvt.split('|');
          if(parts.length === 2) CalendarApp.getCalendarById(parts[0]).getEventById(parts[1]).deleteEvent();
        } catch(e) {}
      });
      return { success: true };
    }
  }
  throw new Error("Record not found");
}

function checkKahLimit(data, props, sheet, skipId) {
  if (data.leaveType !== 'Overseas Leave' && data.leaveType !== 'Official Trip') return false;
  
  var headers = verifySchema(sheet);
  var kahList = JSON.parse(props.getProperty('kahList') || "[]");
  var limit = parseInt(props.getProperty('kahLimit') || "50");
  
  var userKAHData = kahList.filter(function(k) { return k.phone === data.phone; });
  if (userKAHData.length === 0) return false;

  var limitExceeded = false;
  var rows = sheet.getDataRange().getValues();

  // Evaluate the limit for each department the user is a KAH for
  userKAHData.forEach(function(userKAH) {
    var dept = userKAH.dept;
    var totalKahInDept = kahList.filter(function(k) { return k.dept === dept; }).length;
    
    // Store unique phone numbers of KAHs who are away
    var overlappingKAHPhones = [String(data.phone)];
    
    for (var i = 1; i < rows.length; i++) {
      var rId = rows[i][headers.indexOf('ID')];
      var rType = rows[i][headers.indexOf('LeaveType')];
      var rStart = new Date(rows[i][headers.indexOf('StartDate')]);
      var rEnd = new Date(rows[i][headers.indexOf('EndDate')]);
      var rPhone = rows[i][headers.indexOf('Phone')];
      var rStatus = rows[i][headers.indexOf('Status')];

      if (rStatus === 'Cancelled' || rId === skipId) continue;
      
      if (rType === 'Overseas Leave' || rType === 'Official Trip') {
        var isKAHForDept = kahList.some(function(k) { return k.phone == rPhone && k.dept === dept; });
        if (isKAHForDept) {
          var dStart = new Date(data.startDate), dEnd = new Date(data.endDate);
          if (dStart <= rEnd && dEnd >= rStart) {
            if (overlappingKAHPhones.indexOf(String(rPhone)) === -1) {
              overlappingKAHPhones.push(String(rPhone));
            }
          }
        }
      }
    }
    
    if (((overlappingKAHPhones.length) / totalKahInDept) * 100 > limit) {
      limitExceeded = true;
    }
  });

  if (limitExceeded) {
    MailApp.sendEmail(props.getProperty('approvingAuthority'), "Leave Requires Approval: KAH Limit Exceeded", "User " + data.name + " applied for " + data.leaveType + " but KAH limit was exceeded.");
    return true;
  }
  return false;
}

function createGCalEvents(data, props) {
  var eventIds =[];
  var leaveTypes = JSON.parse(props.getProperty('leaveTypes') || "[]");
  var isEvent = leaveTypes.indexOf(data.leaveType) === -1; 
  
  var attendeesStr = "";
  if (data.attendees) {
    try {
      var att = JSON.parse(data.attendees);
      if (att && att.length > 0) {
        attendeesStr = att.map(function(a) { return a.type === 'group' ? a.name.replace('zz ', '') : a.name; }).join(', ');
      }
    } catch(e) {}
  }

  data.departments.forEach(function(deptName) {
    var cals = CalendarApp.getCalendarsByName(deptName);
    var cal = cals.length > 0 ? cals[0] : CalendarApp.createCalendar(deptName);
    
    var activityStr = data.leaveType;
    if (!isEvent && data.leaveType === 'Overseas Leave' && data.country) {
      activityStr += " (" + data.country + ")";
    }
    
    var title = activityStr + " - " + data.name;
    if (attendeesStr) title += ", " + attendeesStr;
    if (!isEvent && data.halfDay !== 'None' && data.halfDay !== 'NONE') title += " (" + data.halfDay + ")";
    
    var opts = {};
    if (isEvent && data.location) opts.location = data.location;
    
    if (!isEvent && data.leaveType === 'Overseas Leave' && data.country) {
      opts.description = "Location: " + data.country + (data.state ? " (" + data.state + ")" : "");
    }
    
    var evt;
    if (isEvent) {
      var startDt = new Date(data.startDate); 
      var endDt = new Date(data.endDate);
      if (data.halfDay && data.halfDay !== 'NONE') {
        var rec;
        if (data.halfDay === 'DAILY') rec = CalendarApp.newRecurrence().addDailyRule();
        else if (data.halfDay === 'WEEKLY') rec = CalendarApp.newRecurrence().addWeeklyRule();
        else if (data.halfDay === 'MONTHLY') rec = CalendarApp.newRecurrence().addMonthlyRule();
        else if (data.halfDay === 'ANNUALLY') rec = CalendarApp.newRecurrence().addYearlyRule();
        else if (data.halfDay === 'WEEKDAY') rec = CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekdays();
        evt = cal.createEventSeries(title, startDt, endDt, rec, opts);
      } else {
        evt = cal.createEvent(title, startDt, endDt, opts);
      }
    } else {
      evt = cal.createAllDayEvent(title, new Date(data.startDate), new Date(new Date(data.endDate).getTime() + 86400000), opts);
    }
    eventIds.push(cal.getId() + "|" + evt.getId());
  });
  return eventIds;
}
