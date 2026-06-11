// ==========================================
// Admin Settings, User Management & Calendar Access
// ==========================================

let userToDeleteResource = null;
let userToManageResource = null;
let calendarAclsCache = null;

const FIXED_TYPICAL_EVENTS =["Generic", "Others", "Official Trip", "Overseas Leave", "Local Leave"];

// --- TEMPLATE CHIPS HELPER ---
function insertAtCursor(inputId, text) {
const input = document.getElementById(inputId);
if (!input) return;
const start = input.selectionStart;
const end = input.selectionEnd;
const val = input.value;
input.value = val.substring(0, start) + text + val.substring(end);
input.selectionStart = input.selectionEnd = start + text.length;
input.focus();
// Dispatch change event to ensure data state updates correctly when clicking chips
input.dispatchEvent(new Event('change', { bubbles: true }));
}

function populateAdminSettingsForm(settings) {
try {
const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

safeSet('set-kah-limit', settings.kahLimit);
safeSet('set-appr-email', settings.approvingAuthority);
safeSet('set-kah-subject', settings.kahEmailSubject || "Leave Requires Approval: KAH Limit Crossed for {Unit}");
safeSet('set-kah-body', settings.kahEmailBody || "User {Name} applied for {EventType} but KAH limit was crossed for {Unit}.");

safeSet('set-user-keyword', settings.userKeyword || 'peace');

safeSet('set-gcal-template', settings.gcalTemplate || '{EventType} - {Name}, {Attendees}');
safeSet('set-agenda-template', settings.agendaTemplate || '{EventType} - {Name} ({Department})');
safeSet('set-agenda-details-template', settings.agendaDetailsTemplate || 'Start: {StartTime}\nEnd: {EndTime}\nLocation: {Location}\nAttendees: {Attendees}\nEvent Description: {EventDescription}');
safeSet('set-infoall-template', settings.infoAllTemplate || '{EventType} - {Name} ({Department})');
safeSet('set-infoall-details-template', settings.infoAllDetailsTemplate || 'Start: {StartTime}\nEnd: {EndTime}\nLocation: {Location}\nEvent Description: {EventDescription}');
safeSet('set-landing-page', settings.landingPage || 'dashboard');
safeSet('set-contact-format', settings.contactNameFormat || '{Name} (Cloud Group : {Unit})');

const radios = document.getElementsByName('app-mode');
if (radios) {
radios.forEach(r => { if(r.value === appMode) r.checked = true; });
}

let allDepts = new Set(companyStructure);
if(companyContacts) {
companyContacts.forEach(c => {
if(c.dept && c.dept !== 'Unassigned') {
 c.dept.split(',').forEach(d => allDepts.add(d.trim().toUpperCase()));
}
});
}
allDepts.add('Cloud Meeting Room');
if (window.appCustomKahGroups) {
window.appCustomKahGroups.forEach(g => {
  if (g.hasCalendar && g.calendarName) allDepts.add(g.calendarName);
});
}

tempDashboardDeptOrder = settings.dashboardDeptOrder || [];
allDepts.forEach(d => {
if (!tempDashboardDeptOrder.includes(d)) tempDashboardDeptOrder.push(d);
});
tempDashboardDeptOrder = tempDashboardDeptOrder.filter(d => allDepts.has(d));
renderDashboardFilterOrder();

tempMenuOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
renderMenuOrder();

tempTypicalEventTypes = settings.typicalEventTypes ||[];
renderTypicalEventTypes();

tempAcronyms = {};
if (settings.acronyms) {
for (let key in settings.acronyms) {
let val = settings.acronyms[key];
if (typeof val === 'string') tempAcronyms[key] = { full: val, active: true };
else tempAcronyms[key] = val;
}
}
renderAcronyms();

adminKAHList = settings.kahList ||[];
customKahGroups = settings.customKahGroups ||[];
renderKAHSelected();
renderCustomKahGroups();

// Initialize General Settings Container
tempAdminSectionsOrder = (settings.adminSectionsOrder && settings.adminSectionsOrder.length 
? settings.adminSectionsOrder 
:['landing-page', 'app-mode', 'dashboard-filter-order', 'admin-pass', 'user-keyword', 'menu-order']).filter(s => s !== 'code-backup');

const container = document.getElementById('admin-sections-container');
if (container) {
tempAdminSectionsOrder.forEach(id => {
const el = container.querySelector(`[data-section="${id}"]`);
if (el) container.appendChild(el);
});

if (window.adminSectionsSortable) window.adminSectionsSortable.destroy();
if (typeof Sortable !== 'undefined') {
window.adminSectionsSortable = new Sortable(container, {
animation: 150,
handle: '.section-handle',
ghostClass: 'opacity-50',
onEnd: function () {
tempAdminSectionsOrder = Array.from(container.children).map(el => el.dataset.section);
}
});
}
}

// Initialize Contacts & Users Management Container
tempAdminContactsSectionsOrder = (settings.adminContactsSectionsOrder && settings.adminContactsSectionsOrder.length 
? settings.adminContactsSectionsOrder 
:['contact-format', 'register-user', 'manage-users']).filter(s => s !== 'code-backup' && s !== 'external-sync');

const contactsContainer = document.getElementById('admin-contacts-sections-container');
if (contactsContainer) {
tempAdminContactsSectionsOrder.forEach(id => {
const el = contactsContainer.querySelector(`[data-section="${id}"]`);
if (el) contactsContainer.appendChild(el);
});

if (window.adminContactsSectionsSortable) window.adminContactsSectionsSortable.destroy();
if (typeof Sortable !== 'undefined') {
window.adminContactsSectionsSortable = new Sortable(contactsContainer, {
animation: 150,
handle: '.section-handle',
ghostClass: 'opacity-50',
onEnd: function () {
tempAdminContactsSectionsOrder = Array.from(contactsContainer.children).map(el => el.dataset.section);
}
});
}
}

} catch(e) {
console.error("Error populating admin form:", e);
}
}

async function loadAdminSettings() {
try {
const settings = await apiCall('getSettings', { adminPass: user.pass });
appMode = settings.appMode || 'combined';
companyStructure = settings.companyStructure || {};
populateAdminSettingsForm(settings);

if(settings.allContacts) {
companyContacts = settings.allContacts;
companyContacts.forEach(c => {
c.formattedName = window.formatContactName(c.name, c.dept);
});
fuseAllContacts = new Fuse(companyContacts, { keys:['formattedName', 'name', 'dept', 'phone'], threshold: 0.3 });
}
} catch (err) { alertError('login-alert', err.message); }
}

function renderDashboardFilterOrder() {
const list = document.getElementById('dashboard-filter-order-list');
if(!list) return;
list.innerHTML = tempDashboardDeptOrder.map((id) => `
<div data-id="${id}" class="flex justify-between items-center bg-white dark:bg-darksurface p-3 rounded-lg border border-gray-300 dark:border-darkborder shadow-sm cursor-grab">
<div class="flex items-center space-x-3 w-full">
<svg class="w-5 h-5 text-gray-400 dark:text-darkmuted handle cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
<span class="font-bold text-gray-700 dark:text-darktext">${id}</span>
</div>
</div>
`).join('');
if(window.dashFilterSortable) window.dashFilterSortable.destroy();
if (typeof Sortable !== 'undefined') {
window.dashFilterSortable = new Sortable(list, { animation: 150, handle: '.handle', ghostClass: 'opacity-50', onEnd: function () { tempDashboardDeptOrder = Array.from(list.children).map(el => el.dataset.id); } });
}
}

function renderMenuOrder() {
const list = document.getElementById('menu-order-list');
if(!list) return;
list.innerHTML = tempMenuOrder.map((id) => `
<div data-id="${id}" class="flex justify-between items-center bg-white dark:bg-darksurface p-3 rounded-lg border border-gray-300 dark:border-darkborder shadow-sm cursor-grab">
<div class="flex items-center space-x-3 w-full">
<svg class="w-5 h-5 text-gray-400 dark:text-darkmuted handle cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
<span class="font-bold text-gray-700 dark:text-darktext">${TAB_NAMES[id] || id}</span>
</div>
</div>
`).join('');
if(window.menuSortable) window.menuSortable.destroy();
if (typeof Sortable !== 'undefined') {
window.menuSortable = new Sortable(list, { animation: 150, handle: '.handle', ghostClass: 'opacity-50', onEnd: function () { tempMenuOrder = Array.from(list.children).map(el => el.dataset.id); } });
}
}

function renderTypicalEventTypes() {
const list = document.getElementById('typical-event-types-list');
if(!list) return;

const buildChips = (inputId) => {
const vars = ['{EventType}','{Name}','{Attendees}','{Department}','{Location}','{LocationDetails}','{Country}','{State}','{StartTime}','{EndTime}','{Remarks}','{EventDescription}'];
return `<div class="flex flex-wrap gap-1 mt-1.5 mb-2">` + 
 vars.map(v => `<button type="button" onclick="insertAtCursor('${inputId}', '${v}')" class="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition shadow-sm">${v}</button>`).join('') + 
 `</div>`;
};

let html = '';
tempTypicalEventTypes.forEach((t, i) => {
const safeName = t?.name || '';
const isFixed = FIXED_TYPICAL_EVENTS.includes(safeName);

let locHtml = '';
if (safeName === 'Generic' || safeName === 'Others') {
locHtml = `
<div class="flex-grow sm:flex-grow-0">
<select onchange="updateTypicalEventType(${i}, 'defaultLoc', this.value)" class="w-full sm:w-auto border border-gray-300 dark:border-gray-500 rounded-lg py-2 px-2 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white outline-none focus:border-blue-500 text-xs font-bold cursor-pointer shadow-sm">
<option value="In Camp" ${t.defaultLoc === 'In Camp' ? 'selected' : ''}>In Camp</option>
<option value="Out of Camp" ${t.defaultLoc === 'Out of Camp' ? 'selected' : ''}>Out of Camp</option>
</select>
</div>`;
}

let removeBtnHtml = '';
if (!isFixed) {
removeBtnHtml = `<button type="button" onclick="removeTypicalEventType(${i})" class="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition shrink-0 ml-1 border border-transparent hover:border-red-600 flex items-center justify-center" title="Remove"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
} else {
removeBtnHtml = `<div class="w-9 shrink-0 ml-1"></div>`;
}

if (!t.fields) t.fields = { location: {show:true,req:false}, locationDetails: {show:true,req:false}, attendees: {show:true,req:false}, remarks: {show:true,req:false,label:'Remarks'} };

let fieldConfigHtml = `
<div class="mt-3 pt-3 border-t border-gray-200 dark:border-darkborder text-sm hidden-view" id="event-type-fields-${i}">
<h4 class="font-bold text-gray-700 dark:text-gray-300 mb-2">Form Fields Configuration</h4>
<div class="grid grid-cols-2 md:grid-cols-4 gap-3">

<div class="bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded border border-gray-200 dark:border-gray-600">
<div class="font-bold mb-1 text-[11px] uppercase text-gray-500">Location</div>
<label class="flex items-center space-x-1 text-xs mb-1 cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'location', 'show', this.checked)" ${t.fields.location.show?'checked':''}> <span>Visible</span></label>
<label class="flex items-center space-x-1 text-xs cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'location', 'req', this.checked)" ${t.fields.location.req?'checked':''} ${!t.fields.location.show?'disabled':''}> <span>Required</span></label>
</div>

<div class="bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded border border-gray-200 dark:border-gray-600">
<div class="font-bold mb-1 text-[11px] uppercase text-gray-500">Location Details</div>
<label class="flex items-center space-x-1 text-xs mb-1 cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'locationDetails', 'show', this.checked)" ${t.fields.locationDetails.show?'checked':''}> <span>Visible</span></label>
<label class="flex items-center space-x-1 text-xs cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'locationDetails', 'req', this.checked)" ${t.fields.locationDetails.req?'checked':''} ${!t.fields.locationDetails.show?'disabled':''}> <span>Required</span></label>
</div>

<div class="bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded border border-gray-200 dark:border-gray-600">
<div class="font-bold mb-1 text-[11px] uppercase text-gray-500">Attendees</div>
<label class="flex items-center space-x-1 text-xs mb-1 cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'attendees', 'show', this.checked)" ${t.fields.attendees.show?'checked':''}> <span>Visible</span></label>
<label class="flex items-center space-x-1 text-xs cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'attendees', 'req', this.checked)" ${t.fields.attendees.req?'checked':''} ${!t.fields.attendees.show?'disabled':''}> <span>Required</span></label>
</div>

<div class="bg-gray-50 dark:bg-[#1a1a1a] p-2 rounded border border-gray-200 dark:border-gray-600">
<div class="font-bold mb-1 text-[11px] uppercase text-gray-500">Remarks</div>
<label class="flex items-center space-x-1 text-xs mb-1 cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'remarks', 'show', this.checked)" ${t.fields.remarks.show?'checked':''}> <span>Visible</span></label>
<label class="flex items-center space-x-1 text-xs mb-1 cursor-pointer"><input type="checkbox" onchange="updateEventTypeField(${i}, 'remarks', 'req', this.checked)" ${t.fields.remarks.req?'checked':''} ${!t.fields.remarks.show?'disabled':''}> <span>Required</span></label>
<input type="text" value="${t.fields.remarks.label || 'Remarks'}" onchange="updateEventTypeField(${i}, 'remarks', 'label', this.value)" class="w-full mt-1 border border-gray-300 dark:border-gray-500 rounded p-1 text-[10px] bg-white dark:bg-black outline-none font-bold" placeholder="Label">
</div>

</div>
</div>`;

let templatesHtml = `
<div class="w-full mt-2 pt-3 border-t border-gray-200 dark:border-darkborder hidden-view" id="event-type-tpl-${i}">
<h4 class="font-bold text-gray-700 dark:text-gray-300 mb-2">Display Templates Override</h4>
<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-1">
<div>
    <label class="block font-semibold text-[10px] uppercase text-gray-500 dark:text-darkmuted mb-1 tracking-wide">GCal Title Override</label>
    <input type="text" id="evt-tpl-gcal-${i}" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-xs outline-none focus:border-blue-500 transition" placeholder="Global default if blank" value="${t.gcalTemplate || ''}" onchange="updateTypicalEventType(${i}, 'gcalTemplate', this.value)">
    ${buildChips(`evt-tpl-gcal-${i}`)}
</div>
<div>
    <label class="block font-semibold text-[10px] uppercase text-gray-500 dark:text-darkmuted mb-1 tracking-wide">Agenda Title Override</label>
    <input type="text" id="evt-tpl-agenda-${i}" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-xs outline-none focus:border-blue-500 transition" placeholder="Global default if blank" value="${t.agendaTemplate || ''}" onchange="updateTypicalEventType(${i}, 'agendaTemplate', this.value)">
    ${buildChips(`evt-tpl-agenda-${i}`)}
</div>
<div>
    <label class="block font-semibold text-[10px] uppercase text-gray-500 dark:text-darkmuted mb-1 tracking-wide">Info All Title Override</label>
    <input type="text" id="evt-tpl-infoall-${i}" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-xs outline-none focus:border-blue-500 transition" placeholder="Global default if blank" value="${t.infoAllTemplate || ''}" onchange="updateTypicalEventType(${i}, 'infoAllTemplate', this.value)">
    ${buildChips(`evt-tpl-infoall-${i}`)}
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
<div>
    <label class="block font-semibold text-[10px] uppercase text-gray-500 dark:text-darkmuted mb-1 tracking-wide">Agenda Details Override</label>
    <textarea id="evt-tpl-agedet-${i}" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-xs outline-none focus:border-blue-500 transition resize-none" placeholder="Global default if blank. Enter a space ' ' to intentionally hide details." rows="2" onchange="updateTypicalEventType(${i}, 'agendaDetailsTemplate', this.value)">${t.agendaDetailsTemplate || ''}</textarea>
    ${buildChips(`evt-tpl-agedet-${i}`)}
</div>
<div>
    <label class="block font-semibold text-[10px] uppercase text-gray-500 dark:text-darkmuted mb-1 tracking-wide">Info All Details Override</label>
    <textarea id="evt-tpl-infdet-${i}" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-1.5 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-xs outline-none focus:border-blue-500 transition resize-none" placeholder="Global default if blank. Enter a space ' ' to intentionally hide details." rows="2" onchange="updateTypicalEventType(${i}, 'infoAllDetailsTemplate', this.value)">${t.infoAllDetailsTemplate || ''}</textarea>
    ${buildChips(`evt-tpl-infdet-${i}`)}
</div>
</div>
</div>
`;

let orderHtml = `
<div class="mt-3 pt-3 border-t border-gray-200 dark:border-darkborder text-sm hidden-view" id="event-type-order-${i}">
<h4 class="font-bold text-gray-700 dark:text-gray-300 mb-2">Form Field Order</h4>
<p class="text-[10px] text-gray-500 mb-2">Drag to reorder how fields appear when this event type is selected.</p>
<div id="sortable-field-order-${i}" class="space-y-1.5 flex flex-col">
`;

const defaultOrder = ['time', 'location', 'attendees', 'remarks', 'repeat', 'overseas'];
let currentOrder = t.fieldOrder || defaultOrder;

// Ensure missing blocks are appended to prevent UI loss from corrupted databases
const missingBlocks = defaultOrder.filter(b => !currentOrder.includes(b));
if (missingBlocks.length > 0) {
 currentOrder = [...currentOrder, ...missingBlocks];
 t.fieldOrder = currentOrder; 
}

const blockNames = {
'time': 'Start / End Time',
'location': 'Location',
'attendees': 'Attendees',
'remarks': 'Remarks',
'repeat': 'Repeat Options',
'overseas': 'Country / State'
};

currentOrder.forEach(block => {
if(blockNames[block]) {
    orderHtml += `
    <div data-id="${block}" class="flex items-center space-x-2 bg-gray-50 dark:bg-[#2a2a2a] p-2 rounded border border-gray-200 dark:border-gray-600 cursor-grab shadow-sm">
       <svg class="w-4 h-4 text-gray-400 dark:text-darkmuted field-handle shrink-0 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
       <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">${blockNames[block]}</span>
    </div>
    `;
}
});
orderHtml += `</div></div>`;

html += `
<div data-idx="${i}" class="flex flex-col gap-3 bg-white dark:bg-darksurface p-3 md:p-4 rounded-xl border border-gray-300 dark:border-darkborder shadow-sm ${!isFixed ? 'cursor-grab' : ''}">

<!-- ROW 1 -->
<div class="flex items-center gap-2 w-full flex-nowrap">
<svg class="w-6 h-6 text-gray-400 dark:text-darkmuted shrink-0 ${!isFixed ? 'handle-event-type cursor-grab' : 'hidden'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
${isFixed ? `<div class="w-6 shrink-0"></div>` : ''}

<input type="text" value="${safeName}" onchange="updateTypicalEventType(${i}, 'name', this.value)" class="flex-grow min-w-0 border-2 border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition text-sm md:text-base font-bold truncate" ${isFixed ? 'disabled' : ''}>

<select onchange="updateTypicalEventType(${i}, 'isEvent', this.value === 'true')" class="w-[120px] md:w-40 shrink-0 border-2 border-gray-300 dark:border-gray-600 rounded-lg py-2 px-2 bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white outline-none focus:border-blue-500 text-xs md:text-sm font-bold cursor-pointer">
<option value="true" ${t.isEvent ? 'selected' : ''}>Time-Bound</option>
<option value="false" ${!t.isEvent ? 'selected' : ''}>All/Half-Day</option>
</select>

${removeBtnHtml}
</div>

<!-- ROW 2 -->
<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full pl-8 mt-1">

<div class="flex flex-wrap items-center gap-2">
   <label class="flex items-center space-x-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700 cursor-pointer transition hover:bg-yellow-100 dark:hover:bg-yellow-900/40" title="If checked, this event type counts towards the Unit KAH out-of-office limit.">
     <input type="checkbox" onchange="updateTypicalEventType(${i}, 'isKahRelevant', this.checked)" class="w-4 h-4 text-yellow-600 cursor-pointer rounded border-gray-300 shrink-0" ${t.isKahRelevant ? 'checked' : ''}>
     <span class="text-xs font-bold text-yellow-800 dark:text-yellow-400 whitespace-nowrap">KAH Tracker</span>
   </label>
   ${locHtml ? `<div class="flex-grow sm:flex-grow-0">${locHtml}</div>` : ''}
</div>

<div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
 <button type="button" onclick="document.getElementById('event-type-order-${i}').classList.toggle('hidden-view')" class="flex-1 lg:flex-none flex justify-center items-center text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-2 rounded-lg transition text-xs font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 shadow-sm" title="Field Order">
    Order ↕️
 </button>
 <button type="button" onclick="document.getElementById('event-type-fields-${i}').classList.toggle('hidden-view')" class="flex-1 lg:flex-none flex justify-center items-center text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 px-3 py-2 rounded-lg transition text-xs font-bold whitespace-nowrap bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 shadow-sm" title="Configure Form Fields">
    Fields ⚙️
 </button>
 <button type="button" onclick="document.getElementById('event-type-tpl-${i}').classList.toggle('hidden-view')" class="flex-1 lg:flex-none flex justify-center items-center text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-2 rounded-lg transition text-xs font-bold whitespace-nowrap bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 shadow-sm" title="Specific Templates">
    Templates 📝
 </button>
</div>
</div>

${fieldConfigHtml}
${templatesHtml}
${orderHtml}
</div>
`;
});
list.innerHTML = html;

if(window.eventTypeSortable) window.eventTypeSortable.destroy();
if (typeof Sortable !== 'undefined') {
window.eventTypeSortable = new Sortable(list, { 
animation: 150, 
handle: '.handle-event-type', 
ghostClass: 'opacity-50', 
onEnd: function () { 
const newArr =[];
Array.from(list.children).forEach(el => {
newArr.push(tempTypicalEventTypes[parseInt(el.dataset.idx)]);
});
tempTypicalEventTypes = newArr;
renderTypicalEventTypes();
} 
});

tempTypicalEventTypes.forEach((t, i) => {
if(window['fieldOrderSortable' + i]) window['fieldOrderSortable' + i].destroy();
const orderList = document.getElementById(`sortable-field-order-${i}`);
if (orderList) {
window['fieldOrderSortable' + i] = new Sortable(orderList, {
    animation: 150,
    handle: '.field-handle',
    ghostClass: 'opacity-50',
    onEnd: function() {
        tempTypicalEventTypes[i].fieldOrder = Array.from(orderList.children).map(el => el.dataset.id);
    }
});
}
});
}
}

function addTypicalEventType() {
const nameInput = document.getElementById('new-typical-event-type');
const isEventInput = document.getElementById('new-typical-event-isEvent');
if(nameInput && nameInput.value.trim()) { 
const isEvent = isEventInput.value === 'true';
tempTypicalEventTypes.push({ 
name: nameInput.value.trim(), 
isEvent: isEvent,
isKahRelevant: false,
defaultLoc: '',
fields: {
location: {show: isEvent, req: false},
locationDetails: {show: isEvent, req: false},
attendees: {show: isEvent, req: false},
remarks: {show: true, req: false, label: 'Remarks'}
},
fieldOrder: ['time', 'location', 'attendees', 'remarks', 'repeat', 'overseas']
}); 
nameInput.value = ''; 
renderTypicalEventTypes(); 
}
}

function removeTypicalEventType(idx) { 
const item = tempTypicalEventTypes[idx];
if (FIXED_TYPICAL_EVENTS.includes(item.name)) return;
tempTypicalEventTypes.splice(idx, 1); 
renderTypicalEventTypes(); 
}

function updateTypicalEventType(idx, field, val) {
if (field === 'name' && FIXED_TYPICAL_EVENTS.includes(tempTypicalEventTypes[idx].name)) return;

if (['gcalTemplate', 'agendaTemplate', 'agendaDetailsTemplate', 'infoAllTemplate', 'infoAllDetailsTemplate'].includes(field)) {
if (val === '') {
 delete tempTypicalEventTypes[idx][field];
} else {
 tempTypicalEventTypes[idx][field] = val;
}
} else {
tempTypicalEventTypes[idx][field] = val;
}

if (field === 'isEvent') renderTypicalEventTypes(); 
}

function updateEventTypeField(idx, fieldKey, prop, val) {
if (!tempTypicalEventTypes[idx].fields) {
tempTypicalEventTypes[idx].fields = {
 location: {show: true, req: false},
 locationDetails: {show: true, req: false},
 attendees: {show: true, req: false},
 remarks: {show: true, req: false, label: 'Remarks'}
};
}
tempTypicalEventTypes[idx].fields[fieldKey][prop] = val;
if (prop === 'show' && !val) {
tempTypicalEventTypes[idx].fields[fieldKey].req = false;
}
renderTypicalEventTypes();
}

function renderAcronyms() {
const list = document.getElementById('acronyms-list');
if(!list) return;
let html = '';
for (let key in tempAcronyms) {
const acr = tempAcronyms[key];
html += `
<div class="flex items-center space-x-2 bg-white dark:bg-darksurface p-2 rounded-lg border border-gray-300 dark:border-darkborder shadow-sm mb-2">
<span class="font-bold w-1/4 text-sm text-yellow-700 dark:text-yellow-500 truncate" title="${key}">${key}</span>
<span class="text-gray-400 dark:text-darkmuted w-4 text-center shrink-0">➔</span>
<span class="flex-grow w-1/2 text-sm text-gray-800 dark:text-gray-200 truncate" title="${acr.full}">${acr.full}</span>

<label class="flex items-center cursor-pointer shrink-0 ml-2" title="Toggle Active Status">
<div class="relative">
<input type="checkbox" class="sr-only" ${acr.active ? 'checked' : ''} onchange="toggleAcronymActive('${key}')">
<div class="block bg-gray-300 dark:bg-gray-600 w-8 h-5 rounded-full transition-colors ${acr.active ? 'bg-green-500 dark:bg-green-600' : ''}"></div>
<div class="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${acr.active ? 'transform translate-x-3' : ''}"></div>
</div>
</label>

<button type="button" onclick="removeAcronym('${key}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded p-1.5 shrink-0 ml-1 transition" title="Delete">
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
</button>
</div>`;
}
list.innerHTML = html || '<p class="text-sm text-gray-500 dark:text-darkmuted italic py-3 text-center">No acronyms added yet.</p>';
}

function toggleAcronymActive(key) {
if (tempAcronyms[key]) {
tempAcronyms[key].active = !tempAcronyms[key].active;
renderAcronyms();
}
}

function addAcronym() {
const keyInput = document.getElementById('new-acronym-key');
const valInput = document.getElementById('new-acronym-val');
const key = keyInput.value.trim().toUpperCase();
const val = valInput.value.trim();
if (key && val) {
tempAcronyms[key] = { full: val, active: true };
keyInput.value = '';
valInput.value = '';
renderAcronyms();
}
}

function removeAcronym(key) {
delete tempAcronyms[key];
renderAcronyms();
}

function searchKAH() {
const q = document.getElementById('kah-search').value;
const resC = document.getElementById('kah-results');
if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
if(results.length > 0) {
resC.innerHTML = results.map(c => `<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover" onclick="addKAH('${c.phone}', '${c.name.replace(/'/g, "\\'")}', '${c.dept}')"><span class="font-semibold">${c.formattedName}</span></div>`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
}
}

function addKAH(phone, name, dept) {
if(!adminKAHList.some(k => k.phone === phone)) { adminKAHList.push({ phone, name, dept }); renderKAHSelected(); }
document.getElementById('kah-search').value = '';
document.getElementById('kah-results').classList.add('hidden-view');
}

function removeKAH(phone) { adminKAHList = adminKAHList.filter(k => k.phone !== phone); renderKAHSelected(); }

function renderKAHSelected() {
const list = document.getElementById('kah-selected-list');
if(!list) return;
if (adminKAHList.length === 0) {
list.innerHTML = `<p class="text-gray-500 dark:text-darkmuted text-sm text-center italic py-2">No unit KAH personnel added yet.</p>`;
return;
}

const grouped = {};
adminKAHList.forEach(k => {
const d = k.dept.toUpperCase();
let parent = d;
let child = null;
if (d.includes('-')) {
const parts = d.split('-');
parent = parts[0];
child = parts.slice(1).join('-');
}

if (!grouped[parent]) grouped[parent] = {};
if (child) {
if (!grouped[parent][child]) grouped[parent][child] =[];
grouped[parent][child].push(k);
} else {
if (!grouped[parent]['_direct']) grouped[parent]['_direct'] =[];
grouped[parent]['_direct'].push(k);
}
});

let html = '';
for (const parent in grouped) {
html += `<div class="mb-4"><h4 class="font-bold text-lg text-gray-800 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600 pb-1 mb-2">${parent}</h4>`;

if (grouped[parent]['_direct']) {
html += `<div class="space-y-1">`;
grouped[parent]['_direct'].forEach(k => {
html += `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border border-gray-300 dark:border-darkborder shadow-sm pl-4"><span class="font-medium">${k.name} <span class="text-xs text-gray-500 ml-1">(${k.dept})</span></span><button onclick="removeKAH('${k.phone}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg font-bold px-3 transition">&times;</button></div>`;
});
html += `</div>`;
}

for (const child in grouped[parent]) {
if (child !== '_direct') {
html += `<h5 class="font-semibold text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1 pl-2 border-l-2 border-blue-400">${child}</h5><div class="space-y-1">`;
grouped[parent][child].forEach(k => {
html += `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border border-gray-300 dark:border-darkborder shadow-sm pl-4"><span class="font-medium">${k.name} <span class="text-xs text-gray-500 ml-1">(${k.dept})</span></span><button onclick="removeKAH('${k.phone}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg font-bold px-3 transition">&times;</button></div>`;
});
html += `</div>`;
}
}
html += `</div>`;
}
list.innerHTML = html;
}

function updateKahGroupCalendarName(idx, newName) {
if (!newName.trim()) return;
customKahGroups[idx].calendarName = newName.trim();
}

async function backfillKahGroupCalendar(idx) {
const g = customKahGroups[idx];
if (!g.calendarName) g.calendarName = g.name;
if (!confirm(`This will scan all historical records and sync them into the dedicated Google Calendar "${g.calendarName}". Proceed?`)) return;
showLoader(true);
try {
await apiCall('backfillCustomCalendar', { adminPass: user.pass, calendarName: g.calendarName, members: g.members });
alert("Calendar successfully synced with past events!");
} catch(e) {
alert("Error syncing past events: " + e.message);
} finally {
showLoader(false);
}
}

function renderCustomKahGroups() {
const container = document.getElementById('custom-kah-groups-list');
if (!container) return;
container.innerHTML = customKahGroups.map((g, i) => `
<div class="border border-gray-300 dark:border-darkborder rounded-xl p-3 bg-gray-50 dark:bg-darkinput shadow-sm mb-3">
<div class="flex justify-between items-center mb-2 border-b border-gray-300 dark:border-darkborder pb-1.5">
<span class="font-bold text-blue-700 dark:text-blue-400 text-base">zz KAH: ${g.name}</span>
<button onclick="removeCustomKahGroup(${i})" class="text-red-500 hover:text-red-700 text-xs font-bold transition">Delete Group</button>
</div>
<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 gap-2">
<div class="flex items-center space-x-2 w-full sm:w-auto">
 <input type="checkbox" id="kah-group-cal-${i}" class="w-4 h-4 text-blue-600 rounded cursor-pointer" ${g.hasCalendar ? 'checked' : ''} onchange="toggleKahGroupCalendar(${i}, this.checked)">
 <label for="kah-group-cal-${i}" class="text-xs font-bold text-blue-800 dark:text-blue-300 cursor-pointer">Enable Dedicated Group Calendar</label>
</div>
${g.hasCalendar ? `
<div class="flex items-center space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
 <input type="text" id="kah-group-cal-name-${i}" value="${g.calendarName || g.name}" onchange="updateKahGroupCalendarName(${i}, this.value)" class="text-[11px] font-bold text-blue-900 dark:text-blue-100 bg-white dark:bg-darksurface px-2 py-1.5 rounded shadow-sm border border-blue-300 dark:border-blue-700 outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-36" placeholder="Calendar Name">
 <button type="button" onclick="backfillKahGroupCalendar(${i})" class="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded font-bold transition shadow-sm whitespace-nowrap shrink-0 border border-transparent">Sync Past Events</button>
</div>` : ''}
</div>
<div class="space-y-1.5 mb-3">
${g.members.map(phone => {
const contact = companyContacts.find(c => String(c.phone) === String(phone));
const name = contact ? contact.name : phone;
const dept = contact ? contact.dept : '';
return `<div class="flex justify-between items-center bg-white dark:bg-darksurface p-2 rounded-lg border border-gray-300 dark:border-darkborder shadow-sm text-sm"><span class="font-medium truncate">${name} <span class="text-xs text-gray-500 font-normal ml-1">(${dept})</span></span> <button onclick="removeKahGroupMember(${i}, '${phone}')" class="text-red-500 font-bold px-2">&times;</button></div>`;
}).join('')}
${g.members.length === 0 ? '<p class="text-xs text-gray-500 dark:text-darkmuted italic text-center py-1">No members added yet.</p>' : ''}
</div>
<div class="relative">
<input type="text" id="kah-group-search-${i}" placeholder="Add personnel to group..." class="w-full text-sm py-1.5 px-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg outline-none shadow-sm focus:border-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white transition" autocomplete="off" onkeyup="searchKahGroupMember(${i})">
<div id="kah-group-results-${i}" class="absolute z-40 w-full bg-white dark:bg-darksurface border-x border-b border-gray-300 dark:border-darkborder rounded-b-lg shadow-xl max-h-32 overflow-y-auto hidden-view"></div>
</div>
</div>
`).join('');
}

function addCustomKahGroup() {
const input = document.getElementById('new-kah-group-name');
const name = input.value.trim();
if (name) {
if (customKahGroups.some(g => g.name.toLowerCase() === name.toLowerCase())) return alert("Group name already exists.");
customKahGroups.push({ name: name, members:[], hasCalendar: false, calendarName: '' });
input.value = '';
renderCustomKahGroups();
}
}

async function removeCustomKahGroup(idx) {
const g = customKahGroups[idx];
if (confirm("Are you sure you want to delete this custom group?")) {
if (g.hasCalendar) {
 if (confirm(`This group has a dedicated Google Calendar ("${g.calendarName || g.name}"). Do you also want to PERMANENTLY DELETE this calendar and all its events? (Click Cancel to keep the calendar but delete the group)`)) {
    showLoader(true);
    try {
      await apiCall('deleteCalendar', { adminPass: user.pass, calendarName: g.calendarName || g.name });
    } catch(e) {
      alert("Error deleting calendar: " + e.message);
    } finally {
      showLoader(false);
    }
 }
}
customKahGroups.splice(idx, 1);
renderCustomKahGroups();
}
}

async function toggleKahGroupCalendar(idx, isChecked) {
const g = customKahGroups[idx];
if (isChecked) {
g.hasCalendar = true;
g.calendarName = g.name; 
renderCustomKahGroups();
} else {
if (confirm(`Are you sure you want to disable and PERMANENTLY DELETE the dedicated Google Calendar for "${g.name}"? This action cannot be undone and will wipe all past events in it.`)) {
 showLoader(true);
 try {
   await apiCall('deleteCalendar', { adminPass: user.pass, calendarName: g.calendarName || g.name });
   g.hasCalendar = false;
   g.calendarName = '';
   renderCustomKahGroups();
   alert("Calendar successfully deleted.");
 } catch(e) {
   alert("Error deleting calendar: " + e.message);
   renderCustomKahGroups(); 
 } finally {
   showLoader(false);
 }
} else {
 renderCustomKahGroups(); 
}
}
}

function searchKahGroupMember(idx) {
const q = document.getElementById(`kah-group-search-${idx}`).value;
const resC = document.getElementById(`kah-group-results-${idx}`);
if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }

const results = fuseAllContacts.search(q).slice(0, 4).map(r => r.item);
if(results.length > 0) {
resC.innerHTML = results.map(c => `<div class="p-2 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover text-sm" onclick="addKahGroupMember(${idx}, '${c.phone}')"><span class="font-semibold">${c.formattedName}</span></div>`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-2 text-gray-500 text-sm">No match found</div>`; resC.classList.remove('hidden-view');
}
}

function addKahGroupMember(idx, phone) {
if (!customKahGroups[idx].members.includes(String(phone))) {
customKahGroups[idx].members.push(String(phone));
renderCustomKahGroups();
}
}

function removeKahGroupMember(idx, phone) {
customKahGroups[idx].members = customKahGroups[idx].members.filter(p => String(p) !== String(phone));
renderCustomKahGroups();
}

function searchUserToManage() {
const q = document.getElementById('admin-manage-search').value;
const resC = document.getElementById('admin-manage-results');
if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }

const results = fuseAllContacts.search(q).slice(0, 5).map(r => r.item);
if(results.length > 0) {
resC.innerHTML = results.map(c => `<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400" onclick="selectUserToManage('${c.resourceName}', '${c.name.replace(/'/g, "\\'")}', '${c.phone}', '${c.dept}', '${c.birthday || ''}')"><span class="font-semibold">${c.formattedName}</span></div>`).join('');
resC.classList.remove('hidden-view');
} else {
resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
}
}

function selectUserToManage(resourceName, name, phone, dept, birthday) {
userToManageResource = resourceName;
document.getElementById('edit-user-name').value = name;
document.getElementById('edit-user-mobile').value = phone;

const primaryDept = dept ? dept.split(',')[0].trim().toUpperCase() : '';
document.getElementById('edit-user-unit').value = primaryDept;

if (birthday) {
const parts = birthday.split('-');
appData.manageUser.birthdayD = new Date(parts[0], parseInt(parts[1])-1, parts[2]);
appData.manageUser.birthdaySelected = true;
} else {
appData.manageUser.birthdayD = new Date(2000, 0, 1);
appData.manageUser.birthdaySelected = false;
}
updateButtonLabels();

document.getElementById('user-to-manage-container').classList.remove('hidden-view');
document.getElementById('admin-manage-search').value = '';
document.getElementById('admin-manage-search').classList.add('hidden-view');
document.getElementById('admin-manage-results').classList.add('hidden-view');
}

function cancelManageUser() {
userToManageResource = null;
document.getElementById('user-to-manage-container').classList.add('hidden-view');
document.getElementById('admin-manage-search').classList.remove('hidden-view');
}

async function confirmUpdateUser() {
if (!userToManageResource) return;
const name = document.getElementById('edit-user-name').value.trim();
const mobile = document.getElementById('edit-user-mobile').value.trim();
const unit = document.getElementById('edit-user-unit').value;

if (!name || !mobile || !unit) return alert("Please fill in all fields.");
if (!appData.manageUser.birthdaySelected) return alert("Please select a Birthday.");

const bday = appData.manageUser.birthdayD;
const bdayStr = `${bday.getFullYear()}-${String(bday.getMonth()+1).padStart(2,'0')}-${String(bday.getDate()).padStart(2,'0')}`;

showLoader(true);
try {
await apiCall('updateUser', { adminPass: user.pass, resourceName: userToManageResource, fullName: name, mobile: mobile, unit: unit, birthday: bdayStr });
alert("User successfully updated.");
cancelManageUser(); await loadAdminSettings();
} catch(e) { alert("Error updating user: " + e.message); } finally { showLoader(false); }
}

async function confirmDeleteUser() {
if (!userToManageResource) return;
if (!confirm("Are you sure you want to permanently remove this user from the system and Google Contacts? This cannot be undone.")) return;
showLoader(true);
try {
await apiCall('deleteUser', { adminPass: user.pass, resourceName: userToManageResource });
alert("User successfully removed.");
cancelManageUser(); await loadAdminSettings();
} catch(e) { alert("Error deleting user: " + e.message); } finally { showLoader(false); }
}

function submitAdminRegister() { handleRegister('admin'); }

// ==========================================
// Save Functions for Admin Sections
// ==========================================

async function saveAdminSettings() {
showLoader(true);
const newPass = document.getElementById('set-admin-pass') ? document.getElementById('set-admin-pass').value : null;
let selectedMode = 'combined';
document.getElementsByName('app-mode').forEach(r => { if(r.checked) selectedMode = r.value; });

const payload = {
adminPass: user.pass, newAdminPass: newPass, appMode: selectedMode,
landingPage: document.getElementById('set-landing-page') ? document.getElementById('set-landing-page').value : 'dashboard',
dashboardDeptOrder: tempDashboardDeptOrder,
contactNameFormat: document.getElementById('set-contact-format') ? document.getElementById('set-contact-format').value.trim() : '{Name} (Cloud Group : {Unit})',
userKeyword: document.getElementById('set-user-keyword') ? document.getElementById('set-user-keyword').value.trim() : 'peace',
menuOrder: tempMenuOrder,
adminSectionsOrder: tempAdminSectionsOrder,
adminContactsSectionsOrder: tempAdminContactsSectionsOrder
};

try {
await apiCall('saveSettings', payload);
alert("Settings successfully saved! App will reload to apply UI changes.");
if(newPass) { user.pass = newPass; localStorage.setItem('user', JSON.stringify(user)); }
window.location.reload(); 
} catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function saveEventTemplates() {
showLoader(true);
const payload = {
adminPass: user.pass,
typicalEventTypes: tempTypicalEventTypes,
gcalTemplate: document.getElementById('set-gcal-template').value.trim(),
agendaTemplate: document.getElementById('set-agenda-template').value.trim(),
agendaDetailsTemplate: document.getElementById('set-agenda-details-template').value.trim(),
infoAllTemplate: document.getElementById('set-infoall-template').value.trim(),
infoAllDetailsTemplate: document.getElementById('set-infoall-details-template').value.trim()
};
try {
await apiCall('saveSettings', payload);
alert("Event Types & Templates successfully saved! App will reload to apply changes.");
window.location.reload();
} catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function saveAcronyms() {
showLoader(true);
const payload = {
adminPass: user.pass,
acronyms: tempAcronyms
};
try {
await apiCall('saveSettings', payload);
alert("Acronyms successfully saved! App will reload to apply changes.");
window.location.reload();
} catch (err) { alert("Error: " + err.message); showLoader(false); }
}

async function saveKahSettings() {
showLoader(true);
const payload = {
adminPass: user.pass,
kahLimit: document.getElementById('set-kah-limit').value,
approvingAuthority: document.getElementById('set-appr-email').value,
kahList: adminKAHList,
customKahGroups: customKahGroups,
kahEmailSubject: document.getElementById('set-kah-subject').value.trim(),
kahEmailBody: document.getElementById('set-kah-body').value.trim()
};

try {
await apiCall('saveSettings', payload);
alert("KAH Settings successfully saved! App will reload to apply changes.");
window.location.reload();
} catch (err) { alert("Error: " + err.message); showLoader(false); }
}

// ==========================================
// Google Calendar Access Rights Management
// ==========================================

async function renderGcalAccessUI() {
const container = document.getElementById('gcal-access-container');
if (!container) return;

if (!calendarAclsCache) {
container.innerHTML = `<div class="flex justify-center items-center py-10"><div class="spinner"></div></div>`;
try {
calendarAclsCache = await apiCall('getCalendarAcls', { adminPass: user.pass });
// Sort alphabetically by summary
calendarAclsCache.sort((a, b) => (a.summary || '').localeCompare(b.summary || ''));
} catch (e) {
container.innerHTML = `<p class="text-red-500 text-center py-5">Error fetching calendars: ${e.message}</p>`;
return;
}
}

let html = '';
calendarAclsCache.forEach((cal, cIdx) => {
const isGroup = cal.id.includes('group.calendar.google.com');
html += `
<div class="bg-white dark:bg-darksurface border border-gray-200 dark:border-darkborder rounded-2xl p-4 md:p-6 mb-4 shadow-sm relative">
<h3 class="font-extrabold text-lg text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-darkborder pb-2">${cal.summary} <span class="text-xs text-gray-400 font-normal ml-2 break-all inline-block align-middle max-w-full">(${cal.id})</span></h3>
<div class="space-y-3 mb-5">
`;

if (cal.acls && cal.acls.length > 0) {
// Sort ACLs: Owners first, then writers, then readers
const roleWeights = { 'owner': 1, 'writer': 2, 'reader': 3, 'freeBusyReader': 4 };
const sortedAcls = [...cal.acls].sort((a, b) => (roleWeights[a.role] || 99) - (roleWeights[b.role] || 99));

sortedAcls.forEach((acl, aIdx) => {
const badgeColors = {
  'owner': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'writer': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'reader': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'freeBusyReader': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
};
const colorClass = badgeColors[acl.role] || badgeColors['freeBusyReader'];
const typeLabel = acl.type === 'default' ? 'Public (Anyone)' : (acl.type === 'user' ? 'User' : acl.type);

html += `
<div class="flex items-center justify-between bg-gray-50 dark:bg-darkinput p-3 rounded-xl border border-gray-200 dark:border-gray-700">
<div class="min-w-0 flex-1 pr-4">
<p class="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">${acl.value || typeLabel}</p>
<p class="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">${acl.type}</p>
</div>
<div class="flex items-center shrink-0 space-x-3">
<span class="px-2.5 py-1 rounded-md text-xs font-bold ${colorClass} uppercase tracking-wide">${acl.role}</span>
<button type="button" onclick="removeCalendarAcl(${cIdx}, '${acl.id}')" class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition" title="Remove Access">
<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
</button>
</div>
</div>
`;
});
} else {
html += `<p class="text-sm text-gray-500 italic">No access rules found.</p>`;
}

html += `
</div>
<div class="bg-gray-50 dark:bg-darkinput p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-end">
<div class="w-full md:flex-1 min-w-0">
<label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Share with specific person</label>
<input type="email" id="new-acl-email-${cIdx}" placeholder="Enter Google Account Email" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white">
</div>
<div class="w-full md:w-48 shrink-0">
<label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Permission</label>
<select id="new-acl-role-${cIdx}" class="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-sm outline-none cursor-pointer focus:border-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white">
<option value="reader">See all event details</option>
<option value="writer">Make changes to events</option>
<option value="owner">Make changes & manage sharing</option>
</select>
</div>
<button type="button" onclick="addCalendarAcl(${cIdx}, 'user')" class="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg transition shadow-sm border border-transparent text-sm h-[42px]">Add Person</button>
</div>

<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Public Link (Make calendar public)</span>
<button type="button" onclick="addCalendarAcl(${cIdx}, 'default', 'reader')" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-1.5 px-4 rounded-lg transition text-xs border border-transparent">Make Public Reader</button>
</div>

</div>
`;
});

container.innerHTML = html;
}

async function addCalendarAcl(cIdx, type, roleOverride) {
const cal = calendarAclsCache[cIdx];
let email = '';
let role = roleOverride || 'reader';

if (type === 'user') {
email = document.getElementById(`new-acl-email-${cIdx}`).value.trim();
role = document.getElementById(`new-acl-role-${cIdx}`).value;
if (!email) return alert("Please enter an email address.");
}

showLoader(true);
try {
await apiCall('addCalendarAcl', { adminPass: user.pass, calendarId: cal.id, type: type, email: email, role: role });
calendarAclsCache = null; // Invalidate cache
await renderGcalAccessUI();
} catch (e) {
alert(e.message);
} finally {
showLoader(false);
}
}

async function removeCalendarAcl(cIdx, ruleId) {
if (!confirm("Are you sure you want to remove this permission rule?")) return;
const cal = calendarAclsCache[cIdx];

showLoader(true);
try {
await apiCall('removeCalendarAcl', { adminPass: user.pass, calendarId: cal.id, ruleId: ruleId });
calendarAclsCache = null; // Invalidate cache
await renderGcalAccessUI();
} catch (e) {
alert(e.message);
} finally {
showLoader(false);
}
}