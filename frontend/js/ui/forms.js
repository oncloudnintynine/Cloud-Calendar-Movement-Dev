// ==========================================
// Form Handling & Fuzzy Search Dropdowns
// ==========================================

function toggleInfoAll(forceState) {
isInfoAll = forceState !== undefined ? forceState : !isInfoAll;['form-event-infoall-btn', 'form-combined-infoall-btn'].forEach(id => {
const btn = document.getElementById(id);
if(!btn) return;
if(isInfoAll) {
btn.innerHTML = '📢 Info All (ON)';
btn.classList.add('bg-yellow-400', 'dark:bg-yellow-500', 'text-yellow-900', 'dark:text-yellow-900', 'border-yellow-500', 'dark:border-yellow-400', 'shadow-md');
btn.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-gray-300', 'dark:border-gray-600', 'hover:bg-gray-100', 'dark:hover:bg-darkhover');
} else {
btn.innerHTML = 'Info All';
btn.classList.remove('bg-yellow-400', 'dark:bg-yellow-500', 'text-yellow-900', 'dark:text-yellow-900', 'border-yellow-500', 'dark:border-yellow-400', 'shadow-md');
btn.classList.add('text-gray-500', 'dark:text-gray-400', 'border-gray-300', 'dark:border-gray-600', 'hover:bg-gray-100', 'dark:hover:bg-darkhover');
}
});
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
      label.innerHTML = `${wrapperId.includes('attendees') ? 'Attendees' : (wrapperId.includes('location-details') ? 'Location Details' : 'Location')} ${config.req ? '<span class="text-red-500">*</span>' : '<span class="text-[10px] font-normal text-gray-500 dark:text-gray-400">(Optional)</span>'}`;
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
remarksLabel.innerHTML = `${fields.remarks.label} ${fields.remarks.req ? '<span class="text-red-500">*</span>' : '<span class="text-[10px] font-normal text-gray-500">(Optional)</span>'}`;
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
if(btnInfoAll) btnInfoAll.classList.remove('hidden-view');

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
<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onclick="selectBehalf('${ctx}', '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.dept}')">
<span class="font-semibold text-emerald-800 dark:text-emerald-300">${c.formattedName}</span>
</div>
`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
}
}

function selectBehalf(ctx, name, phone, dept) {
adminBehalfUser = { name, phone, dept };
document.getElementById(`selected-behalf-${ctx}`).innerHTML = `
<span>Submitting for: ${window.formatContactName(name, dept)}</span>
<button type="button" onclick="clearBehalf('${ctx}')" class="text-red-500 hover:bg-red-50 p-1 rounded transition">&times; clear</button>
`;
const inputEl = document.getElementById(`form-${ctx}-behalf-search`);
inputEl.value = '';
inputEl.classList.add('hidden-view');
inputEl.classList.remove('ring-2', 'ring-emerald-500');
document.getElementById(`behalf-results-${ctx}`).classList.add('hidden-view');
}

function clearBehalf(ctx) {
adminBehalfUser = null;
document.getElementById(`selected-behalf-${ctx}`).innerHTML = '';
document.getElementById(`form-${ctx}-behalf-search`).classList.remove('hidden-view');
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
<div class="p-3 border-b border-gray-200 dark:border-darkborder cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30" onclick="selectAttendee('${ctx}', '${item.id}', '${item.name.replace(/'/g, "\\'")}', '${item.dept}', '${item.type}', '${(item.expandedNames || '').replace(/'/g, "\\'")}', '${item.formattedName.replace(/'/g, "\\'")}')">
<span class="font-semibold text-blue-800 dark:text-blue-300">${item.formattedName}</span>
</div>
`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
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
<div class="inline-flex items-center bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded-lg px-2 py-1 text-sm font-semibold shadow-sm">
${a.formattedName || window.formatContactName(a.name, a.dept)}
<button type="button" onclick="removeAttendee('${ctx}', '${a.id}')" class="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-500 focus:outline-none">&times;</button>
</div>
`).join('');
}
}

// --- Form Submission & Edits ---
function triggerEdit(id) {
const l = allLeaves.find(x => x.ID === id);
if(!l) return;
currentEditId = id;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
const isEvent = typeObj ? typeObj.isEvent : false;

const ctx = appMode === 'combined' ? 'combined' : (isEvent ? 'event' : 'leave');

appData[ctx].startD = new Date(l.StartDate);
appData[ctx].endD = new Date(l.EndDate);

if (user.role === 'admin') {
selectBehalf(ctx, l.Name, l.Phone, l.Department);
}

const typeEl = document.getElementById(`form-${ctx}-type`) || document.getElementById(`form-${ctx}-name`);
if (typeEl) {
typeEl.value = l.LeaveType;
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
if(l.Attendees) {
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
if (locDetEl) locDetEl.value = l.LocationDetails || '';

const meetRoomCb = document.getElementById(`form-${ctx}-meeting-room`);
if (meetRoomCb) {
meetRoomCb.checked = (l.Department || '').includes('Cloud Meeting Room');
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
}

function toggleAMPM(type, ctx) {
appData[ctx][`${type}AMPM`] = appData[ctx][`${type}AMPM`] === 'AM' ? 'PM' : 'AM'; 
updateTimeSliderVisual(type, appData[ctx][`${type}AMPM`], ctx);
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

function submitForm(ctx) {
let targetName = user.name;
let targetPhone = user.phone;
let targetDepts = new Set();

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

const typeValue = document.getElementById(`form-${ctx}-type`) ? document.getElementById(`form-${ctx}-type`).value : document.getElementById(`form-${ctx}-name`).value;
const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === typeValue) : null;
const isEvent = ctx === 'event' || (ctx === 'combined' && typeObj && typeObj.isEvent);

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

const meetRoomCb = document.getElementById(`form-${ctx}-meeting-room`);
if (meetRoomCb && meetRoomCb.checked && document.getElementById(`form-${ctx}-location`).value !== 'Out of Camp') {
targetDepts.add('Cloud Meeting Room');
}

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
if (locDetEl) locDetails = locDetEl.value.trim();

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