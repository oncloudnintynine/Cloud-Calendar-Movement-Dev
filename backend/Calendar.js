// ==========================================
// Calendar.js - Google Calendar Logic
// ==========================================

function applyTemplate(templateStr, dataObj) {
  if (!templateStr) return '';
  var result = templateStr;
  for (var key in dataObj) {
      var regex = new RegExp('{' + key + '}', 'g');
      result = result.replace(regex, dataObj[key] || '');
  }
  return result.replace(/\s+/g, ' ').trim(); // cleanup extra spaces
}

function createGCalEvents(data, props) {
  var eventIds =[];
  
  var eventTypes = JSON.parse(props.getProperty('eventTypes') || "[]");
  var typeObj = eventTypes.filter(function(t) { return t.name === data.leaveType; })[0];
  var isEvent = typeObj ? typeObj.style === 'event' : false;
  
  var templates = JSON.parse(props.getProperty('displayTemplates') || "{}");
  var titleTemplate = isEvent ? (templates.gcalEventTitle || '{Type} - {Name}, {Attendees} {HalfDay}') : (templates.gcalLeaveTitle || '{Type} - {Name} {HalfDay}');

  var attendeesStr = "";
  if (data.attendees) {
    try {
      var att = JSON.parse(data.attendees);
      if (att && att.length > 0) {
        attendeesStr = att.map(function(a) { return a.type === 'group' ? a.name.replace('zz ', '') : a.name; }).join(', ');
      }
    } catch(e) {}
  }
  
  var hdStr = "";
  if (data.halfDay && data.halfDay !== 'None' && data.halfDay !== 'NONE') {
      hdStr = "(" + data.halfDay + ")";
  }
  
  var locCountryStr = data.country ? data.country + (data.state ? " (" + data.state + ")" : "") : (data.location || "");

  var templateData = {
      Name: data.name,
      Dept: data.departments.join(', '),
      Type: data.leaveType,
      HalfDay: hdStr,
      Location: data.location || '',
      Country: data.country || '',
      State: data.state || '',
      Covering: data.coveringPerson || '',
      Attendees: attendeesStr,
      Remarks: data.remarks || ''
  };

  data.departments.forEach(function(deptName) {
    var cals = CalendarApp.getCalendarsByName(deptName);
    var cal = cals.length > 0 ? cals[0] : CalendarApp.createCalendar(deptName);
    
    var title = applyTemplate(titleTemplate, templateData);
    // Fallback if template is empty
    if (!title) title = data.leaveType + " - " + data.name;
    
    var opts = {};
    if (isEvent && data.location) opts.location = data.location;
    if (!isEvent && locCountryStr) opts.description = "Location: " + locCountryStr;
    
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
