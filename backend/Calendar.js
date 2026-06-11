// ==========================================
// Calendar.js - Google Calendar Logic
// ==========================================

function createGCalEvents(data, props) {
var eventIds =[];
var typicalEventTypes = JSON.parse(props.getProperty('typicalEventTypes') || "[]");
var acronyms = JSON.parse(props.getProperty('acronyms') || "{}");
var globalGcalTemplate = props.getProperty('gcalTemplate') || '{EventType} - {Name}, {Attendees}';

var eventTypeObj = typicalEventTypes.filter(function(t) { return t.name === data.leaveType; })[0];
var isEvent = eventTypeObj ? eventTypeObj.isEvent : false;

var gcalTemplate = (eventTypeObj && eventTypeObj.gcalTemplate) ? eventTypeObj.gcalTemplate : globalGcalTemplate;

var attendeesStr = "";
if (data.attendees) {
try {
var att = JSON.parse(data.attendees);
if (att && att.length > 0) {
attendeesStr = att.map(function(a) { 
return a.expandedNames ? a.expandedNames : (a.type === 'group' ? a.name.replace('zz KAH: ', '').replace('zz ', '') : a.name); 
}).join(', ');
}
} catch(e) {}
}

var tz = "Asia/Singapore";
var timeStr = "";
var startTimeStr = "";
var endTimeStr = "";

if (isEvent) {
if (data.isAllDay) {
   startTimeStr = Utilities.formatDate(new Date(data.startDate), tz, "dd MMM yyyy") + " (All Day)";
   endTimeStr = Utilities.formatDate(new Date(data.endDate), tz, "dd MMM yyyy") + " (All Day)";
} else {
   startTimeStr = Utilities.formatDate(new Date(data.startDate), tz, "dd MMM yyyy HH:mm");
   endTimeStr = Utilities.formatDate(new Date(data.endDate), tz, "dd MMM yyyy HH:mm");
}
if (data.halfDay && data.halfDay !== 'NONE') {
   endTimeStr += " ↻ " + data.halfDay + (data.untilDate ? " until " + Utilities.formatDate(new Date(data.untilDate), tz, "dd MMM yyyy") : "");
}
} else {
timeStr = data.halfDay !== 'None' && data.halfDay !== 'NONE' ? "(" + data.halfDay + ")" : "";
startTimeStr = Utilities.formatDate(new Date(data.startDate), tz, "dd MMM yyyy");
endTimeStr = Utilities.formatDate(new Date(data.endDate), tz, "dd MMM yyyy");
}

var safeType = (data.leaveType || "").trim();
var displayType = safeType;
if (safeType === 'Generic' && data.remarks) {
displayType = safeType + ": " + data.remarks.trim();
}

var eventDesc = data.remarks ? data.remarks.trim() : displayType;

var flatDepts = [];
if (data.departments && data.departments.length > 0) {
data.departments.forEach(function(d) {
if (!d) return;
d.toString().split(',').forEach(function(part) {
 var trimmed = part.trim();
 if (trimmed && flatDepts.indexOf(trimmed) === -1) {
   flatDepts.push(trimmed);
 }
});
});
}

flatDepts.forEach(function(deptName) {
var cals = CalendarApp.getCalendarsByName(deptName);
var cal = cals.length > 0 ? cals[0] : CalendarApp.createCalendar(deptName);

var locationStr = data.location || "";
if (data.locationDetails) {
locationStr += " - " + data.locationDetails;
}

if (!isEvent && data.leaveType === 'Overseas Leave' && data.country) {
locationStr = data.country + (data.state ? " (" + data.state + ")" : "");
}

var title = gcalTemplate
.replace(/{EventType}/g, displayType)
.replace(/{Name}/g, data.name || "")
.replace(/{Attendees}/g, attendeesStr || "")
.replace(/{Department}/g, deptName || "")
.replace(/{Location}/g, locationStr || "")
.replace(/{LocationDetails}/g, data.locationDetails || "")
.replace(/{Time}/g, timeStr || "")
.replace(/{StartTime}/g, startTimeStr || "")
.replace(/{EndTime}/g, endTimeStr || "")
.replace(/{Remarks}/g, data.remarks || "")
.replace(/{EventDescription}/g, eventDesc)
.replace(/{Country}/g, data.country || "")
.replace(/{State}/g, data.state || "");

title = title.replace(/,\s*(?=[,\)]|$)/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
if (title.endsWith('-')) title = title.slice(0, -1).trim();

title = applyAcronyms(title, acronyms);

var opts = {};
if (locationStr) opts.location = applyAcronyms(locationStr, acronyms);

if (!isEvent && data.leaveType === 'Overseas Leave' && data.country) {
opts.description = applyAcronyms("Location: " + data.country + (data.state ? " (" + data.state + ")" : ""), acronyms);
} else if (data.remarks) {
opts.description = applyAcronyms(data.remarks, acronyms);
}

var evt;
if (isEvent) {
var startDt = new Date(data.startDate); 
var endDt = new Date(data.endDate);
var rec = null;

if (data.halfDay && data.halfDay !== 'NONE') {
if (data.halfDay === 'DAILY') rec = CalendarApp.newRecurrence().addDailyRule();
else if (data.halfDay === 'WEEKLY') rec = CalendarApp.newRecurrence().addWeeklyRule();
else if (data.halfDay === 'MONTHLY') rec = CalendarApp.newRecurrence().addMonthlyRule();
else if (data.halfDay === 'ANNUALLY') rec = CalendarApp.newRecurrence().addYearlyRule();
else if (data.halfDay === 'WEEKDAY') rec = CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekdays();

if (data.untilDate) {
 var untilDt = new Date(data.untilDate);
 untilDt.setHours(23, 59, 59, 999);
 rec = rec.until(untilDt);
}
}

if (data.isAllDay) {
if (rec) {
evt = cal.createAllDayEventSeries(title, startDt, rec, opts);
} else {
var endDtAdjusted = new Date(endDt.getTime() + 86400000);
evt = cal.createAllDayEvent(title, startDt, endDtAdjusted, opts);
}
} else {
if (rec) {
evt = cal.createEventSeries(title, startDt, endDt, rec, opts);
} else {
evt = cal.createEvent(title, startDt, endDt, opts);
}
}
} else {
evt = cal.createAllDayEvent(title, new Date(data.startDate), new Date(new Date(data.endDate).getTime() + 86400000), opts);
}
eventIds.push(cal.getId() + "|" + evt.getId());
});
return eventIds;
}

function deleteCalendar(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
if (!data.calendarName) throw new Error("Missing calendar name");
var cals = CalendarApp.getCalendarsByName(data.calendarName);
if (cals.length > 0) {
cals.forEach(function(cal) { cal.deleteCalendar(); });
}
return { success: true };
}

function backfillCustomCalendar(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var calendarName = data.calendarName;
var groupMembers = data.members; // Array of phones

var cals = CalendarApp.getCalendarsByName(calendarName);
if (cals.length > 0) { cals.forEach(function(c) { c.deleteCalendar(); }); }
var targetCal = CalendarApp.createCalendar(calendarName);
var targetCalId = targetCal.getId();

var props = PropertiesService.getScriptProperties();
var sheet = SpreadsheetApp.openById(props.getProperty('dbSheetId')).getActiveSheet();
var rows = sheet.getDataRange().getValues();
var headers = rows[0];

var typicalEventTypes = JSON.parse(props.getProperty('typicalEventTypes') || "[]");
var acronyms = JSON.parse(props.getProperty('acronyms') || "{}");
var globalGcalTemplate = props.getProperty('gcalTemplate') || '{EventType} - {Name}, {Attendees}';

for (var i = 1; i < rows.length; i++) {
var rStatus = rows[i][headers.indexOf('Status')];
if (rStatus === 'Cancelled') continue;

var rPhone = String(rows[i][headers.indexOf('Phone')]);
var rAttendees = rows[i][headers.indexOf('Attendees')] || '';

var isRelevant = false;
if (groupMembers.indexOf(rPhone) !== -1) isRelevant = true;
else if (rAttendees) {
   for (var m = 0; m < groupMembers.length; m++) {
       if (rAttendees.indexOf(groupMembers[m]) !== -1) { isRelevant = true; break; }
   }
}

if (isRelevant) {
   var rDeptStr = rows[i][headers.indexOf('Department')] || '';
   var depts = rDeptStr.split(',').map(function(d){return d.trim();}).filter(function(d){return d;});
   if (depts.indexOf(calendarName) === -1) {
       depts.push(calendarName);
       sheet.getRange(i + 1, headers.indexOf('Department') + 1).setValue(depts.join(','));
   }

   var rName = rows[i][headers.indexOf('Name')];
   var rType = rows[i][headers.indexOf('LeaveType')];
   var rStart = rows[i][headers.indexOf('StartDate')];
   var rEnd = rows[i][headers.indexOf('EndDate')];
   var rHalfDay = rows[i][headers.indexOf('HalfDay')];
   var rIsAllDay = rows[i][headers.indexOf('IsAllDay')] === 'TRUE';
   var rUntil = rows[i][headers.indexOf('UntilDate')];
   var rLocation = rows[i][headers.indexOf('Location')] || '';
   var rLocationDetails = rows[i][headers.indexOf('LocationDetails')] || '';
   var rRemarks = rows[i][headers.indexOf('Remarks')] || '';
   var rCountry = rows[i][headers.indexOf('Country')] || '';
   var rState = rows[i][headers.indexOf('State')] || '';

   var eventTypeObj = typicalEventTypes.filter(function(t) { return t.name === rType; })[0];
   var isEvent = eventTypeObj ? eventTypeObj.isEvent : false;
   var gcalTemplate = (eventTypeObj && eventTypeObj.gcalTemplate) ? eventTypeObj.gcalTemplate : globalGcalTemplate;

   var attendeesStr = "";
   try {
       var att = JSON.parse(rAttendees);
       if (att && att.length > 0) {
           attendeesStr = att.map(function(a) { return a.expandedNames ? a.expandedNames : (a.type === 'group' ? a.name.replace('zz KAH: ', '').replace('zz ', '') : a.name); }).join(', ');
       }
   } catch(e) {}

   var tz = "Asia/Singapore";
   var timeStr = ""; var startTimeStr = ""; var endTimeStr = "";

   if (isEvent) {
       if (rIsAllDay) {
           startTimeStr = Utilities.formatDate(new Date(rStart), tz, "dd MMM yyyy") + " (All Day)";
           endTimeStr = Utilities.formatDate(new Date(rEnd), tz, "dd MMM yyyy") + " (All Day)";
       } else {
           startTimeStr = Utilities.formatDate(new Date(rStart), tz, "dd MMM yyyy HH:mm");
           endTimeStr = Utilities.formatDate(new Date(rEnd), tz, "dd MMM yyyy HH:mm");
       }
       if (rHalfDay && rHalfDay !== 'NONE' && rHalfDay !== 'None') endTimeStr += " ↻ " + rHalfDay;
   } else {
       timeStr = rHalfDay !== 'None' && rHalfDay !== 'NONE' ? "(" + rHalfDay + ")" : "";
       startTimeStr = Utilities.formatDate(new Date(rStart), tz, "dd MMM yyyy");
       endTimeStr = Utilities.formatDate(new Date(rEnd), tz, "dd MMM yyyy");
   }

   var safeType = (rType || "").trim();
   var displayType = safeType === 'Generic' && rRemarks ? safeType + ": " + rRemarks.trim() : safeType;
   var eventDesc = rRemarks ? rRemarks.trim() : displayType;

   var locationStr = rLocation || "";
   if (rLocationDetails) locationStr += " - " + rLocationDetails;
   if (!isEvent && rType === 'Overseas Leave' && rCountry) locationStr = rCountry + (rState ? " (" + rState + ")" : "");

   var title = gcalTemplate
       .replace(/{EventType}/g, displayType).replace(/{Name}/g, rName || "").replace(/{Attendees}/g, attendeesStr || "")
       .replace(/{Department}/g, calendarName).replace(/{Location}/g, locationStr || "").replace(/{LocationDetails}/g, rLocationDetails || "")
       .replace(/{Time}/g, timeStr || "").replace(/{StartTime}/g, startTimeStr || "").replace(/{EndTime}/g, endTimeStr || "")
       .replace(/{Remarks}/g, rRemarks || "").replace(/{EventDescription}/g, eventDesc)
       .replace(/{Country}/g, rCountry || "").replace(/{State}/g, rState || "");

   title = title.replace(/,\s*(?=[,\)]|$)/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
   if (title.endsWith('-')) title = title.slice(0, -1).trim();
   title = applyAcronyms(title, acronyms);

   var opts = {};
   if (locationStr) opts.location = applyAcronyms(locationStr, acronyms);
   if (!isEvent && rType === 'Overseas Leave' && rCountry) opts.description = applyAcronyms("Location: " + rCountry + (rState ? " (" + rState + ")" : ""), acronyms);
   else if (rRemarks) opts.description = applyAcronyms(rRemarks, acronyms);

   var evt;
   var startDt = new Date(rStart); var endDt = new Date(rEnd);
   if (isEvent) {
       var rec = null;
       if (rHalfDay && rHalfDay !== 'NONE' && rHalfDay !== 'None') {
           if (rHalfDay === 'DAILY') rec = CalendarApp.newRecurrence().addDailyRule();
           else if (rHalfDay === 'WEEKLY') rec = CalendarApp.newRecurrence().addWeeklyRule();
           else if (rHalfDay === 'MONTHLY') rec = CalendarApp.newRecurrence().addMonthlyRule();
           else if (rHalfDay === 'ANNUALLY') rec = CalendarApp.newRecurrence().addYearlyRule();
           else if (rHalfDay === 'WEEKDAY') rec = CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekdays();
           if (rUntil) { var untilDt = new Date(rUntil); untilDt.setHours(23, 59, 59, 999); rec = rec.until(untilDt); }
       }
       if (rIsAllDay) {
           if (rec) evt = targetCal.createAllDayEventSeries(title, startDt, rec, opts);
           else { var endDtAdj = new Date(endDt.getTime() + 86400000); evt = targetCal.createAllDayEvent(title, startDt, endDtAdj, opts); }
       } else {
           if (rec) evt = targetCal.createEventSeries(title, startDt, endDt, rec, opts);
           else evt = targetCal.createEvent(title, startDt, endDt, opts);
       }
   } else {
       evt = targetCal.createAllDayEvent(title, startDt, new Date(endDt.getTime() + 86400000), opts);
   }

   var newEvtId = targetCalId + "|" + evt.getId();
   var rEventIDs = rows[i][headers.indexOf('EventIDs')] || '';
   var currentEventIDs = rEventIDs ? String(rEventIDs).split(',') : [];
   currentEventIDs.push(newEvtId);
   sheet.getRange(i + 1, headers.indexOf('EventIDs') + 1).setValue(currentEventIDs.join(','));
}
}
return { success: true };
}