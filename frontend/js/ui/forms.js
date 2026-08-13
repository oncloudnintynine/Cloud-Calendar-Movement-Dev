// ==========================================
// Form Handling & Fuzzy Search Dropdowns
// ==========================================

function toggleInfoAll(forceState) {
isInfoAll = forceState !== undefined ? forceState : !isInfoAll;
['form-event-infoall-btn', 'form-combined-infoall-btn'].forEach(id => {
const btn = document.getElementById(id);
if(!btn) return;
const isHidden = btn.classList.contains('hidden-view');

if(isInfoAll) {
btn.innerHTML = '<span class="mr-1.5 text-base leading-none">📢</span> Announce';
btn.className = `shrink-0 border-2 border-blue-600 bg-blue-600 text-white rounded-xl px-3 sm:px-5 py-3 font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:border-blue-700 transition h-[52px] flex items-center justify-center whitespace-nowrap outline-none ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-darksurface ring-offset-white ${isHidden ? 'hidden-view' : ''}`;
} else {
btn.innerHTML = 'Announce';
btn.className = `shrink-0 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-3 sm:px-5 py-3 font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-darkinput hover:bg-gray-200 dark:hover:bg-darkhover transition h-[52px] flex items-center justify-center whitespace-nowrap outline-none ${isHidden ? 'hidden-view' : ''}`;
}
});
updateCombinedTitlePreview();
}

function toggleEventAllDay() {
appData.event.isAllDay = document.getElementById('form-event-allday').checked;
updateButtonLabels();
}

function toggleCombinedAllDay() {
appData.combined.isAllDay = document.getElementById('form-combined-allday').checked;
updateButtonLabels();
}

function openEventPicker(field) {
openPicker(appData.event.isAllDay ? 'date' : 'datetime', 'event', field);
}

function toggleRepeatUntil(ctx = 'event') {
const val = document.getElementById(`form-${ctx}-repeat`).value;
const container = document.getElementById(`${ctx}-until-container`);
if(val === 'NONE') container.classList.add('hidden-view');
else container.classList.remove('hidden-view');
}

function toggleCombinedRepeatUntil() {
toggleRepeatUntil('combined');
updateCombinedTitlePreview();
}

function toggleMeetingRoomCheckbox(ctx) {
const locEl = document.getElementById(`form-${ctx}-location`);
const wrapper = document.getElementById(`${ctx}-meeting-room-wrapper`);
const checkbox = document.getElementById(`form-${ctx}-meeting-room`);

if (locEl && wrapper) {
if (locEl.value === 'Out of Camp') {
wrapper.classList.add('hidden-view');
if (checkbox) checkbox.checked = false;
} else {
wrapper.classList.remove('hidden-view');
}
}
if (ctx === 'combined') updateCombinedTitlePreview();
}

function applyFieldOrder(ctx, typeObj) {
const allBlocks = ['time', 'location', 'attendees', 'remarks', 'repeat', 'overseas'];
let order = [...allBlocks];

if (typeObj && typeObj.fieldOrder && typeObj.fieldOrder.length > 0) {
const specified = typeObj.fieldOrder;
const missing = allBlocks.filter(b => !specified.includes(b));
order = [...specified, ...missing];
}

order.forEach((block, idx) => {
const el1 = document.getElementById(`block-${ctx}-${block}`);
if (el1) el1.style.order = idx + 2;
const el2 = document.getElementById(`block-${ctx}-${block}-event`);
if (el2) el2.style.order = idx + 2;
const el3 = document.getElementById(`block-${ctx}-${block}-leave`);
if (el3) el3.style.order = idx + 2;
});
}

function applyDynamicFields(ctx, typeObj) {
if (!typeObj || !typeObj.fields) return;
const fields = typeObj.fields;

const setField = (wrapperId, inputId, config) => {
const wrapper = document.getElementById(wrapperId);
const input = document.getElementById(inputId);
if (wrapper) {
if (config.show) wrapper.classList.remove('hidden-view');
else wrapper.classList.add('hidden-view');
}
if (input) {
input.required = config.req;
const label = document.getElementById(`label-${inputId}`);
if (label && wrapperId) {
label.innerHTML = `${wrapperId.includes('attendees') ? 'Attendees' : (wrapperId.includes('location-details') ? 'Location Details' : 'Location')} ${config.req ? '<span class="text-red-500">*</span>' : '<span class="text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>'}`;
}
}
};

setField(`wrapper-${ctx}-location`, `form-${ctx}-location`, fields.location);
setField(`wrapper-${ctx}-location-details`, `form-${ctx}-location-details`, fields.locationDetails);
setField(`block-${ctx}-attendees`, `form-${ctx}-attendee-search`, fields.attendees);

const remarksInput = document.getElementById(`form-${ctx}-remarks`);
const remarksLabel = document.getElementById(`label-${ctx}-remarks`);
if (remarksInput && remarksLabel) {
remarksInput.required = fields.remarks.req;
remarksInput.placeholder = fields.remarks.req ? `Enter ${fields.remarks.label.toLowerCase()} (Required)` : "";
remarksLabel.innerHTML = `${fields.remarks.label} ${fields.remarks.req ? '<span class="text-red-500">*</span>' : '<span class="text-xs font-normal text-gray-500">(Optional)</span>'}`;
}
}

function toggleCombinedFields() {
const typeInput = document.getElementById('form-combined-type');
if(!typeInput) return;
const val = typeInput.value;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === val) : null;
const isEvent = typeObj ? typeObj.isEvent : true;

applyDynamicFields('combined', typeObj);

const btnInfoAll = document.getElementById('form-combined-infoall-btn');
const locationInput = document.getElementById('form-combined-location');

const show = (id) => { const el = document.getElementById(id); if(el) el.classList.remove('hidden-view'); };
const hide = (id) => { const el = document.getElementById(id); if(el) el.classList.add('hidden-view'); };

if (isEvent) {
show('block-combined-location');
show('block-combined-time-event');
show('block-combined-repeat');
hide('block-combined-time-leave');
hide('block-combined-overseas');
if(btnInfoAll && !window.isExternalMode) btnInfoAll.classList.remove('hidden-view');

if (!locationInput.value || locationInput.value.trim() === '') {
let defLoc = typeObj && typeObj.defaultLoc ? typeObj.defaultLoc : 'In Camp';
if (defLoc !== 'In Camp' && defLoc !== 'Out of Camp') defLoc = 'Out of Camp';
locationInput.value = defLoc;
toggleMeetingRoomCheckbox('combined');
}
} else {
hide('block-combined-location');
hide('block-combined-time-event');
hide('block-combined-repeat');
show('block-combined-time-leave');
if(btnInfoAll) btnInfoAll.classList.add('hidden-view');

const cInput = document.getElementById('form-combined-country');
if (val === 'Overseas Leave' || val === 'Official Trip') { 
show('block-combined-overseas'); 
if(cInput) cInput.required = true; 
} else { 
hide('block-combined-overseas'); 
if(cInput) { cInput.required = false; cInput.value = ''; }
const stateEl = document.getElementById('form-combined-state');
if(stateEl) stateEl.value = '';
}
}

applyFieldOrder('combined', typeObj);
updateCombinedTitlePreview();
}

function updateCombinedTitlePreview() {
const mainEl = document.getElementById('combined-title-preview-main');
if (!mainEl) return;

const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

const typeValue = getVal('form-combined-type') || 'Generic';
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === typeValue) : null;
const isEvent = window.isExternalMode || (typeObj ? typeObj.isEvent : true);

let name = '';
let dept = '';
if (window.isExternalMode) {
const extName = getVal('ext-guest-name').trim();
const extContact = getVal('ext-guest-contact').trim();
name = extName ? (extContact ? `${extName} (${extContact})` : extName) : '';
} else if (user) {
if (user.role === 'admin' && adminBehalfUser) {
name = adminBehalfUser.name || '';
dept = adminBehalfUser.dept || '';
} else {
name = user.name || '';
dept = (user.departments && user.departments.join) ? user.departments.join(',') : '';
}
}

const attendeesDisplay = eventAttendees.map(a => a.expandedNames || a.formattedName || a.name).join(', ');

const locDetRaw = getVal('form-combined-location-details');
const country = getVal('form-combined-country');
const state = getVal('form-combined-state');

let loc = '';
if (isEvent) {
let det = locDetRaw.trim();
const meetRoomCb = document.getElementById('form-combined-meeting-room');
const locSel = getVal('form-combined-location');
if (meetRoomCb && meetRoomCb.checked && locSel !== 'Out of Camp') {
det = det ? 'Cloud Meeting Room, ' + det : 'Cloud Meeting Room';
} else {
det = det.replace('Cloud Meeting Room, ', '').replace(', Cloud Meeting Room', '').replace('Cloud Meeting Room', '').trim();
}
loc = det || locSel;
} else if (typeValue === 'Overseas Leave' && country) {
loc = country + (state ? ` (${state})` : "");
}

const d = appData.combined;
let timeStr = '';
let startTimeStr = '';
let endTimeStr = '';

if (isEvent) {
if (d.isAllDay) {
const sD = formatDisplayDate(d.startD);
const eD = formatDisplayDate(d.endD);
timeStr = sD === eD ? `${sD} (All Day)` : `${sD} to ${eD} (All Day)`;
startTimeStr = sD + " (All Day)";
endTimeStr = eD + " (All Day)";
} else {
const sD = formatDisplayDateTime(d.startD);
const eD = formatDisplayDateTime(d.endD);
timeStr = sD.split(' ')[0] === eD.split(' ')[0] ? `${sD} to ${eD.split(' ').slice(-1)[0]}` : `${sD} to ${eD}`;
startTimeStr = sD;
endTimeStr = eD;
}
const repeat = getVal('form-combined-repeat') || 'NONE';
if (repeat !== 'NONE') {
timeStr += ` ↻ ${repeat}`;
if (d.untilD) timeStr += ` until ${formatDisplayDate(d.untilD)}`;
}
} else {
const sD = formatDisplayDate(d.startD);
const eD = formatDisplayDate(d.endD);
timeStr = sD === eD ? sD : `${sD} to ${eD}`;
if (typeValue !== 'Official Trip') {
const isSameDay = d.startD.toDateString() === d.endD.toDateString();
let calcHD = 'None';
if (isSameDay) {
if (d.startAMPM === 'AM' && d.endAMPM === 'AM') calcHD = 'AM';
else if (d.startAMPM === 'PM' && d.endAMPM === 'PM') calcHD = 'PM';
} else {
if (d.startAMPM === 'PM' && d.endAMPM === 'AM') calcHD = 'Start PM, End AM';
else if (d.startAMPM === 'PM') calcHD = 'Start PM';
else if (d.endAMPM === 'AM') calcHD = 'End AM';
}
if (calcHD !== 'None') timeStr += ` (${calcHD})`;
}
startTimeStr = sD;
endTimeStr = eD;
}

const remarks = getVal('form-combined-remarks');
let safeType = typeValue.trim();
let displayType = safeType;
if (safeType === 'Generic' && remarks) {
displayType = safeType + ': ' + remarks.trim();
}
const eventDesc = remarks ? remarks.trim() : displayType;

const tplVars = {
EventType: displayType,
Name: name,
Department: dept,
Attendees: applyAcronymsFront(attendeesDisplay),
Location: applyAcronymsFront(loc),
LocationDetails: applyAcronymsFront(locDetRaw),
Time: timeStr,
StartTime: startTimeStr,
EndTime: endTimeStr,
Remarks: remarks,
EventDescription: eventDesc,
Country: country,
State: state
};

const buildTitle = (template) => {
if (!template) return '—';
let titleRaw = window.isExternalMode ? '{Name}' : template;
let t = titleRaw
.replace(/{EventType}/g, tplVars.EventType)
.replace(/{Name}/g, tplVars.Name)
.replace(/{Department}/g, tplVars.Department)
.replace(/{Attendees}/g, tplVars.Attendees)
.replace(/{Location}/g, tplVars.Location)
.replace(/{LocationDetails}/g, tplVars.LocationDetails)
.replace(/{Time}/g, tplVars.Time)
.replace(/{StartTime}/g, tplVars.StartTime)
.replace(/{EndTime}/g, tplVars.EndTime)
.replace(/{Remarks}/g, tplVars.Remarks)
.replace(/{EventDescription}/g, tplVars.EventDescription)
.replace(/{Country}/g, tplVars.Country)
.replace(/{State}/g, tplVars.State);
t = t.replace(/,\s*(?=[,\)]|$)/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
if (t.endsWith('-')) t = t.slice(0, -1).trim();
const finalTitle = applyAcronymsFront(t);
return finalTitle || '—';
};

let mainTemplate = window.appAgendaTemplate;
if (typeObj && typeObj.agendaTemplate) mainTemplate = typeObj.agendaTemplate;
if (mainTemplate === undefined || mainTemplate === null) mainTemplate = '{EventType} - {Name} ({Department})';
mainEl.textContent = buildTitle(mainTemplate);

const infoAllWrap = document.getElementById('combined-title-preview-infoall');
if (isInfoAll) {
let infoTemplate = window.appInfoAllTemplate;
if (typeObj && typeObj.infoAllTemplate) infoTemplate = typeObj.infoAllTemplate;
if (infoTemplate === undefined || infoTemplate === null) infoTemplate = mainTemplate;
const infoTextEl = document.getElementById('combined-title-preview-infoall-text');
if (infoTextEl) infoTextEl.textContent = buildTitle(infoTemplate);
if (infoAllWrap) infoAllWrap.classList.remove('hidden-view');
} else if (infoAllWrap) {
infoAllWrap.classList.add('hidden-view');
}
}

function toggleEventFields() {
const typeInput = document.getElementById('form-event-type');
if(!typeInput) return;
const val = typeInput.value;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === val) : null;

applyDynamicFields('event', typeObj);
applyFieldOrder('event', typeObj);

const locationInput = document.getElementById('form-event-location');
if (locationInput && (!locationInput.value || locationInput.value.trim() === '')) {
let defLoc = typeObj && typeObj.defaultLoc ? typeObj.defaultLoc : 'In Camp';
if (defLoc !== 'In Camp' && defLoc !== 'Out of Camp') defLoc = 'Out of Camp';
locationInput.value = defLoc;
toggleMeetingRoomCheckbox('event');
}
}

function toggleOverseasFields(ctx) {
const typeInput = document.getElementById(`form-${ctx}-type`);
if (!typeInput) return;
const type = typeInput.value;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === type) : null;
applyDynamicFields(ctx, typeObj);

const el = document.getElementById(`block-${ctx}-overseas`);
const cInput = document.getElementById(`form-${ctx}-country`);

if (type === 'Overseas Leave' || type === 'Official Trip') { 
if(el) el.classList.remove('hidden-view'); 
if(cInput) cInput.required = true; 
} else { 
if(el) el.classList.add('hidden-view'); 
if(cInput) { cInput.required = false; cInput.value = ''; }
const stateEl = document.getElementById(`form-${ctx}-state`);
if(stateEl) stateEl.value = ''; 
}

applyFieldOrder(ctx, typeObj);
}

// --- Admin Submit on Behalf Logic ---
function searchBehalf(ctx) {
const inputEl = document.getElementById(`form-${ctx}-behalf-search`);
const q = inputEl.value;
const resC = document.getElementById(`behalf-results-${ctx}`);

if(!q || !fuseAllContacts) { 
resC.classList.add('hidden-view'); 
inputEl.classList.remove('ring-2', 'ring-emerald-500');
return; 
}

inputEl.classList.add('ring-2', 'ring-emerald-500');
const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
if (results.length > 0) {
resC.innerHTML = results.map(c => `
<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-base" onclick="selectBehalf('${ctx}', '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.dept}')">
<span class="font-semibold text-emerald-800 dark:text-emerald-300">${c.formattedName}</span>
</div>
`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-3 text-gray-500 text-base">No match found</div>`; resC.classList.remove('hidden-view');
}
}

function selectBehalf(ctx, name, phone, dept) {
adminBehalfUser = { name, phone, dept };
document.getElementById(`selected-behalf-${ctx}`).innerHTML = `
<span>Submitting for: ${window.formatContactName(name, dept)}</span>
<button type="button" onclick="clearBehalf('${ctx}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition">&times; clear</button>
`;
const inputEl = document.getElementById(`form-${ctx}-behalf-search`);
inputEl.value = '';
inputEl.classList.add('hidden-view');
inputEl.classList.remove('ring-2', 'ring-emerald-500');
document.getElementById(`behalf-results-${ctx}`).classList.add('hidden-view');
if (ctx === 'combined') updateCombinedTitlePreview();
}

function clearBehalf(ctx) {
adminBehalfUser = null;
document.getElementById(`selected-behalf-${ctx}`).innerHTML = '';
document.getElementById(`form-${ctx}-behalf-search`).classList.remove('hidden-view');
if (ctx === 'combined') updateCombinedTitlePreview();
}

// --- Attendees Form Logic ---
function searchAttendees(ctx) {
const inputEl = document.getElementById(`form-${ctx}-attendee-search`);
const q = inputEl.value;
const resC = document.getElementById(`${ctx}-attendees-results`);

if(!q || !fuseAttendees) { 
resC.classList.add('hidden-view'); 
inputEl.classList.remove('ring-2', 'ring-blue-500');
return; 
}

inputEl.classList.add('ring-2', 'ring-blue-500');
const results = fuseAttendees.search(q).slice(0, 6).map(r => r.item);
if (results.length > 0) {
resC.innerHTML = results.map(item => `
<div class="p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-base" onclick="selectAttendee('${ctx}', '${item.id}', '${item.name.replace(/'/g, "\\'")}', '${item.dept}', '${item.type}', '${(item.expandedNames || '').replace(/'/g, "\\'")}', '${item.formattedName.replace(/'/g, "\\'")}')">
<span class="font-semibold text-blue-800 dark:text-blue-300">${item.formattedName}</span>
</div>
`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-3 text-gray-500 text-base">No match found</div>`; resC.classList.remove('hidden-view');
}
}

function selectAttendee(ctx, id, name, dept, type, expandedNames, formattedName) {
if (!eventAttendees.some(a => a.id === id)) { 
eventAttendees.push({ id, name, dept, type, expandedNames, formattedName }); 
renderAttendees(ctx); 
}
const inputEl = document.getElementById(`form-${ctx}-attendee-search`);
inputEl.value = '';
inputEl.classList.remove('ring-2', 'ring-blue-500');
document.getElementById(`${ctx}-attendees-results`).classList.add('hidden-view');
}

function removeAttendee(ctx, id) { 
eventAttendees = eventAttendees.filter(a => a.id !== id); 
renderAttendees(ctx); 
}

function renderAttendees(ctx) {
const c = document.getElementById(`${ctx}-attendees-chip-container`);
if(c) {
c.innerHTML = eventAttendees.map(a => `
<div class="inline-flex items-center bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm">
${a.formattedName || window.formatContactName(a.name, a.dept)}
<button type="button" onclick="removeAttendee('${ctx}', '${a.id}')" class="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-500 focus:outline-none">&times;</button>
</div>
`).join('');
}
if (ctx === 'combined') updateCombinedTitlePreview();
}

// --- Form Submission & Edits ---
function triggerEdit(id) {
const l = allLeaves.find(x => x.ID === id);
if(!l) return;
currentEditId = id;
const isExternal = l.Status === 'External (GCal)' || l._isExternal;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = isExternal ? true : (typeObj ? typeObj.isEvent : false);

const ctx = appMode === 'combined' ? 'combined' : (isEvent ? 'event' : 'leave');

appData[ctx].startD = new Date(l.StartDate);
appData[ctx].endD = new Date(l.EndDate);

if (user && user.role === 'admin') {
if (isExternal) clearBehalf(ctx);
else selectBehalf(ctx, l.Name, l.Phone, l.Department);
}

const typeEl = document.getElementById(`form-${ctx}-type`) || document.getElementById(`form-${ctx}-name`);
if (typeEl) {
typeEl.value = isExternal ? 'Generic' : l.LeaveType;
}

if (appMode === 'combined') {
toggleCombinedFields();
} else if (ctx === 'leave') {
toggleOverseasFields('leave');
} else if (ctx === 'event') {
toggleEventFields();
}

if (isEvent || l.LeaveType === 'Official Trip') {
eventAttendees =[];
if(l.Attendees && !isExternal) {
try {
eventAttendees = JSON.parse(l.Attendees);
} catch(e) {
const savedPhones = String(l.Attendees).split(',');
savedPhones.forEach(ph => {
const contact = companyContacts.find(c => String(c.phone) === String(ph));
if(contact) eventAttendees.push({ id: contact.phone, name: contact.name, formattedName: contact.formattedName, dept: contact.dept, type: 'contact' });
});
}
}
renderAttendees(ctx);
}

if (isEvent) {
appData[ctx].isAllDay = String(l.IsAllDay).toUpperCase() === 'TRUE';
appData[ctx].untilD = l.UntilDate ? new Date(l.UntilDate) : new Date(l.EndDate);
document.getElementById(`form-${ctx}-allday`).checked = appData[ctx].isAllDay;

const locEl = document.getElementById(`form-${ctx}-location`);
if (locEl) {
let val = l.Location || 'In Camp';
if (val !== 'In Camp' && val !== 'Out of Camp') val = 'Out of Camp';
locEl.value = val;
toggleMeetingRoomCheckbox(ctx);
}

const locDetEl = document.getElementById(`form-${ctx}-location-details`);
if (locDetEl) {
    let det = l.LocationDetails || '';
    det = det.replace('Cloud Meeting Room, ', '').replace(', Cloud Meeting Room', '').replace('Cloud Meeting Room', '').trim();
    locDetEl.value = det;
}

const meetRoomCb = document.getElementById(`form-${ctx}-meeting-room`);
if (meetRoomCb) {
meetRoomCb.checked = (l.LocationDetails || '').includes('Cloud Meeting Room') || (l.Department || '').includes('Cloud Meeting Room');
}

document.getElementById(`form-${ctx}-repeat`).value = l.HalfDay || 'NONE'; 
toggleInfoAll(String(l.InfoAll).toUpperCase() === 'TRUE');
toggleRepeatUntil(ctx);
} else {
document.getElementById(`form-${ctx}-country`).value = l.Country || '';
document.getElementById(`form-${ctx}-state`).value = l.State || '';

let start = 'AM', end = 'PM';
if (l.HalfDay === 'AM') end = 'AM';
else if (l.HalfDay === 'PM') start = 'PM';
else if (l.HalfDay === 'Start PM, End AM') { start = 'PM'; end = 'AM'; }
else if (l.HalfDay === 'Start PM') start = 'PM';
else if (l.HalfDay === 'End AM') end = 'AM';
appData[ctx].startAMPM = start; appData[ctx].endAMPM = end;
updateTimeSliderVisual('start', start, ctx); updateTimeSliderVisual('end', end, ctx);
}

document.getElementById(`form-${ctx}-remarks`).value = l.Remarks || '';
document.getElementById(`submit-${ctx}-btn`).innerText = "Update Record";
document.getElementById(`cancel-edit-${ctx}-btn`).classList.remove('hidden-view');

updateButtonLabels();
switchTab(`submit-${ctx}`);

setTimeout(() => {
const el = document.getElementById(`form-${ctx}-remarks`);
if(el) { el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
}, 50);
}

function cancelEditMode() {
currentEditId = null; 
initDates();['leave-form', 'event-form', 'combined-form'].forEach(id => {
const form = document.getElementById(id);
if(form) form.reset();
});['form-leave-remarks', 'form-event-remarks', 'form-combined-remarks'].forEach(id => { 
const el = document.getElementById(id); 
if(el) el.style.height='auto'; 
});['event', 'combined'].forEach(ctx => {
const locEl = document.getElementById(`form-${ctx}-location`);
if (locEl) { locEl.value = 'In Camp'; toggleMeetingRoomCheckbox(ctx); }
const meetRoomCb = document.getElementById(`form-${ctx}-meeting-room`);
if (meetRoomCb) meetRoomCb.checked = false;
});

appData.leave.startAMPM = 'AM'; appData.leave.endAMPM = 'PM';
appData.combined.startAMPM = 'AM'; appData.combined.endAMPM = 'PM';
appData.event.isAllDay = false;
appData.combined.isAllDay = false;['form-event-allday', 'form-combined-allday'].forEach(id => {
const el = document.getElementById(id);
if (el) el.checked = false;
});

updateTimeSliderVisual('start', 'AM', 'leave'); updateTimeSliderVisual('end', 'PM', 'leave');
updateTimeSliderVisual('start', 'AM', 'combined'); updateTimeSliderVisual('end', 'PM', 'combined');

if (appMode === 'combined') toggleCombinedFields();
else {
toggleOverseasFields('leave');
toggleEventFields();
}

toggleInfoAll(false);
toggleRepeatUntil('event');
toggleRepeatUntil('combined');

clearBehalf('leave');
clearBehalf('event');
clearBehalf('combined');

eventAttendees =[]; 
renderAttendees('event');
renderAttendees('leave');
renderAttendees('combined');['leave', 'event', 'combined'].forEach(ctx => {
const btn = document.getElementById(`submit-${ctx}-btn`);
const cancelBtn = document.getElementById(`cancel-edit-${ctx}-btn`);
if (btn) btn.innerText = "Save Record";
if (cancelBtn) cancelBtn.classList.add('hidden-view');
});

switchTab(appMode === 'combined' ? 'dashboard' : 'my-leaves');
updateCombinedTitlePreview();
}

function toggleAMPM(type, ctx) {
appData[ctx][`${type}AMPM`] = appData[ctx][`${type}AMPM`] === 'AM' ? 'PM' : 'AM'; 
updateTimeSliderVisual(type, appData[ctx][`${type}AMPM`], ctx);
if (ctx === 'combined') updateCombinedTitlePreview();
}

function updateTimeSliderVisual(type, val, ctx) {
const slider = document.getElementById(`${type}-${ctx}-slider`);
const tAM = document.getElementById(`${type}-${ctx}-am`);
const tPM = document.getElementById(`${type}-${ctx}-pm`);
if (!slider || !tAM || !tPM) return;
const act = 'text-white', inact =['text-gray-500', 'dark:text-darkmuted'];
if (val === 'PM') {
slider.classList.add('translate-x-full');
tAM.classList.remove(act); tAM.classList.add(...inact);
tPM.classList.remove(...inact); tPM.classList.add(act);
} else {
slider.classList.remove('translate-x-full');
tAM.classList.remove(...inact); tAM.classList.add(act);
tPM.classList.remove(act); tPM.classList.add(...inact);
}
}

async function submitForm(ctx) {
let targetName = user ? user.name : '';
let targetPhone = user ? user.phone : '';
let targetDepts = new Set();

if (window.isExternalMode) {
const extNameEl = document.getElementById('ext-guest-name');
const extContactEl = document.getElementById('ext-guest-contact');
if (!extNameEl.value.trim() || !extContactEl.value.trim()) {
alert("Please provide your Name and Contact Info.");
return;
}
targetName = `${extNameEl.value.trim()} (${extContactEl.value.trim()})`;
targetPhone = 'EXTERNAL';
} else {
if (user.departments) {
user.departments.forEach(d => { if (d) targetDepts.add(d.trim()); });
}

if (user.role === 'admin' && adminBehalfUser) {
targetName = adminBehalfUser.name;
targetPhone = adminBehalfUser.phone;
targetDepts = new Set();
if (adminBehalfUser.dept) {
adminBehalfUser.dept.split(',').forEach(d => { if (d) targetDepts.add(d.trim()); });
}
} else if (user.role === 'admin' && !adminBehalfUser) {
alert("Admin: Please select a user to submit on behalf of.");
return;
}
}

const typeValue = document.getElementById(`form-${ctx}-type`) ? document.getElementById(`form-${ctx}-type`).value : document.getElementById(`form-${ctx}-name`).value;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === typeValue) : null;
const isEvent = ctx === 'event' || (ctx === 'combined' && typeObj && typeObj.isEvent) || window.isExternalMode;

// Clone dates to avoid mutating UI state unintentionally
const startCopy = new Date(appData[ctx].startD);
const endCopy = new Date(appData[ctx].endD);

// STRICT ZERO-OUT FOR NON-EVENTS
if (!isEvent) {
startCopy.setHours(0, 0, 0, 0);
endCopy.setHours(0, 0, 0, 0);
}

const toLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
const sDate = toLocalISO(startCopy);
const eDate = toLocalISO(endCopy);

let calculatedHalfDay = 'None';
let loc = '';
let locDetails = '';
let finalAttendeesStr = '';
let finalInfoAll = false;
let eventIsAllDay = false;
let eventUntilDate = '';
let country = '';
let state = '';

if (!isEvent) {
if (typeValue === 'Official Trip') {
calculatedHalfDay = 'None';
} else {
const isSameDay = startCopy.toDateString() === endCopy.toDateString();
if (isSameDay) {
if (appData[ctx].startAMPM === 'AM' && appData[ctx].endAMPM === 'AM') calculatedHalfDay = 'AM';
else if (appData[ctx].startAMPM === 'PM' && appData[ctx].endAMPM === 'PM') calculatedHalfDay = 'PM';
} else {
if (appData[ctx].startAMPM === 'PM' && appData[ctx].endAMPM === 'AM') calculatedHalfDay = 'Start PM, End AM';
else if (appData[ctx].startAMPM === 'PM') calculatedHalfDay = 'Start PM';
else if (appData[ctx].endAMPM === 'AM') calculatedHalfDay = 'End AM';
}
}
country = document.getElementById(`form-${ctx}-country`) ? document.getElementById(`form-${ctx}-country`).value : '';
state = document.getElementById(`form-${ctx}-state`) ? document.getElementById(`form-${ctx}-state`).value : '';

if (typeObj && typeObj.fields && typeObj.fields.attendees && typeObj.fields.attendees.show) {
eventAttendees.forEach(a => { 
if (a.dept !== 'Custom' && a.dept) {
a.dept.split(',').forEach(d => { if (d) targetDepts.add(d.trim()); });
} 
});
finalAttendeesStr = JSON.stringify(eventAttendees);
}
} else {
calculatedHalfDay = document.getElementById(`form-${ctx}-repeat`).value; 
loc = document.getElementById(`form-${ctx}-location`) ? document.getElementById(`form-${ctx}-location`).value : '';

const locDetEl = document.getElementById(`form-${ctx}-location-details`);
if (locDetEl) {
    locDetails = locDetEl.value.trim();
    const meetRoomCb = document.getElementById(`form-${ctx}-meeting-room`);
    if (meetRoomCb && meetRoomCb.checked && document.getElementById(`form-${ctx}-location`).value !== 'Out of Camp') {
        if (!locDetails.includes('Cloud Meeting Room')) {
            locDetails = locDetails ? 'Cloud Meeting Room, ' + locDetails : 'Cloud Meeting Room';
        }
    } else {
        locDetails = locDetails.replace('Cloud Meeting Room, ', '').replace(', Cloud Meeting Room', '').replace('Cloud Meeting Room', '').trim();
    }
}

finalInfoAll = isInfoAll;
eventIsAllDay = appData[ctx].isAllDay;

if (calculatedHalfDay !== 'NONE') {
eventUntilDate = toLocalISO(appData[ctx].untilD);
}

if (typeObj && typeObj.fields && typeObj.fields.attendees && typeObj.fields.attendees.show) {
eventAttendees.forEach(a => { 
if (a.dept !== 'Custom' && a.dept) {
a.dept.split(',').forEach(d => { if (d) targetDepts.add(d.trim()); });
} 
});
finalAttendeesStr = JSON.stringify(eventAttendees);
}
}

// --- Custom Calendar Auto-Population Engine ---
let involvedPhones = new Set();
involvedPhones.add(String(targetPhone));

if (typeObj && typeObj.fields && typeObj.fields.attendees && typeObj.fields.attendees.show) {
eventAttendees.forEach(a => {
if (a.type === 'contact') {
 involvedPhones.add(String(a.id));
} else if (a.type === 'group') {
 if (a.dept === 'Custom') {
      const customG = window.appCustomKahGroups.find(cg => cg.name === a.name.replace('zz KAH: ', ''));
      if (customG) customG.members.forEach(m => involvedPhones.add(String(m)));
 } else if (a.name.startsWith('zz KAH:')) {
      // Fallback for transition
 } else {
      companyContacts.filter(c => c.dept && String(c.dept).includes(a.dept)).forEach(c => involvedPhones.add(String(c.phone)));
 }
}
});
}

if (window.appCustomKahGroups) {
window.appCustomKahGroups.forEach(g => {
if (g.hasCalendar && g.calendarName) {
 if (g.members.some(m => involvedPhones.has(String(m)))) {
     targetDepts.add(g.calendarName);
 }
}
});
}
// ----------------------------------------------

const isEdit = !!currentEditId;
const targetId = currentEditId || generateLocalUUID();

const payload = {
id: targetId, name: targetName, phone: targetPhone, departments: Array.from(targetDepts),
leaveType: typeValue,
startDate: sDate, endDate: eDate, halfDay: calculatedHalfDay, 
coveringPerson: '',
country: country,
state: state,
remarks: document.getElementById(`form-${ctx}-remarks`).value,
location: loc,
locationDetails: locDetails,
attendees: finalAttendeesStr,
infoAll: finalInfoAll,
isAllDay: eventIsAllDay,
untilDate: eventUntilDate
};

if (window.isExternalMode) {
showLoader(true);
try {
await apiCall('submitExternalEvent', { ...payload, extToken: window.externalToken });
alert("Your booking has been submitted successfully!");
document.getElementById('combined-form').reset();
eventAttendees = [];
renderAttendees('combined');
appData.combined.startD = new Date();
appData.combined.endD = new Date(new Date().getTime() + 60 * 60 * 1000);
updateButtonLabels();
} catch (e) {
alert("Error submitting booking: " + e.message);
} finally {
showLoader(false);
}
return;
}

// Optimistic UI Update
const localMock = {
ID: targetId,
Timestamp: new Date().toISOString(),
Phone: targetPhone,
Name: targetName,
Department: Array.from(targetDepts).join(','),
LeaveType: typeValue,
StartDate: sDate,
EndDate: eDate,
HalfDay: calculatedHalfDay,
CoveringPerson: '',
Country: country,
State: state,
Remarks: document.getElementById(`form-${ctx}-remarks`).value,
Status: 'Pending (Syncing...)',
EventIDs: '',
Location: loc,
LocationDetails: locDetails,
Attendees: finalAttendeesStr,
InfoAll: finalInfoAll ? 'TRUE' : 'FALSE',
IsAllDay: eventIsAllDay ? 'TRUE' : 'FALSE',
UntilDate: eventUntilDate
};

if (isEdit) {
const existingIdx = allLeaves.findIndex(l => l.ID === targetId);
if (existingIdx !== -1) {
allLeaves[existingIdx] = localMock;
}
} else {
allLeaves.push(localMock);
}

window.agendaDirty = true;
window.myAgendaDirty = true;

// Automatically drop user back into dashboard seamlessly
cancelEditMode();

// Jump to the newly created/edited event's start date natively to view it immediately
if (appMode === 'combined') {
if (window.jumpToDate) window.jumpToDate('dash', startCopy);
} else {
if (window.jumpToDate) window.jumpToDate('my', startCopy);
}

queueSyncAction(isEdit ? 'editLeave' : 'submitLeave', payload);
}

function cancelLeave(id, targetPhone) {
if(!confirm("Are you sure you want to cancel this record?")) return;

// Optimistic UI Cancel
const existingIdx = allLeaves.findIndex(l => l.ID === id);
if (existingIdx !== -1) {
allLeaves[existingIdx].Status = 'Cancelled';
window.agendaDirty = true;
window.myAgendaDirty = true;
renderDashboard();
renderMyLeaves();
}

queueSyncAction('cancelLeave', { id: id, phone: targetPhone || user.phone });
}