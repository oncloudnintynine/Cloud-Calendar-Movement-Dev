// ==========================================
// Leaves.js - Core CRUD & KAH Logic
// ==========================================

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
  row[headers.indexOf('InfoAll')] = data.infoAll ? 'TRUE' : 'FALSE';
  row[headers.indexOf('IsAllDay')] = data.isAllDay ? 'TRUE' : 'FALSE';
  row[headers.indexOf('UntilDate')] = data.untilDate || '';

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
          if (parts.length === 2) {
            var cal = CalendarApp.getCalendarById(parts[0]);
            if (cal) {
              var evt = cal.getEventById(parts[1]);
              if (evt) {
                evt.deleteEvent();
              } else {
                var series = cal.getEventSeriesById(parts[1]);
                if (series) series.deleteEventSeries();
              }
            }
          }
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
      newRow[headers.indexOf('InfoAll')] = data.infoAll ? 'TRUE' : 'FALSE';
      newRow[headers.indexOf('IsAllDay')] = data.isAllDay ? 'TRUE' : 'FALSE';
      newRow[headers.indexOf('UntilDate')] = data.untilDate || '';

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
          var evt = cal ? (cal.getEventById(firstEvtId[1]) || cal.getEventSeriesById(firstEvtId[1])) : null;
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
          if(parts.length === 2) {
            var cal = CalendarApp.getCalendarById(parts[0]);
            if (cal) {
              var evt = cal.getEventById(parts[1]);
              if (evt) {
                evt.deleteEvent();
              } else {
                var series = cal.getEventSeriesById(parts[1]);
                if (series) series.deleteEventSeries();
              }
            }
          }
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

  userKAHData.forEach(function(userKAH) {
    var dept = userKAH.dept;
    var totalKahInDept = kahList.filter(function(k) { return k.dept === dept; }).length;
    var overlappingKAHPhones =[String(data.phone)];
    
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