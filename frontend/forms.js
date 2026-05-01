// ==========================================
// Form Handling & Fuzzy Search Dropdowns
// ==========================================

function toggleInfoAll(forceState) {
  isInfoAll = forceState !== undefined ? forceState : !isInfoAll;
  const btn = document.getElementById('form-event-infoall-btn');
  if(isInfoAll) {
      btn.classList.add('bg-blue-100', 'dark:bg-blue-900/40', 'text-blue-700', 'dark:text-blue-300', 'border-blue-300', 'dark:border-blue-600');
      btn.classList.remove('text-gray-500', 'dark:text-gray-400', 'border-gray-400', 'dark:border-gray-500');
  } else {
      btn.classList.remove('bg-blue-100', 'dark:bg-blue-900/40', 'text-blue-700', 'dark:text-blue-300', 'border-blue-300', 'dark:border-blue-600');
      btn.classList.add('text-gray-500', 'dark:text-gray-400', 'border-gray-400', 'dark:border-gray-500');
  }
}

// --- Attendees Form Logic ---
function searchAttendees() {
  const q = document.getElementById('form-event-attendee-search').value;
  const resC = document.getElementById('attendees-results');
  if(!q || !fuseAttendees) { resC.classList.add('hidden-view'); return; }
  
  const results = fuseAttendees.search(q).slice(0, 6).map(r => r.item);
  if (results.length > 0) {
    resC.innerHTML = results.map(item => `
      <div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover" onclick="selectAttendee('${item.id}', '${item.name.replace(/'/g, "\\'")}', '${item.dept}', '${item.type}')">
        <span class="font-semibold">${item.name}</span> <span class="text-xs text-gray-500 dark:text-darkmuted ml-1">(${item.dept})</span>
      </div>
    `).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}

function selectAttendee(id, name, dept, type) {
  if (!eventAttendees.some(a => a.id === id)) { 
    eventAttendees.push({ id, name, dept, type }); 
    renderAttendees(); 
  }
  document.getElementById('form-event-attendee-search').value = '';
  document.getElementById('attendees-results').classList.add('hidden-view');
}

function removeAttendee(id) { 
  eventAttendees = eventAttendees.filter(a => a.id !== id); 
  renderAttendees(); 
}

function renderAttendees() {
  const c = document.getElementById('attendees-chip-container');
  if(c) {
    c.innerHTML = eventAttendees.map(a => `
      <div class="inline-flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full px-3 py-1 text-sm font-semibold">
        ${a.name}
        <button type="button" onclick="removeAttendee('${a.id}')" class="ml-2 text-blue-600 dark:text-blue-400 hover:text-red-500 focus:outline-none">&times;</button>
      </div>
    `).join('');
  }
}

// --- Covering Person Form Logic ---
function searchCovering() {
  const q = document.getElementById('form-leave-cover').value;
  const resC = document.getElementById('cover-results-leave');
  if(!q || !fuseAllContacts) { resC.classList.add('hidden-view'); return; }
  
  const uniques =[...new Set(fuseAllContacts._docs.map(d=>d.name))];
  const quickFuse = new Fuse(uniques.map(name => ({name})), {keys:['name'], threshold: 0.3});
  
  const results = quickFuse.search(q).slice(0, 5).map(r => r.item.name);
  if (results.length > 0) {
    resC.innerHTML = results.map(n => `<div class="p-3 border-b dark:border-darkborder cursor-pointer hover:bg-gray-100 dark:hover:bg-darkhover font-medium" onclick="selectCovering('${n.replace(/'/g, "\\'")}')">${n}</div>`).join('');
    resC.classList.remove('hidden-view');
  } else {
    resC.innerHTML = `<div class="p-3 text-gray-500">No match found</div>`; resC.classList.remove('hidden-view');
  }
}

function selectCovering(name) { 
  document.getElementById('form-leave-cover').value = name; 
  document.getElementById('cover-results-leave').classList.add('hidden-view'); 
}

// --- Form Submission & Edits ---
function triggerEdit(id) {
  const l = allLeaves.find(x => x.ID === id);
  if(!l) return;
  currentEditId = id;
  const isEvent = window.appLeaveTypes ? !window.appLeaveTypes.includes(l.LeaveType) : false;
  const ctx = isEvent ? 'event' : 'leave';

  appData[ctx].startD = new Date(l.StartDate);
  appData[ctx].endD = new Date(l.EndDate);
  updateButtonLabels();

  if (isEvent) {
    document.getElementById('form-event-name').value = l.LeaveType;
    document.getElementById('form-event-location').value = l.Location || 'Office';
    document.getElementById('form-event-remarks').value = l.Remarks || '';
    document.getElementById('form-event-repeat').value = l.HalfDay || 'NONE'; 
    toggleInfoAll(l.InfoAll === 'TRUE');
    
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
    renderAttendees();
    
    document.getElementById('submit-event-btn').innerText = "Update Event";
    document.getElementById('cancel-edit-event-btn').classList.remove('hidden-view');
  } else {
    document.getElementById('form-leave-type').value = l.LeaveType;
    document.getElementById('form-leave-cover').value = l.CoveringPerson;
    document.getElementById('form-leave-country').value = l.Country || '';
    document.getElementById('form-leave-state').value = l.State || '';
    document.getElementById('form-leave-remarks').value = l.Remarks || '';
    document.getElementById('submit-leave-btn').innerText = "Update Record";
    document.getElementById('cancel-edit-leave-btn').classList.remove('hidden-view');
    toggleOverseasFields();
    
    let start = 'AM', end = 'PM';
    if (l.HalfDay === 'AM') end = 'AM';
    else if (l.HalfDay === 'PM') start = 'PM';
    else if (l.HalfDay === 'Start PM, End AM') { start = 'PM'; end = 'AM'; }
    else if (l.HalfDay === 'Start PM') start = 'PM';
    else if (l.HalfDay === 'End AM') end = 'AM';
    appData.leave.startAMPM = start; appData.leave.endAMPM = end;
    updateTimeSliderVisual('start', start); updateTimeSliderVisual('end', end);
  }
  switchTab(`submit-${ctx}`);
  
  setTimeout(() => {['form-leave-remarks', 'form-event-remarks'].forEach(id => {
      const el = document.getElementById(id);
      if(el) { el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
    });
  }, 50);
}

function cancelEditMode() {
  currentEditId = null; 
  initDates();
  document.getElementById('leave-form').reset(); 
  document.getElementById('event-form').reset();['form-leave-remarks', 'form-event-remarks'].forEach(id => { 
    const el = document.getElementById(id); 
    if(el) el.style.height='auto'; 
  });

  appData.leave.startAMPM = 'AM'; appData.leave.endAMPM = 'PM';
  updateTimeSliderVisual('start', 'AM'); updateTimeSliderVisual('end', 'PM');
  toggleOverseasFields();
  toggleInfoAll(false);
  
  eventAttendees =[]; renderAttendees();

  document.getElementById('submit-leave-btn').innerText = "Save Record";
  document.getElementById('cancel-edit-leave-btn').classList.add('hidden-view');
  document.getElementById('submit-event-btn').innerText = "Save Event";
  document.getElementById('cancel-edit-event-btn').classList.add('hidden-view');
  switchTab('my-leaves');
}

function toggleAMPM(type) {
  appData.leave[`${type}AMPM`] = appData.leave[`${type}AMPM`] === 'AM' ? 'PM' : 'AM'; 
  updateTimeSliderVisual(type, appData.leave[`${type}AMPM`]);
}

function updateTimeSliderVisual(type, val) {
  const slider = document.getElementById(`${type}-leave-slider`);
  const tAM = document.getElementById(`${type}-leave-am`);
  const tPM = document.getElementById(`${type}-leave-pm`);
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

function toggleOverseasFields() {
  const type = document.getElementById('form-leave-type').value;
  const el = document.getElementById('overseas-fields');
  const cInput = document.getElementById('form-leave-country');
  if (type === 'Overseas Leave' || type === 'Official Trip') { 
    el.classList.remove('hidden-view'); cInput.required = true; 
  } else { 
    el.classList.add('hidden-view'); cInput.required = false; cInput.value = ''; document.getElementById('form-leave-state').value = ''; 
  }
}

async function submitForm(ctx) {
  showLoader(true);
  if (ctx === 'leave') {
    const coverInput = document.getElementById('form-leave-cover').value.trim();
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
  let finalDepts = new Set(user.departments);
  let finalInfoAll = false;

  if (ctx === 'leave') {
    const isSameDay = appData.leave.startD.toDateString() === appData.leave.endD.toDateString();
    if (isSameDay) {
      if (appData.leave.startAMPM === 'AM' && appData.leave.endAMPM === 'AM') calculatedHalfDay = 'AM';
      else if (appData.leave.startAMPM === 'PM' && appData.leave.endAMPM === 'PM') calculatedHalfDay = 'PM';
    } else {
      if (appData.leave.startAMPM === 'PM' && appData.leave.endAMPM === 'AM') calculatedHalfDay = 'Start PM, End AM';
      else if (appData.leave.startAMPM === 'PM') calculatedHalfDay = 'Start PM';
      else if (appData.leave.endAMPM === 'AM') calculatedHalfDay = 'End AM';
    }
  } else {
    calculatedHalfDay = document.getElementById('form-event-repeat').value; 
    loc = document.getElementById('form-event-location').value;
    finalInfoAll = isInfoAll;
    
    eventAttendees.forEach(a => {
      finalDepts.add(a.dept);
    });
    finalAttendeesStr = JSON.stringify(eventAttendees);
  }

  const payload = {
    id: currentEditId, name: user.name, phone: user.phone, departments: Array.from(finalDepts),
    leaveType: ctx === 'leave' ? document.getElementById('form-leave-type').value : document.getElementById('form-event-name').value,
    startDate: sDate, endDate: eDate, halfDay: calculatedHalfDay, 
    coveringPerson: ctx === 'leave' ? document.getElementById('form-leave-cover').value.trim() : 'N/A',
    country: ctx === 'leave' ? document.getElementById('form-leave-country').value : '',
    state: ctx === 'leave' ? document.getElementById('form-leave-state').value : '',
    remarks: document.getElementById(`form-${ctx}-remarks`).value,
    location: loc,
    attendees: finalAttendeesStr,
    infoAll: finalInfoAll
  };

  try {
    const action = currentEditId ? 'editLeave' : 'submitLeave';
    const res = await apiCall(action, payload);
    
    // AWAIT the data refresh so UI is perfectly synced when transition happens
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

async function cancelLeave(id) {
  if(!confirm("Are you sure you want to cancel this record?")) return;
  showLoader(true);
  try { 
    await apiCall('cancelLeave', { id: id, phone: user.phone }); 
    await loadLeavesData(); 
  } catch (err) {
    console.error(err);
  } finally { 
    showLoader(false); 
  }
}