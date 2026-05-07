// ==========================================
// Form Handling & Fuzzy Search Dropdowns
// ==========================================

function toggleInfoAll(forceState) {
 isInfoAll = forceState !== undefined ? forceState : !isInfoAll;['form-event-infoall-btn', 'form-combined-infoall-btn'].forEach(id => {
     const btn = document.getElementById(id);
     if(!btn) return;
     if(isInfoAll) {
         btn.classList.add('bg-blue-100', 'dark:bg-blue-900/40', 'text-blue-700', 'dark:text-blue-300', 'border-blue-400', 'dark:border-blue-600');
         btn.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-gray-300', 'dark:border-gray-500');
     } else {
         btn.classList.remove('bg-blue-100', 'dark:bg-blue-900/40', 'text-blue-700', 'dark:text-blue-300', 'border-blue-400', 'dark:border-blue-600');
         btn.classList.add('text-gray-500', 'dark:text-gray-400', 'border-gray-300', 'dark:border-gray-500');
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

function toggleCombinedFields() {
 const typeInput = document.getElementById('form-combined-type');
 if(!typeInput) return;
 const val = typeInput.value;
 const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === val) : null;
 const isEvent = typeObj ? typeObj.isEvent : true;

 const eventFields = document.getElementById('combined-event-fields');
 const leaveFields = document.getElementById('combined-leave-fields');
 const locationInput = document.getElementById('form-combined-location');
 const coverInput = document.getElementById('form-combined-cover');
 const btnInfoAll = document.getElementById('form-combined-infoall-btn');
 const remarksInput = document.getElementById('form-combined-remarks');
 const remarksLabel = document.getElementById('label-combined-remarks');
 
 if (isEvent) {
   eventFields.classList.remove('hidden-view');
   leaveFields.classList.add('hidden-view');
   btnInfoAll.classList.remove('hidden-view');
   coverInput.required = false;
   
   if (!locationInput.value || locationInput.value.trim() === '') {
     locationInput.value = typeObj && typeObj.defaultLoc ? typeObj.defaultLoc : 'Office';
   }
   
   if (val === 'Meeting') {
       remarksInput.required = true;
       remarksInput.placeholder = "Enter meeting agenda/description (Required)";
       remarksLabel.innerHTML = 'Meeting Description <span class="text-red-500">*</span>';
   } else {
       remarksInput.required = false;
       remarksInput.placeholder = "";
       remarksLabel.innerHTML = 'Remarks <span class="text-[10px] font-normal text-gray-500">(Optional)</span>';
   }
 } else {
   eventFields.classList.add('hidden-view');
   leaveFields.classList.remove('hidden-view');
   btnInfoAll.classList.add('hidden-view');
   coverInput.required = true;
   remarksInput.required = false;
   remarksInput.placeholder = "";
   remarksLabel.innerHTML = 'Remarks <span class="text-[10px] font-normal text-gray-500">(Optional)</span>';
   
   const overseas = document.getElementById('combined-overseas-fields');
   const cInput = document.getElementById('form-combined-country');
   if (val === 'Overseas Leave' || val === 'Official Trip') { 
     overseas.classList.remove('hidden-view'); cInput.required = true; 
   } else { 
     overseas.classList.add('hidden-view'); cInput.required = false; 
   }
 }
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
       <span class="font-semibold text-emerald-800 dark:text-emerald-300">${c.name}</span> <span class="text-xs text-gray-500 dark:text-darkmuted ml-1">(${c.dept})</span>
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
   <span>Submitting for: ${name} <span class="text-sm font-normal text-emerald-600">(${dept})</span></span>
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
     <div class="p-3 border-b border-gray-200 dark:border-darkborder cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30" onclick="selectAttendee('${ctx}', '${item.id}', '${item.name.replace(/'/g, "\\'")}', '${item.dept}', '${item.type}')">
       <span class="font-semibold text-blue-800 dark:text-blue-300">${item.name}</span> <span class="text-xs text-gray-500 dark:text-darkmuted ml-1">(${item.dept})</span>
     </div>
   `).join('');
   resC.classList.remove('hidden-view');
 } else {
   resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
 }
}

function selectAttendee(ctx, id, name, dept, type) {
 if (!eventAttendees.some(a => a.id === id)) { 
   eventAttendees.push({ id, name, dept, type }); 
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
       ${a.name}
       <button type="button" onclick="removeAttendee('${ctx}', '${a.id}')" class="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-500 focus:outline-none">&times;</button>
     </div>
   `).join('');
 }
}

// --- Covering Person Form Logic ---
function searchCovering(ctx) {
 const inputEl = document.getElementById(`form-${ctx}-cover`);
 const q = inputEl.value;
 const resC = document.getElementById(`cover-results-${ctx}`);
 
 if(!q || !fuseAllContacts) { 
     resC.classList.add('hidden-view'); 
     inputEl.classList.remove('ring-2', 'ring-blue-500');
     return; 
 }
 
 inputEl.classList.add('ring-2', 'ring-blue-500');
 const uniques =[...new Set(fuseAllContacts._docs.map(d=>d.name))];
 const quickFuse = new Fuse(uniques.map(name => ({name})), {keys:['name'], threshold: 0.3});
 
 const results = quickFuse.search(q).slice(0, 5).map(r => r.item.name);
 if (results.length > 0) {
   resC.innerHTML = results.map(n => `<div class="p-3 border-b border-gray-200 dark:border-darkborder cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium text-blue-800 dark:text-blue-300" onclick="selectCovering('${ctx}', '${n.replace(/'/g, "\\'")}')">${n}</div>`).join('');
   resC.classList.remove('hidden-view');
 } else {
   resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
 }
}

function selectCovering(ctx, name) { 
 const inputEl = document.getElementById(`form-${ctx}-cover`);
 inputEl.value = name; 
 inputEl.classList.remove('ring-2', 'ring-blue-500');
 document.getElementById(`cover-results-${ctx}`).classList.add('hidden-view'); 
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
 if (typeEl) typeEl.value = l.LeaveType;
 
 if (appMode === 'combined') {
     toggleCombinedFields();
 } else if (!isEvent) {
     toggleOverseasFields('leave');
 }

 if (isEvent) {
   appData[ctx].isAllDay = l.IsAllDay === 'TRUE';
   appData[ctx].untilD = l.UntilDate ? new Date(l.UntilDate) : new Date(l.EndDate);
   document.getElementById(`form-${ctx}-allday`).checked = appData[ctx].isAllDay;
   document.getElementById(`form-${ctx}-location`).value = l.Location || 'Office';
   document.getElementById(`form-${ctx}-repeat`).value = l.HalfDay || 'NONE'; 
   toggleInfoAll(l.InfoAll === 'TRUE');
   toggleRepeatUntil(ctx);
   
   eventAttendees =[];
   if(l.Attendees) {
     try {
       eventAttendees = JSON.parse(l.Attendees);
     } catch(e) {
       const savedPhones = String(l.Attendees).split(',');
       savedPhones.forEach(ph => {
         const contact = companyContacts.find(c => String(c.phone) === String(ph));
         if(contact) eventAttendees.push({ id: contact.phone, name: contact.name, dept: contact.dept, type: 'contact' });
       });
     }
   }
   renderAttendees(ctx);
 } else {
   document.getElementById(`form-${ctx}-cover`).value = l.CoveringPerson;
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
 else toggleOverseasFields('leave');

 toggleInfoAll(false);
 toggleRepeatUntil('event');
 toggleRepeatUntil('combined');
 
 clearBehalf('leave');
 clearBehalf('event');
 clearBehalf('combined');
 
 eventAttendees =[]; 
 renderAttendees('event');
 renderAttendees('combined');

 ['leave', 'event', 'combined'].forEach(ctx => {
     const btn = document.getElementById(`submit-${ctx}-btn`);
     const cancelBtn = document.getElementById(`cancel-edit-${ctx}-btn`);
     if (btn) btn.innerText = "Save Record";
     if (cancelBtn) cancelBtn.classList.add('hidden-view');
 });

 switchTab(appMode === 'unified' ? 'dashboard' : 'my-leaves');
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

function toggleOverseasFields(ctx) {
 const type = document.getElementById(`form-${ctx}-type`).value;
 const el = document.getElementById(`${ctx}-overseas-fields`);
 const cInput = document.getElementById(`form-${ctx}-country`);
 if (type === 'Overseas Leave' || type === 'Official Trip') { 
   el.classList.remove('hidden-view'); cInput.required = true; 
 } else { 
   el.classList.add('hidden-view'); cInput.required = false; cInput.value = ''; document.getElementById(`form-${ctx}-state`).value = ''; 
 }
}

async function submitForm(ctx) {
 showLoader(true);
 
 let targetName = user.name;
 let targetPhone = user.phone;
 let targetDepts = new Set(user.departments ||[]);

 if (user.role === 'admin' && adminBehalfUser) {
   targetName = adminBehalfUser.name;
   targetPhone = adminBehalfUser.phone;
   targetDepts = new Set([adminBehalfUser.dept]);
 } else if (user.role === 'admin' && !adminBehalfUser) {
   alert("Admin: Please select a user to submit on behalf of.");
   showLoader(false); return;
 }

 const typeValue = document.getElementById(`form-${ctx}-type`) ? document.getElementById(`form-${ctx}-type`).value : document.getElementById(`form-${ctx}-name`).value;
 const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === typeValue) : null;
 const isEvent = ctx === 'event' || (ctx === 'combined' && typeObj && typeObj.isEvent);

 if (!isEvent) {
   const coverInput = document.getElementById(`form-${ctx}-cover`).value.trim();
   if (!validContactNames.includes(coverInput.toLowerCase())) {
     alert("Please select a valid Covering Person from the dropdown list.");
     showLoader(false); return;
   }
 }

 const toLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
 const sDate = toLocalISO(appData[ctx].startD);
 const eDate = toLocalISO(appData[ctx].endD);
 
 let calculatedHalfDay = 'None';
 let loc = '';
 let finalAttendeesStr = '';
 let finalInfoAll = false;
 let eventIsAllDay = false;
 let eventUntilDate = '';
 let coveringPerson = 'N/A';
 let country = '';
 let state = '';

 if (!isEvent) {
   const isSameDay = appData[ctx].startD.toDateString() === appData[ctx].endD.toDateString();
   if (isSameDay) {
     if (appData[ctx].startAMPM === 'AM' && appData[ctx].endAMPM === 'AM') calculatedHalfDay = 'AM';
     else if (appData[ctx].startAMPM === 'PM' && appData[ctx].endAMPM === 'PM') calculatedHalfDay = 'PM';
   } else {
     if (appData[ctx].startAMPM === 'PM' && appData[ctx].endAMPM === 'AM') calculatedHalfDay = 'Start PM, End AM';
     else if (appData[ctx].startAMPM === 'PM') calculatedHalfDay = 'Start PM';
     else if (appData[ctx].endAMPM === 'AM') calculatedHalfDay = 'End AM';
   }
   coveringPerson = document.getElementById(`form-${ctx}-cover`).value.trim();
   country = document.getElementById(`form-${ctx}-country`) ? document.getElementById(`form-${ctx}-country`).value : '';
   state = document.getElementById(`form-${ctx}-state`) ? document.getElementById(`form-${ctx}-state`).value : '';
 } else {
   calculatedHalfDay = document.getElementById(`form-${ctx}-repeat`).value; 
   loc = document.getElementById(`form-${ctx}-location`).value;
   finalInfoAll = isInfoAll;
   eventIsAllDay = appData[ctx].isAllDay;
   
   if (calculatedHalfDay !== 'NONE') {
     eventUntilDate = toLocalISO(appData[ctx].untilD);
   }
   
   eventAttendees.forEach(a => { 
       if (a.dept !== 'Custom') targetDepts.add(a.dept); 
   });
   finalAttendeesStr = JSON.stringify(eventAttendees);
 }

 const payload = {
   id: currentEditId, name: targetName, phone: targetPhone, departments: Array.from(targetDepts),
   leaveType: typeValue,
   startDate: sDate, endDate: eDate, halfDay: calculatedHalfDay, 
   coveringPerson: coveringPerson,
   country: country,
   state: state,
   remarks: document.getElementById(`form-${ctx}-remarks`).value,
   location: loc,
   attendees: finalAttendeesStr,
   infoAll: finalInfoAll,
   isAllDay: eventIsAllDay,
   untilDate: eventUntilDate
 };

 try {
   const action = currentEditId ? 'editLeave' : 'submitLeave';
   const res = await apiCall(action, payload);
   
   await loadLeavesData(); 
   const wasEdit = currentEditId;
   cancelEditMode(); 
   
   alert(res.status.includes('Cal Updated') || res.status.includes('Approved') ? `Record successfully ${wasEdit ? 'updated' : 'submitted'}!` : "Record marked as Pending due to constraints. Admin notified.");
 } catch (err) { 
   alert("Error: " + err.message); 
 } finally { 
   showLoader(false); 
 }
}

async function cancelLeave(id, targetPhone) {
 if(!confirm("Are you sure you want to cancel this record?")) return;
 showLoader(true);
 try { 
   await apiCall('cancelLeave', { id: id, phone: targetPhone || user.phone }); 
   await loadLeavesData(); 
 } catch (err) {
   console.error(err);
 } finally { 
   showLoader(false); 
 }
}
