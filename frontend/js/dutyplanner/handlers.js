import { UI } from './store.js';

// Setup Handlers
window.dpToggleDays = (isChecked) => {
  document.querySelectorAll('.dp-role-day-cb').forEach(cb => { cb.checked = isChecked; cb.disabled = isChecked; });
  window.dpRenderShiftInputs();
};

window.dpRenderShiftInputs = () => {
  const num = parseInt(document.getElementById('dpInpNumShifts')?.value) || 1;
  const is247 = document.getElementById('dpInpIs247')?.checked || false;
  const sortedSen = [...UI.state.data.seniorities].sort((a,b) => a.order - b.order);
  
  if(sortedSen.length === 0) {
      document.getElementById('dpShiftRowsContainer').innerHTML = '<div class="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg font-semibold text-center text-sm border border-red-200 dark:border-red-500/30">Setup Seniority Tiers first.</div>';
      return;
  }
  const hideTimings = (is247 && num === 1);
  let html = '';
  for(let i=1; i<=num; i++) {
      html += `
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl shadow-sm flex flex-col gap-4 w-full">
          <div class="flex flex-col md:flex-row gap-3 w-full">
              <div class="flex-1 w-full">
                  <label class="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 block">Shift ID</label>
                  <input type="text" id="dpSName_${i}" class="w-full text-[16px] font-medium border border-zinc-300 rounded-lg px-3 py-2.5 outline-none" value="Shift ${i}">
              </div>
              ${hideTimings ? `
              <div class="flex-1 w-full md:w-auto pt-0 md:pt-[26px]">
                  <div class="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg uppercase flex items-center justify-center h-[44px] border border-indigo-200 dark:border-indigo-500/30">
                      <i data-lucide="clock" class="w-4 h-4 mr-2"></i> 24-Hr Auto
                  </div>
                  <input type="hidden" id="dpSStart_${i}" value="00:00"><input type="hidden" id="dpSEnd_${i}" value="00:00">
              </div>
              ` : `
              <div class="flex flex-row gap-2 w-full md:w-auto">
                  <div class="flex-1 md:w-32"><label class="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 block">Start</label><input type="time" id="dpSStart_${i}" step="60" class="w-full border border-zinc-300 rounded-lg px-3 py-2.5"></div>
                  <div class="flex-1 md:w-32"><label class="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 block">End</label><input type="time" id="dpSEnd_${i}" step="60" class="w-full border border-zinc-300 rounded-lg px-3 py-2.5"></div>
              </div>
              `}
          </div>
          <div class="w-full bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <label class="block text-xs font-bold text-emerald-600 mb-3 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-200 pb-2">Headcount Required</label>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  ${sortedSen.map(sen => `
                  <div class="flex flex-col items-center bg-white p-2.5 rounded-lg border border-zinc-200 w-full gap-2 shadow-sm">
                      <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate w-full text-center">${sen.name}</span>
                      <input type="number" id="dpSReq_${sen.id}_${i}" value="0" min="0" class="w-full max-w-[80px] text-center text-xl font-bold border border-zinc-300 rounded-md py-1 px-1 outline-none">
                  </div>
                  `).join('')}
              </div>
          </div>
      </div>
      `;
  }
  const container = document.getElementById('dpShiftRowsContainer');
  if(container) { container.innerHTML = html; if (window.lucide) window.lucide.createIcons(); }
};

window.dpHandleEditRole = (id) => {
  const role = UI.state.data.roles.find(r => r.id === id);
  if(!role) return;
  const shifts = UI.state.data.shifts.filter(s => s.roleId === id);
  UI.state.editingRoleId = id;
  UI.render(); 
  
  setTimeout(() => {
      document.getElementById('dpInpRoleName').value = role.name;
      document.getElementById('dpInpRoleType').value = role.type;
      const is247 = (role.is247 === true || role.is247 === 'TRUE');
      document.getElementById('dpInpIs247').checked = is247;
      
      document.querySelectorAll('.dp-role-day-cb').forEach(cb => { cb.checked = role.days.includes(cb.value); cb.disabled = is247; });
      let cRoles = []; try { cRoles = JSON.parse(role.concurrentRoles); } catch(e){}
      document.querySelectorAll('.dp-role-concurrent-cb').forEach(cb => { cb.checked = cRoles.includes(cb.value); });
      
      document.getElementById('dpInpNumShifts').value = shifts.length;
      window.dpRenderShiftInputs();
      
      setTimeout(() => {
          shifts.forEach((s, i) => {
              const idx = i + 1;
              document.getElementById(`dpSName_${idx}`).value = s.name;
              const stInput = document.getElementById(`dpSStart_${idx}`);
              const enInput = document.getElementById(`dpSEnd_${idx}`);
              if(stInput && stInput.type !== 'hidden') stInput.value = (s.start || "").substring(0,5);
              if(enInput && enInput.type !== 'hidden') enInput.value = (s.end || "").substring(0,5);
              
              let reqs = {}; try { reqs = JSON.parse(s.reqs); } catch(e){}
              UI.state.data.seniorities.forEach(sen => {
                  const reqEl = document.getElementById(`dpSReq_${sen.id}_${idx}`);
                  if(reqEl) reqEl.value = reqs[sen.id] || 0;
              });
          });
      }, 50); 
  }, 50); 
};

window.dpHandleCancelEdit = () => { UI.state.editingRoleId = null; UI.render(); setTimeout(window.dpRenderShiftInputs, 50); };

window.dpHandleSaveRole = () => {
  const roleName = document.getElementById('dpInpRoleName').value.trim();
  const roleType = document.getElementById('dpInpRoleType').value;
  const is247 = document.getElementById('dpInpIs247').checked;
  const days = [];
  if (is247) { ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => days.push(d)); } else { document.querySelectorAll('.dp-role-day-cb:checked').forEach(cb => days.push(cb.value)); }
  const concurrentRoles = []; document.querySelectorAll('.dp-role-concurrent-cb:checked').forEach(cb => concurrentRoles.push(cb.value));
  
  const sortedSen = [...UI.state.data.seniorities].sort((a,b) => a.order - b.order);
  const num = parseInt(document.getElementById('dpInpNumShifts').value) || 1;
  const shifts = [];
  for(let i=1; i<=num; i++) {
      const sn = document.getElementById(`dpSName_${i}`).value.trim();
      const st = document.getElementById(`dpSStart_${i}`).value;
      const se = document.getElementById(`dpSEnd_${i}`).value;
      const shiftReqs = {};
      sortedSen.forEach(sen => { const reqEl = document.getElementById(`dpSReq_${sen.id}_${i}`); if(reqEl) shiftReqs[sen.id] = parseInt(reqEl.value) || 0; });
      if(!sn || !st || !se) return UI.showToast("Missing parameters in shift inputs.", "error");
      shifts.push({ name: sn, start: st, end: se, reqs: shiftReqs });
  }

  if(!roleName) return UI.showToast("Role name is required.", "error");
  if(days.length === 0) return UI.showToast("Select at least one day constraint.", "error");

  const payload = { roleName, roleType, is247, daysOfWeek: days, concurrentRoles, shifts };
  if(UI.state.editingRoleId) UI.dispatch('dp_updateRole', { id: UI.state.editingRoleId, ...payload });
  else UI.dispatch('dp_addRole', payload);
};

// Manage Handlers
window.dpClearSelection = () => { UI.state.selectedPersonId = null; UI.render(); };
window.dpHandleUpdateSeniority = (id, name) => {
   const seniority = document.getElementById('dpEditSeniority').value; UI.dispatch('dp_updatePerson', { id, personName: name, seniority });
};
window.dpHandleAssign = (personId) => {
   const roleId = document.getElementById('dpAssignRoleSelect').value; if(!roleId) return UI.showToast("Select a role to grant.", "error");
   UI.dispatch('dp_tagPerson', { personId, roleId });
};

// Settings Handlers
window.dpHandleSetupDatabase = () => { if(confirm("Initialize schema?")) UI.dispatch('dp_setupDatabase'); };
window.dpHandleRunMigration = () => { if(confirm("Wipe schedule & migrate?")) UI.dispatch('dp_runMigration'); };
window.dpHandleAddSeniorityTier = () => {
   const name = document.getElementById('dpNewSenName').value.trim(); const order = parseInt(document.getElementById('dpNewSenOrder').value);
   if(!name || isNaN(order)) return UI.showToast("Provide Name and Order", "error"); UI.dispatch('dp_addSeniorityTier', { name, order });
};
window.dpHandleUpdateSeniorityTier = (id) => {
   const name = document.getElementById(`dpSenName_${id}`).value.trim(); const order = parseInt(document.getElementById(`dpSenOrder_${id}`).value);
   if(!name || isNaN(order)) return UI.showToast("Provide Name and Order", "error"); UI.dispatch('dp_updateSeniorityTier', { id, name, order });
};
window.dpHandleDeleteSeniorityTier = (id) => { if(confirm("Delete tier?")) UI.dispatch('dp_deleteSeniorityTier', { id }); };

// Roster Engine Handlers
window.dpHandleGenerate = () => {
   const ym = document.getElementById('dpInpMonth').value;
   if(!ym) return UI.showToast("Select a valid month to execute engine.", "error");
   const [year, month] = ym.split('-');
   if(UI.state.data.roles.length === 0 || UI.state.data.personnel.length === 0) return UI.showToast("Missing personnel or roles.", "error");
   UI.dispatch('dp_generateSchedule', { year: parseInt(year), month: parseInt(month) });
};
