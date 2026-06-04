// ==========================================
// Calendar.js - Google Calendar Logic
// ==========================================

function createGCalEvents(data, props) {
var eventIds =[];
var typicalEventTypes = JSON.parse(props.getProperty('typicalEventTypes') || "[]");
var acronyms = JSON.parse(props.getProperty('acronyms') || "{}");
var globalGcalTemplate = props.getProperty('gcalTemplate') || '{EventType} - {Name}, {Attendees} {Time}';

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

var timeStr = "";
if (!isEvent && data.halfDay !== 'None' && data.halfDay !== 'NONE') timeStr = "(" + data.halfDay + ")";

var safeType = (data.leaveType || "").trim();
var displayType = safeType;
if (safeType === 'Meeting' && data.remarks) {
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