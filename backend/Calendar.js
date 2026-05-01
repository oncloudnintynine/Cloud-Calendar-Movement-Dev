// ==========================================
// Calendar.js - Google Calendar Logic
// ==========================================

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
      var rec = null;
      
      // Determine if there is a repetition rule
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

      // Create Event based on AllDay and Recurrence
      if (data.isAllDay) {
        if (rec) {
          evt = cal.createAllDayEventSeries(title, startDt, rec, opts);
        } else {
          // If multi-day all day event, GAS requires end date to be day AFTER the last day.
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
      // Leave logic (always all day)
      evt = cal.createAllDayEvent(title, new Date(data.startDate), new Date(new Date(data.endDate).getTime() + 86400000), opts);
    }
    eventIds.push(cal.getId() + "|" + evt.getId());
  });
  return eventIds;
}