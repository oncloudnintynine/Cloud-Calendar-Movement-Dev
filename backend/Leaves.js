// ==========================================
// Leaves.js - Core CRUD & KAH Logic 
// ==========================================

function submitLeave(data) {
var props = PropertiesService.getScriptProperties();
var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
var headers = verifySchema(sheet);

if (data._userRole !== 'admin' && String(data.phone) !== String(data._userPhone)) {
throw new Error("Unauthorized to submit data on behalf of others.");
}

var id = data.id || Utilities.getUuid(); // Use frontend generated ID if provided
var eventIds = createGCalEvents(data, props);
var timestamp = new Date();

var row = new Array(headers.length).fill('');
row[headers.indexOf('ID')] = id;
row[headers.indexOf('Timestamp')] = timestamp;
row[headers.indexOf('Phone')] = data.phone;
row[headers.indexOf('Name')] = data.name;
row[headers.indexOf('Department')] = data.departments.join(',');
row[headers.indexOf('LeaveType')] = data.leaveType;
row[headers.indexOf('StartDate')] = data.startDate;
row[headers.indexOf('EndDate')] = data.endDate;
row[headers.indexOf('HalfDay')] = data.halfDay;
row[headers.indexOf('CoveringPerson')] = ''; // Deprecated
row[headers.indexOf('Country')] = data.country || '';
row[headers.indexOf('State')] = data.state || '';
row[headers.indexOf('Remarks')] = data.remarks || '';
row[headers.indexOf('Status')] = "Pending Validation...";
row[headers.indexOf('EventIDs')] = eventIds.join(',');
row[headers.indexOf('Location')] = data.location || '';
row[headers.indexOf('Attendees')] = data.attendees || '';
row[headers.indexOf('InfoAll')] = data.infoAll ? 'TRUE' : 'FALSE';
row[headers.indexOf('IsAllDay')] = data.isAllDay ? 'TRUE' : 'FALSE';
row[headers.indexOf('UntilDate')] = data.untilDate || '';
row[headers.indexOf('LocationDetails')] = data.locationDetails || '';

data.timestamp = timestamp; // Pass down for KAH check

sheet.appendRow(row);

// Run a complete board-wide recalculation to heal/flag KAH limits accurately based on the new entry
var finalStatus = "Cal Updated";
try {
var sheetRows = sheet.getDataRange().getValues();
recalculateAllKahStatuses(props, sheet, headers, sheetRows);
var freshRows = sheet.getDataRange().getValues();
for (var i = freshRows.length - 1; i >= 1; i--) {
  if (freshRows[i][headers.indexOf('ID')] === id) {
      finalStatus = freshRows[i][headers.indexOf('Status')];
      break;
  }
}
} catch(e) {
// Fallback if recalc fails
var kahExceededDept = checkKahLimit(data, props, sheet, id);
finalStatus = kahExceededDept ? "Cal Updated (KAH Limit Crossed for " + kahExceededDept + ")" : "Cal Updated";
var lastRowIdx = sheet.getLastRow();
sheet.getRange(lastRowIdx, headers.indexOf('Status') + 1).setValue(finalStatus);
}

return { status: finalStatus };
}

function editLeave(data) {
var props = PropertiesService.getScriptProperties();
var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
var headers = verifySchema(sheet);
var rows = sheet.getDataRange().getValues();

var targetRowIdx = -1;
for (var i = 1; i < rows.length; i++) {
if (rows[i][headers.indexOf('ID')] === data.id) {
targetRowIdx = i;
break;
}
}

if (targetRowIdx === -1) throw new Error("Record not found");

if (data._userRole !== 'admin' && String(rows[targetRowIdx][headers.indexOf('Phone')]) !== String(data._userPhone)) {
throw new Error("Unauthorized to modify this record.");
}

var oldEventIds = (rows[targetRowIdx][headers.indexOf('EventIDs')] || '').split(',');
oldEventIds.forEach(function(calAndEvt) {
if (!calAndEvt) return;
try {
var parts = calAndEvt.split('|');
if (parts.length === 2) {
  var cal = CalendarApp.getCalendarById(parts[0]);
  if (cal) {
    var evt = cal.getEventById(parts[1]);
    if (evt) evt.deleteEvent();
    else {
      var series = cal.getEventSeriesById(parts[1]);
      if (series) series.deleteEventSeries();
    }
  }
}
} catch(e) {}
});

var newEventIds = createGCalEvents(data, props);
var timestamp = new Date();

var newRow = new Array(headers.length).fill('');
newRow[headers.indexOf('ID')] = data.id;
newRow[headers.indexOf('Timestamp')] = timestamp;
newRow[headers.indexOf('Phone')] = data.phone;
newRow[headers.indexOf('Name')] = data.name;
newRow[headers.indexOf('Department')] = data.departments.join(',');
newRow[headers.indexOf('LeaveType')] = data.leaveType;
newRow[headers.indexOf('StartDate')] = data.startDate;
newRow[headers.indexOf('EndDate')] = data.endDate;
newRow[headers.indexOf('HalfDay')] = data.halfDay;
newRow[headers.indexOf('CoveringPerson')] = ''; // Deprecated
newRow[headers.indexOf('Country')] = data.country || '';
newRow[headers.indexOf('State')] = data.state || '';
newRow[headers.indexOf('Remarks')] = data.remarks || '';
newRow[headers.indexOf('Status')] = "Pending Validation...";
newRow[headers.indexOf('EventIDs')] = newEventIds.join(',');
newRow[headers.indexOf('Location')] = data.location || '';
newRow[headers.indexOf('Attendees')] = data.attendees || '';
newRow[headers.indexOf('InfoAll')] = data.infoAll ? 'TRUE' : 'FALSE';
newRow[headers.indexOf('IsAllDay')] = data.isAllDay ? 'TRUE' : 'FALSE';
newRow[headers.indexOf('UntilDate')] = data.untilDate || '';
newRow[headers.indexOf('LocationDetails')] = data.locationDetails || '';

data.timestamp = timestamp; // Pass down for KAH check

sheet.getRange(targetRowIdx + 1, 1, 1, headers.length).setValues([newRow]);

// Run a complete board-wide recalculation to heal/flag KAH limits accurately based on the modification
var finalStatus = "Cal Updated";
try {
var sheetRows = sheet.getDataRange().getValues();
recalculateAllKahStatuses(props, sheet, headers, sheetRows);
var freshRows = sheet.getDataRange().getValues();
finalStatus = freshRows[targetRowIdx][headers.indexOf('Status')];
} catch(e) {
// Fallback if recalc fails
var kahExceededDept = checkKahLimit(data, props, sheet, data.id);
finalStatus = kahExceededDept ? "Cal Updated (KAH Limit Crossed for " + kahExceededDept + ")" : "Cal Updated";
sheet.getRange(targetRowIdx + 1, headers.indexOf('Status') + 1).setValue(finalStatus);
}

return { status: finalStatus };
}

function fetchSGHolidays() {
var cache = CacheService.getScriptCache();
var cached = cache.get("sg_holidays_json");
if (cached) return JSON.parse(cached);

var url = 'https://calendar.google.com/calendar/ical/en.sg%23holiday%40group.v.calendar.google.com/public/basic.ics';
var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
if (res.getResponseCode() !== 200) return [];

var ics = res.getContentText();
var events = [];
var lines = ics.split(/\r?\n/);
var currentEvent = null;
var yearLimitStart = new Date().getFullYear() - 1;

for (var i=0; i<lines.length; i++) {
var line = lines[i];
if (line.indexOf('BEGIN:VEVENT') === 0) currentEvent = {};
else if (line.indexOf('END:VEVENT') === 0 && currentEvent) {
if (currentEvent.start && currentEvent.summary) {
   var y = parseInt(currentEvent.start.substring(0,4), 10);
   var m = parseInt(currentEvent.start.substring(4,6), 10) - 1;
   var d = parseInt(currentEvent.start.substring(6,8), 10);
   if (y >= yearLimitStart) {
       var sDate = new Date(y, m, d);
       var eDate = new Date(y, m, d, 23, 59, 59);
       events.push({
          ID: 'HOLIDAY_' + (currentEvent.uid || Utilities.getUuid()),
          Timestamp: sDate.toISOString(),
          Phone: 'SYSTEM',
          Name: currentEvent.summary.replace(/\\,/g, ','),
          Department: 'ALL',
          LeaveType: 'Public Holiday',
          StartDate: sDate.toISOString(),
          EndDate: eDate.toISOString(),
          HalfDay: 'NONE',
          CoveringPerson: '',
          Country: 'Singapore',
          State: '',
          Remarks: 'Singapore Public Holiday',
          Status: 'Holiday',
          EventIDs: '',
          Location: 'Singapore',
          Attendees: '',
          InfoAll: 'TRUE',
          IsAllDay: 'TRUE',
          UntilDate: '',
          LocationDetails: ''
       });
   }
}
currentEvent = null;
}
else if (currentEvent) {
if (line.indexOf('DTSTART;VALUE=DATE:') === 0) currentEvent.start = line.split(':')[1];
else if (line.indexOf('SUMMARY:') === 0) currentEvent.summary = line.substring(8);
else if (line.indexOf('UID:') === 0) currentEvent.uid = line.substring(4);
}
}
cache.put("sg_holidays_json", JSON.stringify(events), 21600); // 6 hour cache
return events;
}

function getLeaves(data) {
var props = PropertiesService.getScriptProperties();
var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
var headers = verifySchema(sheet);
var rows = sheet.getDataRange().getValues();
rows.shift();

var result =[];
var updates = false;
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

var now = new Date();
var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

for(var i = 0; i < rows.length; i++) {
var obj = {};
headers.forEach(function(h, idx) { obj[h] = rows[i][idx]; });

// --- Check for GCal Deletions (Two-way sync logic) ---
if (obj.Status !== 'Cancelled' && obj.EventIDs && new Date(obj.EndDate) >= todayStart) {
var eventPairs = String(obj.EventIDs).split(',');
var allDeleted = true;
for (var e = 0; e < eventPairs.length; e++) {
  if (!eventPairs[e]) continue;
  var parts = eventPairs[e].split('|');
  if (parts.length === 2) {
      try {
          var cal = CalendarApp.getCalendarById(parts[0]);
          if (cal) {
              var evt = cal.getEventById(parts[1]) || cal.getEventSeriesById(parts[1]);
              if (evt) {
                  allDeleted = false;
                  break; // At least one event still exists, keep active
              }
          }
      } catch(err) {
          // Ignore API errors, assume exists to be safe
          allDeleted = false; 
      }
  }
}
if (allDeleted && eventPairs.length > 0) {
  obj.Status = 'Cancelled';
  rows[i][headers.indexOf('Status')] = 'Cancelled';
  updates = true;
}
}
// -----------------------------------------------------

var currentActualDepts = phoneToDepts[obj.Phone] ? phoneToDepts[obj.Phone].split(',') :[];
var attDepts =[];

if (obj.Attendees) {
try {
var att = JSON.parse(obj.Attendees);
att.forEach(function(a) {
if (a.dept && a.dept !== 'Custom') {
  var dp = a.dept.split(',');
  dp.forEach(function(d) {
    if (d.trim() && attDepts.indexOf(d.trim()) === -1) attDepts.push(d.trim());
  });
}
});
} catch(e) {}
}

attDepts.forEach(function(d) {
if (currentActualDepts.indexOf(d) === -1) currentActualDepts.push(d);
});

if (obj.Department && obj.Department.indexOf('Cloud Meeting Room') !== -1) {
if (currentActualDepts.indexOf('Cloud Meeting Room') === -1) {
currentActualDepts.push('Cloud Meeting Room');
}
}

var combinedDeptsStr = currentActualDepts.join(',');

if (combinedDeptsStr && combinedDeptsStr !== obj.Department) {
obj.Department = combinedDeptsStr;
rows[i][headers.indexOf('Department')] = combinedDeptsStr;
updates = true;
}

result.push(obj);
}

if (updates) {
sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
// Run recalculation if we automatically cancelled any events
try { recalculateAllKahStatuses(props, sheet, headers); } catch(err) {}
}

try {
var holidays = fetchSGHolidays();
result = result.concat(holidays);
} catch(e) {}

return result;
}

function cancelLeave(data) {
var props = PropertiesService.getScriptProperties();
var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
var headers = verifySchema(sheet);
var rows = sheet.getDataRange().getValues();

for (var i = 1; i < rows.length; i++) {
if (rows[i][headers.indexOf('ID')] === data.id) {
if (data._userRole !== 'admin' && String(rows[i][headers.indexOf('Phone')]) !== String(data._userPhone)) {
throw new Error("Unauthorized to cancel this record.");
}

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
    if (evt) evt.deleteEvent();
    else {
      var series = cal.getEventSeriesById(parts[1]);
      if (series) series.deleteEventSeries();
    }
  }
}
} catch(e) {}
});

// Immediately trigger board-wide recalculation to heal any overlapping limit alerts
try {
var freshRows = sheet.getDataRange().getValues();
recalculateAllKahStatuses(props, sheet, headers, freshRows);
} catch(e) {}

return { success: true };
}
}
throw new Error("Record not found");
}

function checkKahLimit(data, props, sheet, skipId, preloadedRows, preloadedHeaders) {
var typicalEventTypes = JSON.parse(props.getProperty('typicalEventTypes') || "[]");
var dataKahRel = false;
for (var j = 0; j < typicalEventTypes.length; j++) {
if (typicalEventTypes[j].name === data.leaveType && typicalEventTypes[j].isKahRelevant) { dataKahRel = true; break; }
}

if (!dataKahRel) return false;

var headers = preloadedHeaders || verifySchema(sheet);
var rows = preloadedRows || sheet.getDataRange().getValues();
var kahList = JSON.parse(props.getProperty('kahList') || "[]");
var customKahGroups = JSON.parse(props.getProperty('customKahGroups') || "[]");
var limit = parseInt(props.getProperty('kahLimit') || "50");

var userKAHData = kahList.filter(function(k) { return String(k.phone) === String(data.phone); });
var userCustomGroups = customKahGroups.filter(function(g) { 
  return g.members.map(function(m) { return String(m); }).indexOf(String(data.phone)) !== -1; 
});

if (userKAHData.length === 0 && userCustomGroups.length === 0) return false;

var exceededDepts = [];

var reqStart = new Date(data.startDate);
reqStart.setHours(0, 0, 0, 0);
var reqEnd = new Date(data.endDate);
reqEnd.setHours(23, 59, 59, 999);

var targetTimestamp = data.timestamp ? new Date(data.timestamp) : new Date();

var otherKAHLeaves = [];
for (var i = 1; i < rows.length; i++) {
var rId = rows[i][headers.indexOf('ID')];
var rStatus = rows[i][headers.indexOf('Status')];
if (rStatus === 'Cancelled' || rId === skipId) continue;

var rTimestamp = new Date(rows[i][headers.indexOf('Timestamp')]);

// ONLY count leaves submitted/edited BEFORE this one. This prevents earlier approved events from being retroactively flagged.
if (rTimestamp > targetTimestamp) continue;

var rType = rows[i][headers.indexOf('LeaveType')];
var rKahRel = false;
for (var k = 0; k < typicalEventTypes.length; k++) {
if (typicalEventTypes[k].name === rType && typicalEventTypes[k].isKahRelevant) { rKahRel = true; break; }
}

if (rKahRel) {
 var rStart = new Date(rows[i][headers.indexOf('StartDate')]);
 rStart.setHours(0, 0, 0, 0);
 var rEnd = new Date(rows[i][headers.indexOf('EndDate')]);
 rEnd.setHours(23, 59, 59, 999);
 
 if (rStart > reqEnd || rEnd < reqStart) continue;

 otherKAHLeaves.push({
     phone: String(rows[i][headers.indexOf('Phone')]),
     start: rStart,
     end: rEnd
 });
}
}

// Evaluate Unit-Based KAH limits
userKAHData.forEach(function(userKAH) {
var dept = userKAH.dept;
var deptKAHPhones = kahList.filter(function(k) { return k.dept === dept; }).map(function(k) { return String(k.phone); });
var totalKahInDept = deptKAHPhones.length;

if (totalKahInDept === 0) return;

var maxConcurrentOut = 0;

for (var current = new Date(reqStart); current <= reqEnd; current.setDate(current.getDate() + 1)) {
 var outToday = [String(data.phone)]; 
 
 otherKAHLeaves.forEach(function(l) {
     if (l.start <= current && l.end >= current) {
         if (deptKAHPhones.indexOf(l.phone) !== -1 && outToday.indexOf(l.phone) === -1) {
             outToday.push(l.phone);
         }
     }
 });
 
 if (outToday.length > maxConcurrentOut) {
     maxConcurrentOut = outToday.length;
 }
}

if ((maxConcurrentOut / totalKahInDept) * 100 > limit) {
 exceededDepts.push(dept);
}
});

// Evaluate Custom KAH Group limits
userCustomGroups.forEach(function(group) {
var dept = group.name; // Use custom group name
var deptKAHPhones = group.members.map(function(m) { return String(m); });
var totalKahInDept = deptKAHPhones.length;

if (totalKahInDept === 0) return;

var maxConcurrentOut = 0;

for (var current = new Date(reqStart); current <= reqEnd; current.setDate(current.getDate() + 1)) {
 var outToday = [String(data.phone)]; 
 
 otherKAHLeaves.forEach(function(l) {
     if (l.start <= current && l.end >= current) {
         if (deptKAHPhones.indexOf(l.phone) !== -1 && outToday.indexOf(l.phone) === -1) {
             outToday.push(l.phone);
         }
     }
 });
 
 if (outToday.length > maxConcurrentOut) {
     maxConcurrentOut = outToday.length;
 }
}

if ((maxConcurrentOut / totalKahInDept) * 100 > limit) {
 exceededDepts.push(dept);
}
});

var uniqueExceededDepts = [];
exceededDepts.forEach(function(d) {
if (uniqueExceededDepts.indexOf(d) === -1) uniqueExceededDepts.push(d);
});

if (uniqueExceededDepts.length > 0) {
var deptStr = uniqueExceededDepts.join(', ');

if (!data._isRecalculation) {
var subjectTemplate = props.getProperty('kahEmailSubject') || "Leave Requires Approval: KAH Limit Crossed for {Unit}";
var bodyTemplate = props.getProperty('kahEmailBody') || "User {Name} applied for {EventType} but KAH limit was crossed for {Unit}.";
var acronyms = JSON.parse(props.getProperty('acronyms') || "{}");

var fullLoc = data.location || data.country || "";
if (data.locationDetails) fullLoc += " - " + data.locationDetails;

var finalSubject = subjectTemplate
.replace(/{Name}/g, data.name || "")
.replace(/{EventType}/g, data.leaveType || "")
.replace(/{Unit}/g, deptStr || "")
.replace(/{Location}/g, fullLoc)
.replace(/{Remarks}/g, data.remarks || "");

var finalBody = bodyTemplate
.replace(/{Name}/g, data.name || "")
.replace(/{EventType}/g, data.leaveType || "")
.replace(/{Unit}/g, deptStr || "")
.replace(/{Location}/g, fullLoc)
.replace(/{Remarks}/g, data.remarks || "");

finalSubject = applyAcronyms(finalSubject, acronyms);
finalBody = applyAcronyms(finalBody, acronyms);

MailApp.sendEmail(props.getProperty('approvingAuthority'), finalSubject, finalBody);
}
return deptStr;
}
return false;
}

function recalculateAllKahStatuses(props, optionalSheet, optionalHeaders, optionalRows) {
var sheetId = props.getProperty('dbSheetId');
if (!sheetId && !optionalSheet) return;

var sheet = optionalSheet || SpreadsheetApp.openById(sheetId).getActiveSheet();
var headers = optionalHeaders || verifySchema(sheet);
var rows = optionalRows || sheet.getDataRange().getValues();
if (rows.length <= 1) return;

var typicalEventTypes = JSON.parse(props.getProperty('typicalEventTypes') || "[]");
var now = new Date();
now.setHours(0, 0, 0, 0);
var statusColIdx = headers.indexOf('Status');

var batchUpdates = [];

for (var i = 1; i < rows.length; i++) {
var rId = rows[i][headers.indexOf('ID')];
var rStatus = rows[i][statusColIdx];
var rType = rows[i][headers.indexOf('LeaveType')];
var rEnd = new Date(rows[i][headers.indexOf('EndDate')]);

if (rStatus === 'Cancelled' || rEnd < now) continue;

var rKahRel = false;
for (var k = 0; k < typicalEventTypes.length; k++) {
if (typicalEventTypes[k].name === rType && typicalEventTypes[k].isKahRelevant) { rKahRel = true; break; }
}

if (rKahRel) {
var dataMock = {
id: rId,
phone: rows[i][headers.indexOf('Phone')],
name: rows[i][headers.indexOf('Name')],
leaveType: rType,
startDate: rows[i][headers.indexOf('StartDate')],
endDate: rows[i][headers.indexOf('EndDate')],
timestamp: rows[i][headers.indexOf('Timestamp')],
_isRecalculation: true
};

var kahExceededDept = checkKahLimit(dataMock, props, sheet, rId, rows, headers);
var newStatus = kahExceededDept ? "Cal Updated (KAH Limit Crossed for " + kahExceededDept + ")" : "Cal Updated";

if (rStatus !== newStatus) {
batchUpdates.push({ row: i + 1, col: statusColIdx + 1, val: newStatus });
rows[i][statusColIdx] = newStatus; // Update in-memory array for subsequent evaluations in loop
}
}
}

// Apply batch updates efficiently
batchUpdates.forEach(function(update) {
sheet.getRange(update.row, update.col).setValue(update.val);
});
}