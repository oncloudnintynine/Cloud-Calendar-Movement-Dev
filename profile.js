async function loadProfileData() {
document.getElementById('tab-profile').innerHTML = `
  <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">Family / Group Details</h3></div>
  <div id="lockedProfileBanner" class="hidden-force bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl mb-6 shadow-sm">
    <p class="font-bold mb-1 text-sm">🔒 Editing is currently Locked.</p>
    <p class="text-xs mb-3">To request changes to your details, please contact a Committee Member:</p>
    <div id="commContactList" class="flex flex-wrap gap-2"></div>
  </div>
  <div id="profileCardsContainer" class="space-y-4"><div class="loader w-8 h-8 border-primary mx-auto my-10"></div></div>
`;

const container = document.getElementById('profileCardsContainer'); 
const banner = document.getElementById('lockedProfileBanner'); 

if(!appSettings.allowEdits) {
  banner.classList.remove('hidden-force'); const cList = document.getElementById('commContactList'); cList.innerHTML = '';
  appSettings.committee.forEach(c => { if(c.phone) cList.innerHTML += `<a href="https://wa.me/65${c.phone}" target="_blank" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition">Chat with ${c.name}</a>`; });
} else { banner.classList.add('hidden-force'); }

try {
  const res = await callBackend('getProfile', {nric: currentUser.nric}); 
  loadedFamily = res.family; container.innerHTML = '';
  
  loadedFamily.forEach((m, i) => {
    let groupOpts = `<option value="">Select...</option>`;
    if(appSettings.projectGroups) { appSettings.projectGroups.forEach(g => { groupOpts += `<option value="${g}" ${m.group === g ? 'selected' : ''}>${g}</option>`; }); }
    if(m.group && (!appSettings.projectGroups || !appSettings.projectGroups.includes(m.group))) { groupOpts += `<option value="${m.group}" selected>${m.group} (Archived)</option>`; }
    const dynColor = getProjectColor(m.group);

    container.innerHTML += `
      <div class="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative" id="profCard_${i}">
        <div class="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
          <div class="flex items-center flex-wrap gap-2">
            <span class="font-bold text-lg px-2.5 py-0.5 rounded border ${dynColor}">${m.fullName}</span> 
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">${m.role}</span>
          </div>
          ${appSettings.allowEdits ? `<button onclick="enableEditMode(${i})" class="text-primary dark:text-blue-400 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 px-3 py-1 rounded transition focus:outline-none">Edit</button>` : ''}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-800 dark:text-gray-200">
          <div><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">NRIC / FIN</p><p class="font-medium uppercase">${m.nric}</p></div>
          <div><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Date of Birth</p><p class="font-medium">${m.dob}</p></div>
          <div><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Gender & Nat.</p><p class="font-medium">${m.gender} | ${m.nationality}</p></div>
          <div><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Contact & Email</p><p class="font-medium">${m.contact} | ${m.email || 'N/A'}</p></div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-1">Project</p><span class="font-medium text-xs px-2 py-0.5 rounded border inline-block ${dynColor}">${m.group || 'None'}</span></div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Home Address</p><p class="font-medium">${m.address}</p></div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Passport No.</p><p class="font-medium uppercase">${m.passportNo}</p></div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Passport Expiry</p><p class="font-medium">${m.passportExpiry}</p></div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Emerg. Contact</p><p class="font-medium">${m.emergencyName} (${m.emergencyRelation}) - ${m.emergencyContact}</p></div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Dietary Needs</p><p class="font-medium text-red-600 dark:text-red-400">${m.diet || 'None'}</p></div>
          <div class="md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Sleeping Arrangement</p><p class="font-medium text-blue-600 dark:text-blue-400">${m.sleeping || 'No special request'}</p></div>
          <div class="md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Other Points to Note</p><p class="font-medium">${m.otherPoints || 'None'}</p></div>
          ${m.role === 'CAREGIVER' ? `<div class="md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1"><p class="font-semibold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider mb-0.5">Caregiver For</p><p class="font-medium">${m.relatedTrainee} (${m.relationship})</p></div>` : ''}
        </div>
      </div>
      
      <form id="profEdit_${i}" onsubmit="event.preventDefault(); saveProfileEdit(${i}, this.querySelector('button[type=submit]'));" class="hidden-force bg-white dark:bg-gray-800 p-5 rounded-xl border border-primary dark:border-blue-500 space-y-4 shadow-md">
        <h4 class="font-bold text-lg mb-2 border-b border-gray-100 dark:border-gray-700 pb-2 text-gray-900 dark:text-white">Edit Details</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Full Name</label><input type="text" id="edName_${i}" value="${m.fullName}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Email</label><input type="text" id="edEmail_${i}" value="${m.email}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Contact</label><input type="tel" pattern="[0-9]{8}" id="edContact_${i}" value="${m.contact}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Gender</label><select id="edGender_${i}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"><option ${m.gender==='Male'?'selected':''}>Male</option><option ${m.gender==='Female'?'selected':''}>Female</option></select></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Role</label><select id="edRole_${i}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"><option ${m.role==='TRAINEE'?'selected':''}>TRAINEE</option><option ${m.role==='CAREGIVER'?'selected':''}>CAREGIVER</option><option ${m.role==='VOLUNTEER'?'selected':''}>VOLUNTEER</option></select></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Project</label><select id="edGroup_${i}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary">${groupOpts}</select></div>
           <div class="md:col-span-2"><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Address</label><textarea id="edAddress_${i}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary">${m.address}</textarea></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Nationality</label><input type="text" id="edNat_${i}" value="${m.nationality}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">DOB</label><input type="text" id="edDob_${i}" value="${m.dob}" readonly onclick="openDatePicker('edDob_${i}', 'dob')" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-center font-medium cursor-pointer bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Passport No.</label><input type="text" id="edPass_${i}" value="${m.passportNo}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg uppercase bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Passport Expiry</label><input type="text" id="edExp_${i}" value="${m.passportExpiry}" readonly onclick="openDatePicker('edExp_${i}', 'exp')" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-center font-medium cursor-pointer bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Emergency Contact Name</label><input type="text" id="edEmName_${i}" value="${m.emergencyName}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Emergency Contact No.</label><input type="tel" pattern="[0-9]{8}" id="edEmCont_${i}" value="${m.emergencyContact}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Emergency Relation</label><input type="text" id="edEmRel_${i}" value="${m.emergencyRelation}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Dietary Needs</label><input type="text" id="edDiet_${i}" value="${m.diet}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></div>
           <div class="md:col-span-2"><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Sleeping Arrangement Request</label><textarea id="edSleep_${i}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary">${m.sleeping}</textarea></div>
           <div class="md:col-span-2"><label class="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 block">Other Points to Note</label><textarea id="edOther_${i}" class="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary">${m.otherPoints}</textarea></div>
        </div>
        <div class="flex space-x-3 pt-2">
          <button type="button" onclick="cancelEditMode(${i})" class="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition focus:outline-none">Cancel</button>
          <button type="submit" class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-lg shadow-sm hover:bg-blue-600 transition flex justify-center items-center focus:outline-none"><span class="btn-text">Save Changes</span><div class="btn-spinner spinner-white hidden-force ml-2"></div></button>
        </div>
      </form>
    `;
  });
} catch (e) { container.innerHTML = '<p class="text-red-500 font-bold">Error loading profiles.</p>'; }
}

function enableEditMode(i) { document.getElementById(`profCard_${i}`).classList.add('hidden-force'); document.getElementById(`profEdit_${i}`).classList.remove('hidden-force'); }
function cancelEditMode(i) { document.getElementById(`profEdit_${i}`).classList.add('hidden-force'); document.getElementById(`profCard_${i}`).classList.remove('hidden-force'); }

async function saveProfileEdit(i, btn) {
setBtnLoading(btn, true);
const updated = {
  nric: loadedFamily[i].nric, fullName: document.getElementById(`edName_${i}`).value, email: document.getElementById(`edEmail_${i}`).value, role: document.getElementById(`edRole_${i}`).value, gender: document.getElementById(`edGender_${i}`).value,
  contact: document.getElementById(`edContact_${i}`).value, dob: document.getElementById(`edDob_${i}`).value, group: document.getElementById(`edGroup_${i}`).value, address: document.getElementById(`edAddress_${i}`).value,
  nationality: document.getElementById(`edNat_${i}`).value, passportNo: document.getElementById(`edPass_${i}`).value.toUpperCase(), passportExpiry: document.getElementById(`edExp_${i}`).value, diet: document.getElementById(`edDiet_${i}`).value,
  emergencyName: document.getElementById(`edEmName_${i}`).value, emergencyContact: document.getElementById(`edEmCont_${i}`).value, emergencyRelation: document.getElementById(`edEmRel_${i}`).value, sleeping: document.getElementById(`edSleep_${i}`).value,
  otherPoints: document.getElementById(`edOther_${i}`).value, relatedTrainee: loadedFamily[i].relatedTrainee, relationship: loadedFamily[i].relationship
};
try { await callBackend('updateProfile', {member: updated}); showToast("Profile Updated!"); loadProfileData(); } catch (e) { showToast(e.message, true); } finally { setBtnLoading(btn, false); }
}