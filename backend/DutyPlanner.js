var DP_CONFIG = {
"Seniorities": ["SeniorityID", "LevelName", "SortOrder"],
"Roles": ["RoleID", "RoleName", "Is24_7", "DaysOfWeek", "RoleType", "ConcurrentRoles"],
"Shifts": ["ShiftID", "RoleID", "ShiftName", "StartTime", "EndTime", "SeniorityReqs"],
"Personnel": ["PersonID", "PersonName", "SeniorityID"],
"Tags": ["TagID", "PersonID", "RoleID"],
"Schedule": ["ScheduleID", "YearMonth", "Date", "RoleName", "ShiftName", "SeniorityReqName", "StartDateTime", "EndDateTime", "PersonName", "PersonID"]
};

function getDpDbSheet() { 
return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('dbSheetId')); 
}

function dpSetupDatabase() {
var ss = getDpDbSheet();
var sheetNames = Object.keys(DP_CONFIG);
for (var i = 0; i < sheetNames.length; i++) {
 var sheetName = sheetNames[i];
 var headers = DP_CONFIG[sheetName];
 var sheet = ss.getSheetByName(sheetName);
 if (!sheet) { 
   sheet = ss.insertSheet(sheetName); 
   sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
   sheet.setFrozenRows(1);
 }
}
var senSheet = ss.getSheetByName("Seniorities");
if (senSheet && senSheet.getLastRow() <= 1) {
 senSheet.appendRow([Utilities.getUuid(), "Junior", 3]);
 senSheet.appendRow([Utilities.getUuid(), "Mid", 2]);
 senSheet.appendRow([Utilities.getUuid(), "Senior", 1]);
}
return { success: true };
}

function dpRunMigration() {
var ss = getDpDbSheet();
var senSheet = ss.getSheetByName("Seniorities");
if (!senSheet) { senSheet = ss.insertSheet("Seniorities"); }
senSheet.clear();
senSheet.getRange(1, 1, 1, DP_CONFIG["Seniorities"].length).setValues([DP_CONFIG["Seniorities"]]).setFontWeight("bold");

var idJun = Utilities.getUuid();
var idMid = Utilities.getUuid();
var idSen = Utilities.getUuid();

senSheet.appendRow([idSen, "Senior", 1]);
senSheet.appendRow([idMid, "Mid", 2]);
senSheet.appendRow([idJun, "Junior", 3]);

var mapNameId = { "Senior": idSen, "Mid": idMid, "Junior": idJun };

var pSheet = ss.getSheetByName("Personnel");
if (pSheet) {
  pSheet.getRange(1, 1, 1, DP_CONFIG["Personnel"].length).setValues([DP_CONFIG["Personnel"]]).setFontWeight("bold");
  var pData = pSheet.getDataRange().getValues();
  for (var i = 1; i < pData.length; i++) {
    var oldSen = pData[i][2];
    if (mapNameId[oldSen]) {
        pSheet.getRange(i + 1, 3).setValue(mapNameId[oldSen]);
    } else {
        pSheet.getRange(i + 1, 3).setValue(idJun); // Fallback to Junior
    }
  }
}

var rSheet = ss.getSheetByName("Roles");
if (rSheet) {
  rSheet.getRange(1, 1, 1, DP_CONFIG["Roles"].length).setValues([DP_CONFIG["Roles"]]).setFontWeight("bold");
}

var sSheet = ss.getSheetByName("Shifts");
if (sSheet) {
  sSheet.getRange(1, 1, 1, DP_CONFIG["Shifts"].length).setValues([DP_CONFIG["Shifts"]]).setFontWeight("bold");
  var sData = sSheet.getDataRange().getValues();
  for (var k = 1; k < sData.length; k++) {
    var reqsStr = sData[k][5];
    var reqs = {};
    try { reqs = JSON.parse(reqsStr || "{}"); } catch(e){}
    var newReqs = {};
    if(reqs["Senior"] !== undefined) newReqs[idSen] = reqs["Senior"];
    if(reqs["Mid"] !== undefined) newReqs[idMid] = reqs["Mid"];
    if(reqs["Junior"] !== undefined) newReqs[idJun] = reqs["Junior"];
    sSheet.getRange(k + 1, 6).setValue(JSON.stringify(newReqs));
  }
}

var tSheet = ss.getSheetByName("Tags");
if (tSheet) {
  tSheet.getRange(1, 1, 1, DP_CONFIG["Tags"].length).setValues([DP_CONFIG["Tags"]]).setFontWeight("bold");
}

var schSheet = ss.getSheetByName("Schedule");
if (schSheet) {
  schSheet.clear();
  schSheet.getRange(1, 1, 1, DP_CONFIG["Schedule"].length).setValues([DP_CONFIG["Schedule"]]).setFontWeight("bold");
  schSheet.setFrozenRows(1);
}
return { success: true };
}

function dpSyncData() {
return {
 seniorities: dpGetTableData("Seniorities", ["id", "name", "order"]),
 personnel: dpGetTableData("Personnel", ["id", "name", "seniority"]),
 roles: dpGetTableData("Roles", ["id", "name", "is247", "days", "type", "concurrentRoles"]),
 shifts: dpGetTableData("Shifts", ["id", "roleId", "name", "start", "end", "reqs"]),
 tags: dpGetTableData("Tags", ["id", "personId", "roleId"]),
 schedule: dpGetTableData("Schedule", ["id", "yearMonth", "date", "role", "shift", "seniorityReqName", "start", "end", "personName", "personId"])
};
}

function dpGetTableData(sheetName, keys) {
var sheet = getDpDbSheet().getSheetByName(sheetName);
if (!sheet) return [];
var rows = sheet.getDataRange().getValues();
var result = [];
for (var i = 1; i < rows.length; i++) {
 var obj = {};
 for (var j = 0; j < keys.length; j++) {
   var val = rows[i][j];
   if (val && Object.prototype.toString.call(val) === '[object Date]') {
     val = val.toISOString();
   }
   obj[keys[j]] = val;
 }
 result.push(obj);
}
return result;
}

function dpDeleteRow(sheetName, id) {
var sheet = getDpDbSheet().getSheetByName(sheetName);
if (!sheet) return;
var data = sheet.getDataRange().getValues();
for (var i = 1; i < data.length; i++) {
 if (data[i][0] === id) {
   sheet.deleteRow(i + 1);
   return;
 }
}
}

function dpUpdateRow(sheetName, id, newDataArray) {
var sheet = getDpDbSheet().getSheetByName(sheetName);
if (!sheet) return;
var data = sheet.getDataRange().getValues();
for (var i = 1; i < data.length; i++) {
 if (data[i][0] === id) {
   sheet.getRange(i + 1, 1, 1, newDataArray.length).setValues([newDataArray]);
   return;
 }
}
}

function dpHandleAction(action, data) {
  if (action === "dp_sync") {
    // handled by return below
  } else if (action === "dp_setupDatabase") {
    dpSetupDatabase();
  } else if (action === "dp_runMigration") {
    dpRunMigration();
  } else if (action === "dp_addSeniorityTier") {
    var sSheet = getDpDbSheet().getSheetByName("Seniorities");
    if (!sSheet) throw new Error("Database not initialized. Please click 'Run Setup' under System Actions first.");
    sSheet.appendRow([Utilities.getUuid(), data.name, data.order]);
  } else if (action === "dp_updateSeniorityTier") {
    dpUpdateRow("Seniorities", data.id, [data.id, data.name, data.order]);
  } else if (action === "dp_deleteSeniorityTier") {
    dpDeleteRow("Seniorities", data.id);
    var pSheet = getDpDbSheet().getSheetByName("Personnel");
    var pData = pSheet.getDataRange().getValues();
    for (var i = pData.length - 1; i >= 1; i--) {
      if (pData[i][2] === data.id) pSheet.getRange(i + 1, 3).setValue("");
    }
    var sSheet = getDpDbSheet().getSheetByName("Shifts");
    var sData = sSheet.getDataRange().getValues();
    for (var j = sData.length - 1; j >= 1; j--) {
      var reqs = {};
      try { reqs = JSON.parse(sData[j][5] || "{}"); } catch(ex){}
      var changed = false;
      if (reqs[data.id] !== undefined) {
        delete reqs[data.id];
        changed = true;
      }
      if(changed) {
          sSheet.getRange(j + 1, 6).setValue(JSON.stringify(reqs));
      }
    }
  } else if (action === "dp_updatePerson") {
    // Try to update, if not found, add it.
    var pSheet = getDpDbSheet().getSheetByName("Personnel");
    var pData = pSheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < pData.length; i++) {
      if (pData[i][0] === data.id) {
        pSheet.getRange(i + 1, 1, 1, 3).setValues([[data.id, data.personName, data.seniority]]);
        found = true;
        break;
      }
    }
    if (!found) {
      pSheet.appendRow([data.id, data.personName, data.seniority]);
    }
  } else if (action === "dp_deletePerson") {
    dpDeleteRow("Personnel", data.id);
    var tSheet = getDpDbSheet().getSheetByName("Tags");
    var tData = tSheet.getDataRange().getValues();
    for (var k = tData.length - 1; k >= 1; k--) {
      if (tData[k][1] === data.id) tSheet.deleteRow(k + 1);
    }
  } else if (action === "dp_addRole") {
    var roleId = Utilities.getUuid();
    var daysStr = Array.isArray(data.daysOfWeek) ? data.daysOfWeek.join(",") : "";
    var concurrentStr = Array.isArray(data.concurrentRoles) ? JSON.stringify(data.concurrentRoles) : "[]";
    var rSheet = getDpDbSheet().getSheetByName("Roles");
    if (!rSheet) throw new Error("Database not initialized. Please click 'Run Setup' under System Actions first.");
    rSheet.appendRow([
      roleId, data.roleName, data.is247, daysStr, data.roleType, concurrentStr
    ]);
    var sSheet2 = getDpDbSheet().getSheetByName("Shifts");
    if (data.shifts && data.shifts.length > 0) {
       data.shifts.forEach(function(s) {
         sSheet2.appendRow([Utilities.getUuid(), roleId, s.name, "'" + s.start, "'" + s.end, JSON.stringify(s.reqs)]);
       });
    }
  } else if (action === "dp_updateRole") {
    var daysStrU = Array.isArray(data.daysOfWeek) ? data.daysOfWeek.join(",") : "";
    var concurrentStrU = Array.isArray(data.concurrentRoles) ? JSON.stringify(data.concurrentRoles) : "[]";
    dpUpdateRow("Roles", data.id, [
      data.id, data.roleName, data.is247, daysStrU, data.roleType, concurrentStrU
    ]);
    var shSheet = getDpDbSheet().getSheetByName("Shifts");
    var shData = shSheet.getDataRange().getValues();
    for (var m = shData.length - 1; m >= 1; m--) {
      if (shData[m][1] === data.id) shSheet.deleteRow(m + 1);
    }
    if (data.shifts && data.shifts.length > 0) {
       data.shifts.forEach(function(s) {
         shSheet.appendRow([Utilities.getUuid(), data.id, s.name, "'" + s.start, "'" + s.end, JSON.stringify(s.reqs)]);
       });
    }
  } else if (action === "dp_deleteRole") {
    dpDeleteRow("Roles", data.id);
    var shSheetDel = getDpDbSheet().getSheetByName("Shifts");
    var shDataDel = shSheetDel.getDataRange().getValues();
    for (var m2 = shDataDel.length - 1; m2 >= 1; m2--) {
      if (shDataDel[m2][1] === data.id) shSheetDel.deleteRow(m2 + 1);
    }
    var tgSheet = getDpDbSheet().getSheetByName("Tags");
    var tgData2 = tgSheet.getDataRange().getValues();
    for (var n = tgData2.length - 1; n >= 1; n--) {
      if (tgData2[n][2] === data.id) tgSheet.deleteRow(n + 1);
    }
  } else if (action === "dp_tagPerson") {
    var tagsSheet = getDpDbSheet().getSheetByName("Tags");
    if (!tagsSheet) throw new Error("Database not initialized. Please click 'Run Setup' under System Actions first.");
    var existingTags = tagsSheet.getDataRange().getValues();
    var exists = false;
    for (var x = 1; x < existingTags.length; x++) {
        if (existingTags[x][1] === data.personId && existingTags[x][2] === data.roleId) exists = true;
    }
    if (!exists) {
        tagsSheet.appendRow([Utilities.getUuid(), data.personId, data.roleId]);
    }
  } else if (action === "dp_deleteTag") {
    dpDeleteRow("Tags", data.id);
  } else if (action === "dp_generateSchedule") {
    dpGenerateSchedule(data.year, data.month);
  } else if (action !== "dp_sync") {
    throw new Error("Unknown action: " + action);
  }
  
  SpreadsheetApp.flush();
  return dpSyncData();
}

function dpGetWeekKey(dateObj) {
var d = new Date(dateObj.getTime());
var day = d.getDay() || 7; 
d.setDate(d.getDate() + 4 - day);
var year = d.getFullYear();
var firstDay = new Date(year, 0, 1);
var week = Math.ceil((((d - firstDay) / 86400000) + 1) / 7);
return year + "-W" + week;
}

function dpGenerateSchedule(year, month) {
var ss = getDpDbSheet();
var scheduleSheet = ss.getSheetByName("Schedule");
var targetYM = year + "-" + String(month).padStart(2, '0');

var existingData = scheduleSheet.getDataRange().getValues();
for (var i = existingData.length - 1; i >= 1; i--) {
 if (existingData[i][1] === targetYM) {
   scheduleSheet.deleteRow(i + 1);
 }
}

var phDates = {};
try {
 var cal = CalendarApp.getCalendarById('en.singapore#holiday@group.v.calendar.google.com');
 if (cal) {
   var nextMonth = new Date(year, month, 1);
   var evs = cal.getEvents(new Date(year, month - 1, 1), nextMonth);
   for(var idx = 0; idx < evs.length; idx++) {
     var e = evs[idx];
     if (e.isAllDayEvent()) {
         var d = e.getStartTime();
         var ds = Utilities.formatDate(d, "Asia/Singapore", "yyyy-MM-dd");
         phDates[ds] = true;
     }
   }
 }
} catch (ex) {
}

var seniorities = dpGetTableData("Seniorities", ["id", "name", "order"]);
var roles = dpGetTableData("Roles", ["id", "name", "is247", "days", "type", "concurrentRoles"]);
var shifts = dpGetTableData("Shifts", ["id", "roleId", "name", "start", "end", "reqs"]);
var tags = dpGetTableData("Tags", ["id", "personId", "roleId"]);
var personnel = dpGetTableData("Personnel", ["id", "name", "seniority"]);

var senMap = {};
seniorities.forEach(function(s) { senMap[s.id] = s.name; });

var roleMap = {};
var standbyRoleIds = [];
roles.forEach(function(r) {
 var cRoles = [];
 try { cRoles = JSON.parse(r.concurrentRoles || "[]"); } catch(e) {}
 roleMap[r.id] = { type: r.type, concurrentRoles: cRoles, is247: (r.is247 === true || r.is247 === "TRUE") };
 if (r.type === 'Standby') standbyRoleIds.push(r.id);
});

var personStandbyMap = {};
personnel.forEach(function(p) { personStandbyMap[p.id] = false; });
tags.forEach(function(t) {
   if (standbyRoleIds.indexOf(t.roleId) !== -1) {
       personStandbyMap[t.personId] = true;
   }
});

var personMap = {};
var daysInMonth = new Date(year, month, 0).getDate();

personnel.forEach(function(p) {
 personMap[p.id] = { 
   name: p.name, 
   seniorityId: p.seniority, 
   totalDutyMinutes: 0, 
   blocks: [], 
   weeklyHours: {} 
 };

 for (var d = 1; d <= daysInMonth; d++) {
   var cDate = new Date(year, month - 1, d);
   var dayOfWeek = cDate.getDay();
   var dStr = year + "-" + String(month).padStart(2,'0') + "-" + String(d).padStart(2,'0');
   
   if (dayOfWeek >= 1 && dayOfWeek <= 5 && !phDates[dStr]) { 
     var sdt = new Date(year, month - 1, d, 8, 0, 0);
     var edt = new Date(year, month - 1, d, 17, 30, 0);
     var wk = dpGetWeekKey(sdt);
     personMap[p.id].blocks.push({
       type: 'office',
       startDT: sdt,
       endDT: edt,
       durationH: 9.5,
       active: true,
       dateStr: dStr
     });
     personMap[p.id].weeklyHours[wk] = (personMap[p.id].weeklyHours[wk] || 0) + 9.5;
   }
 }
});

var allSlots = [];
var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

for (var d = 1; d <= daysInMonth; d++) {
 var currentDate = new Date(year, month - 1, d);
 var dayStr = dayNames[currentDate.getDay()];
 var dateString = year + "-" + String(month).padStart(2,'0') + "-" + String(d).padStart(2,'0');
 var isHoliday = phDates[dateString];

 roles.forEach(function(role) {
   var is247 = roleMap[role.id].is247;
   
   if (!is247 && role.days.indexOf(dayStr) === -1) return;
   if (isHoliday && !is247) return;

   var roleShifts = shifts.filter(function(s) { return s.roleId === role.id; });
   
   roleShifts.forEach(function(shift) {
     var st = String(shift.start || "00:00").substring(0, 5); 
     var et = String(shift.end || "00:00").substring(0, 5);
     var startDT = new Date(dateString + "T" + st + ":00");
     var endDT = new Date(dateString + "T" + et + ":00");
     
     if (endDT <= startDT) {
         endDT.setDate(endDT.getDate() + 1);
     }
     
     var reqs = {};
     try { reqs = JSON.parse(shift.reqs || "{}"); } catch(e){}

     var durationH = (endDT.getTime() - startDT.getTime()) / 3600000;

     seniorities.forEach(function(senObj) {
        var count = parseInt(reqs[senObj.id]) || 0;
        
        for (var c = 0; c < count; c++) {
           allSlots.push({
             dateString: dateString,
             roleId: role.id,
             roleName: role.name,
             shiftName: shift.name,
             startDT: startDT,
             endDT: endDT,
             reqSeniorityId: senObj.id,
             reqSeniorityName: senObj.name,
             durationH: durationH,
             isReserve: false
           });
        }
        
        if (count > 0 && role.type !== 'Standby') {
            allSlots.push({
             dateString: dateString,
             roleId: role.id,
             roleName: role.name,
             shiftName: shift.name + " (Reserve)",
             startDT: startDT,
             endDT: endDT,
             reqSeniorityId: senObj.id,
             reqSeniorityName: senObj.name,
             durationH: durationH,
             isReserve: true
           });
        }
     });
   });
 });
}

allSlots.sort(function(a, b) {
   if (a.isReserve !== b.isReserve) {
       return a.isReserve ? 1 : -1;
   }
   return a.startDT.getTime() - b.startDT.getTime();
});

var newRows = [];

allSlots.forEach(function(slot) {
 var possibleCandidates = tags.filter(function(t) { return t.roleId === slot.roleId; })
                              .map(function(t) { return t.personId; });

 var validCandidates = [];
 var rData = roleMap[slot.roleId];

 possibleCandidates.forEach(function(pId) {
   var person = personMap[pId];
   if (!person) return;
   if (person.seniorityId !== slot.reqSeniorityId) return;

   var canWork = true;
   var blocksToWaive = []; 
   
   if (slot.isReserve && personStandbyMap[pId]) {
       return; 
   }

   for (var j = 0; j < person.blocks.length; j++) {
     var b = person.blocks[j];
     if (!b.active) {
         if (slot.isReserve && b.type === 'office' && b.dateStr === slot.dateString) {
             canWork = false;
             break;
         }
         continue;
     }

     var isOverlap = (slot.startDT < b.endDT && slot.endDT > b.startDT);
     var hoursBetweenEndStart = Math.abs(b.startDT.getTime() - slot.endDT.getTime()) / 3600000;
     var hoursBetweenStartEnd = Math.abs(slot.startDT.getTime() - b.endDT.getTime()) / 3600000;
     var violatesRest = false;

     if (slot.isReserve) {
         if (b.type === 'shift' || b.type === 'reserve') {
             if (isOverlap) {
                 var existingRoleData = roleMap[b.roleId];
                 var aAllowsB = (rData.concurrentRoles.indexOf(b.roleId) !== -1);
                 var bAllowsA = (existingRoleData.concurrentRoles.indexOf(slot.roleId) !== -1);
                 if (!aAllowsB && !bAllowsA) {
                     violatesRest = true; 
                 }
             }
         }
     } else {
         if (isOverlap) {
             violatesRest = true;
         } else if (slot.startDT >= b.endDT && hoursBetweenStartEnd < 11) {
             violatesRest = true;
         } else if (b.startDT >= slot.endDT && hoursBetweenEndStart < 11) {
             violatesRest = true;
         }

         if (violatesRest) {
            if (b.type === 'office') {
                blocksToWaive.push(b); 
            } else if (b.type === 'shift' || b.type === 'reserve') {
                if (isOverlap) {
                    var existingRoleData2 = roleMap[b.roleId];
                    var aAllowsB2 = (rData.concurrentRoles.indexOf(b.roleId) !== -1);
                    var bAllowsA2 = (existingRoleData2.concurrentRoles.indexOf(slot.roleId) !== -1);
                    if (aAllowsB2 || bAllowsA2) {
                        violatesRest = false; 
                    }
                }
                if (violatesRest) {
                    canWork = false;
                    break; 
                }
            }
         }
     }

     if (slot.isReserve && violatesRest) {
         canWork = false;
         break;
     }
   }

   if (canWork) {
      var wk = dpGetWeekKey(slot.startDT);
      var currentWkHrs = person.weeklyHours[wk] || 0;
      
      var waivedHours = 0;
      blocksToWaive.forEach(function(wb) { waivedHours += wb.durationH; });
      
      var shiftCost = (rData.type === 'Standby' || slot.isReserve) ? 0 : slot.durationH;
      
      if ((currentWkHrs - waivedHours + shiftCost) <= 44) {
          validCandidates.push({
              id: pId,
              waiveBlocks: blocksToWaive,
              shiftCost: shiftCost,
              wk: wk
          });
      }
   }
 });

 var assignedPersonName = "UNFILLED";
 var assignedPersonId = "";

 if (validCandidates.length > 0) {
   validCandidates.sort(function(a, b) { 
       return personMap[a.id].totalDutyMinutes - personMap[b.id].totalDutyMinutes; 
   });
   
   var selected = validCandidates[0];
   var pData = personMap[selected.id];

   selected.waiveBlocks.forEach(function(wb) {
      wb.active = false;
      pData.weeklyHours[selected.wk] -= wb.durationH;
   });

   pData.weeklyHours[selected.wk] = (pData.weeklyHours[selected.wk] || 0) + selected.shiftCost;
   
   pData.totalDutyMinutes += (slot.isReserve ? 1 : (slot.durationH * 60));
   
   pData.blocks.push({
       type: slot.isReserve ? 'reserve' : 'shift',
       roleId: slot.roleId,
       startDT: slot.startDT,
       endDT: slot.endDT,
       durationH: slot.durationH,
       active: true,
       dateStr: slot.dateString
   });

   assignedPersonName = pData.name;
   assignedPersonId = selected.id;
 }

 newRows.push([
   Utilities.getUuid(),
   targetYM,
   slot.dateString,
   slot.roleName,
   slot.shiftName,
   slot.reqSeniorityName,
   slot.startDT.toISOString(),
   slot.endDT.toISOString(),
   assignedPersonName,
   assignedPersonId
 ]);
});

if (newRows.length > 0) {
 scheduleSheet.getRange(scheduleSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
}
return { success: true };
}
