import { UI, getSeniorityName, css } from './store.js';

export function AppTemplate(state) {
  if (state.isMobile) return MobileLayout(state);
  return DesktopLayout(state);
}

function MobileLayout(state) {
  return `
  <div class="flex flex-col h-full w-full max-w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden relative">
      <main class="flex-1 overflow-y-auto w-full hide-scroll relative bg-zinc-50 dark:bg-zinc-950 transition-colors">
          <div class="p-3 sm:p-4 w-full max-w-full min-h-full pb-8">
              ${state.activeTab === 'setup' ? SetupDesktop(state, true) : ''}
              ${state.activeTab === 'manage' ? ManageDesktop(state, true) : ''}
              ${state.activeTab === 'roster' ? RosterDesktop(state, true) : ''}
              ${state.activeTab === 'calc' ? CalcDesktop(state) : ''}
              ${state.activeTab === 'settings' ? SettingsDesktop(state) : ''}
          </div>
      </main>
      ${MobileNav(state)}
  </div>
  ${state.loading ? Loader() : ''}
  ${InfoModal(state)}
  `;
}

function DesktopLayout(state) {
  return `
  <div class="flex flex-col h-full w-full max-w-full overflow-hidden relative bg-zinc-50 dark:bg-zinc-950 transition-colors">
      ${DesktopTabs(state)}
      <main class="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden w-full relative">
          <div class="p-6 md:p-8 w-full max-w-6xl mx-auto min-w-0 pb-16">
              ${state.activeTab === 'setup' ? SetupDesktop(state, false) : ''}
              ${state.activeTab === 'manage' ? ManageDesktop(state, false) : ''}
              ${state.activeTab === 'roster' ? RosterDesktop(state, false) : ''}
              ${state.activeTab === 'calc' ? CalcDesktop(state) : ''}
              ${state.activeTab === 'settings' ? SettingsDesktop(state) : ''}
          </div>
      </main>
  </div>
  ${state.loading ? Loader() : ''}
  ${InfoModal(state)}
  `;
}

function DesktopTabs(state) {
  const tabs = [
      { id: 'setup', name: 'Topology & Setup', icon: 'database' },
      { id: 'manage', name: 'Personnel', icon: 'users' },
      { id: 'roster', name: 'Roster Engine', icon: 'calendar-days' },
      { id: 'calc', name: 'Calculator', icon: 'calculator' },
      { id: 'settings', name: 'Advanced Settings', icon: 'settings' }
  ];
  return `
  <div class="hidden lg:flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
    <div class="flex overflow-x-auto hide-scroll w-full px-4">
      ${tabs.map(t => `
        <button onclick="window.dpSwitchTab('${t.id}')" class="flex items-center gap-2 px-6 py-4 border-b-2 transition-colors outline-none whitespace-nowrap text-sm font-bold ${state.activeTab === t.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}">
          <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.name}
        </button>
      `).join('')}
    </div>
  </div>
  `;
}

function MobileNav(state) {
  const tabs = [
      { id: 'setup', name: 'Setup', icon: 'database' },
      { id: 'manage', name: 'Personnel', icon: 'users' },
      { id: 'roster', name: 'Roster', icon: 'calendar-days' },
      { id: 'calc', name: 'Calculator', icon: 'calculator' },
      { id: 'settings', name: 'Settings', icon: 'settings' }
  ];
  
  return `
  <nav class="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shrink-0 z-50 transition-colors block lg:hidden">
      <div class="flex justify-around items-center h-[68px] px-1 pb-safe">
          ${tabs.map(t => `
              <button onclick="window.dpSwitchTab('${t.id}')" class="flex-1 flex flex-col items-center justify-center gap-1.5 transition-colors outline-none h-full ${state.activeTab === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-500'}">
                  <div class="relative flex items-center justify-center w-12 h-7 rounded-full ${state.activeTab === t.id ? 'bg-indigo-50 dark:bg-indigo-500/20 shadow-inner' : ''} transition-all duration-300">
                      <i data-lucide="${t.icon}" class="w-[22px] h-[22px] ${state.activeTab === t.id ? 'dark:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] scale-110' : 'scale-100'} transition-transform"></i>
                  </div>
                  <span class="text-[9px] font-black tracking-widest uppercase mt-0.5">${t.name}</span>
              </button>
          `).join('')}
      </div>
  </nav>
  `;
}

function Loader() {
  return `
  <div class="absolute inset-0 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm z-[300] flex flex-col items-center justify-center animate-in fade-in duration-200 w-full h-full transition-colors">
      <div class="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin mb-4 shadow-lg"></div>
      <p class="text-indigo-600 dark:text-indigo-300 font-bold tracking-widest text-xs uppercase animate-pulse">Syncing Database...</p>
  </div>
  `;
}

// SETUP VIEW
function SetupDesktop(state, isMobile) {
  const isEditing = !!state.editingRoleId;
  return `
  <div class="space-y-6 w-full animate-in fade-in duration-300">
      <div class="flex flex-col gap-1 mb-2">
          <h2 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wide">Database Setup</h2>
          <p class="text-zinc-500 dark:text-zinc-400 text-sm md:text-base">Configure roles, concurrency, and shifts.</p>
      </div>
      <div class="${css.card} p-4 md:p-6 w-full">
          <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 class="text-base md:text-lg font-bold ${isEditing ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'} flex items-center gap-2 uppercase tracking-wide">
                  <i data-lucide="briefcase" class="w-5 h-5 ${isEditing ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}"></i> 
                  ${isEditing ? 'Editing Role' : 'New Role Logic'}
              </h3>
              ${isEditing ? `<button onclick="window.dpHandleCancelEdit()" class="${css.btnSecondary} w-full md:w-auto"><i data-lucide="x-circle" class="w-4 h-4"></i> Cancel Edit</button>` : ''}
          </div>
          <div class="space-y-6 w-full">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <div class="w-full">
                      <label class="${css.label}">Role Name</label>
                      <input type="text" id="dpInpRoleName" class="${css.input}" placeholder="e.g. Area Commander">
                  </div>
                  <div class="w-full">
                      <label class="${css.label}">Role Type</label>
                      <select id="dpInpRoleType" class="${css.input}">
                          <option value="On-Site">On-Site</option>
                          <option value="Standby">Standby</option>
                      </select>
                  </div>
                  <div class="w-full flex items-end">
                      <label class="flex items-center gap-3 w-full h-[44px] px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:border-indigo-400 transition-colors">
                          <input type="checkbox" id="dpInpIs247" onchange="window.dpToggleDays(this.checked)" class="w-5 h-5 rounded text-indigo-600 bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-600 focus:ring-indigo-500">
                          <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200 select-none">Runs 24/7 (Mon-Sun)</span>
                      </label>
                  </div>
              </div>
              <div class="w-full">
                  <label class="${css.label}">Target Days</label>
                  <div class="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 w-full">
                      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => `
                          <label class="relative flex-1 sm:flex-none">
                              <input type="checkbox" value="${day}" class="dp-role-day-cb peer sr-only">
                              <div class="px-2 sm:px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-sm text-center transition-all peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-500/20 peer-checked:border-indigo-500 peer-checked:text-indigo-700 dark:peer-checked:text-indigo-300 peer-disabled:opacity-40 cursor-pointer select-none">
                                  ${day}
                              </div>
                          </label>
                      `).join('')}
                  </div>
              </div>
              ${state.data.roles.length > 0 ? `
              <div class="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 w-full">
                  <label class="block text-xs font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-widest flex items-center gap-2"><i data-lucide="git-merge" class="w-4 h-4 text-indigo-500 dark:text-indigo-400"></i> Concurrency Matrix</label>
                  <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 w-full">
                      ${state.data.roles.map(r => `
                          <label class="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors shadow-sm w-full sm:w-auto">
                              <input type="checkbox" value="${r.id}" class="dp-role-concurrent-cb w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 shrink-0">
                              <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide whitespace-normal leading-snug">${r.name}</span>
                          </label>
                      `).join('')}
                  </div>
              </div>
              ` : ''}
              <div class="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-4 md:p-6 w-full">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700/50">
                      <div>
                          <label class="block text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide flex items-center gap-2"><i data-lucide="layers" class="w-5 h-5 text-indigo-500 dark:text-indigo-400"></i> Shift Topology</label>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Define shift nodes. (Reserves auto-calculated)</p>
                      </div>
                      <div class="w-full md:w-48 shrink-0">
                          <select id="dpInpNumShifts" onchange="window.dpRenderShiftInputs()" class="${css.input}">
                              <option value="1">1 Shift Config</option><option value="2">2 Shift Config</option>
                              <option value="3">3 Shift Config</option><option value="4">4 Shift Config</option>
                          </select>
                      </div>
                  </div>
                  <div id="dpShiftRowsContainer" class="space-y-4 w-full"></div>
              </div>
              <div class="pt-4 flex justify-end w-full">
                  <button onclick="window.dpHandleSaveRole()" class="${css.btnPrimary} w-full md:w-auto px-8">
                      ${isEditing ? '<i data-lucide="save" class="w-4 h-4"></i> Update Role' : '<i data-lucide="plus-circle" class="w-4 h-4"></i> Add Role'}
                  </button>
              </div>
          </div>
      </div>
      ${isMobile ? SetupRolesMobileCards(state) : SetupRolesDesktopTable(state)}
  </div>
  `;
}
function SetupRolesMobileCards(state) {
  return `
  <div class="w-full pt-4">
      <h3 class="font-bold text-zinc-900 dark:text-white text-sm uppercase mb-3 flex items-center gap-2 tracking-wide"><i data-lucide="server" class="w-4 h-4 text-indigo-500 dark:text-indigo-400"></i> Configured Roles <span class="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-0.5 rounded ml-auto">${state.data.roles.length}</span></h3>
      <div class="flex flex-col gap-3 w-full">
          ${state.data.roles.map(r => {
              const shifts = state.data.shifts.filter(s => s.roleId === r.id);
              return `
              <div class="${css.card} p-4 w-full ${state.editingRoleId === r.id ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : ''}">
                  <div class="font-bold text-zinc-900 dark:text-white text-base leading-snug break-words mb-3">${r.name}</div>
                  <div class="flex flex-col gap-3 mb-4">
                      <span class="w-fit text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest ${r.type === 'Standby' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'}">${r.type}</span>
                      <div class="text-xs text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <i data-lucide="calendar" class="w-4 h-4 shrink-0 text-indigo-500 dark:text-indigo-400"></i>
                          <span>${r.is247 === true || r.is247 === 'TRUE' ? '<span class="text-indigo-600 dark:text-indigo-400 font-bold">24/7</span>' : r.days}</span>
                      </div>
                  </div>
                  <div class="mb-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <div class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5"><i data-lucide="clock" class="w-3 h-3"></i> Shift Schedule</div>
                      <div class="space-y-1.5">
                          ${shifts.length > 0 ? shifts.map(s => `
                              <div class="flex justify-between items-center text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
                                  <span class="font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">${s.name}</span>
                                  <span class="font-mono text-zinc-500 dark:text-zinc-400 shrink-0 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded text-[10px]">${(s.start||"00:00").substring(0,5)} - ${(s.end||"00:00").substring(0,5)}</span>
                              </div>
                          `).join('') : '<span class="text-xs text-zinc-500 font-medium">No shifts defined</span>'}
                      </div>
                  </div>
                  <div class="flex gap-2">
                      <button onclick="window.dpHandleEditRole('${r.id}')" class="${css.btnSecondary} flex-1 py-2 text-xs"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i> Edit</button>
                      <button onclick="UI.dispatch('dp_deleteRole', {id: '${r.id}'})" class="${css.btnDanger} flex-1 py-2 text-xs"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete</button>
                  </div>
              </div>
              `;
          }).join('')}
          ${state.data.roles.length === 0 ? `<div class="p-6 text-center text-zinc-400 text-sm font-semibold uppercase tracking-widest border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl w-full">No roles setup</div>` : ''}
      </div>
  </div>
  `;
}
function SetupRolesDesktopTable(state) {
  return `
  <div class="${css.card} flex flex-col w-full overflow-hidden mt-6">
      <div class="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <h3 class="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2"><i data-lucide="server" class="w-5 h-5 text-indigo-500 dark:text-indigo-400"></i> Configured Roles</h3>
          <span class="text-xs font-bold bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-1 rounded-lg text-zinc-700 dark:text-zinc-300">${state.data.roles.length} Total</span>
      </div>
      <div class="w-full overflow-x-auto hide-scroll">
          <table class="w-full text-left text-sm text-zinc-600 dark:text-zinc-300 min-w-[700px]">
              <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  ${state.data.roles.map(r => {
                      const shifts = state.data.shifts.filter(s => s.roleId === r.id);
                      return `
                      <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td class="px-5 py-5">
                              <div class="flex flex-col gap-3">
                                  <div class="flex items-center gap-3">
                                      <span class="font-bold text-zinc-900 dark:text-white text-base">${r.name}</span>
                                      <span class="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${r.type === 'Standby' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">${r.type}</span>
                                      <div class="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md">
                                          <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${r.is247 === true || r.is247 === 'TRUE' ? '<span class="text-indigo-600 dark:text-indigo-400 font-bold">24/7 Continuous</span>' : r.days}
                                      </div>
                                  </div>
                                  <div class="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                                      <div class="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5"><i data-lucide="clock" class="w-3 h-3"></i> Configured Shifts</div>
                                      <div class="flex flex-wrap gap-2">
                                          ${shifts.length > 0 ? shifts.map(s => `
                                              <div class="inline-flex items-center text-xs bg-white dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden group">
                                                  <div class="px-2.5 py-1.5 font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${s.name}</div>
                                                  <div class="px-2.5 py-1.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">${(s.start||"00:00").substring(0,5)} - ${(s.end||"00:00").substring(0,5)}</div>
                                              </div>
                                          `).join('') : '<span class="text-xs text-zinc-500 italic">No shifts configured</span>'}
                                      </div>
                                  </div>
                              </div>
                          </td>
                          <td class="px-5 py-5 text-right align-top w-48">
                              <div class="flex items-center justify-end gap-2 pt-1">
                                  <button onclick="window.dpHandleEditRole('${r.id}')" class="${css.btnSecondary} px-3 py-2"><i data-lucide="edit-2" class="w-4 h-4"></i> Edit</button>
                                  <button onclick="UI.dispatch('dp_deleteRole', {id: '${r.id}'})" class="${css.btnDanger} px-3 py-2"><i data-lucide="trash-2" class="w-4 h-4"></i> Del</button>
                              </div>
                          </td>
                      </tr>
                      `;
                  }).join('')}
                  ${state.data.roles.length === 0 ? `<tr><td colspan="2" class="p-8 text-center text-zinc-400 text-sm font-semibold uppercase tracking-widest border border-dashed border-zinc-200 dark:border-zinc-800 m-4 rounded-xl">No roles established</td></tr>` : ''}
              </tbody>
          </table>
      </div>
  </div>
  `;
}

// MANAGE VIEW
function ManageDesktop(state, isMobile) {
   const sortedSen = [...state.data.seniorities].sort((a,b) => a.order - b.order);
   const searchQ = state.searchQuery.toLowerCase();
   
   // Sync with Cloudy contacts
   let cloudyContacts = window.companyContacts || [];
   let dpPersonnel = [...cloudyContacts].map(c => {
       let dpPerson = state.data.personnel.find(p => p.id === (c.resourceName || c.emailAddresses?.[0]?.value || c.phone));
       return {
           id: c.resourceName || c.emailAddresses?.[0]?.value || c.phone,
           name: c.name || c.formattedName || 'Unknown',
           seniority: dpPerson ? dpPerson.seniority : null
       };
   });
   
   let filteredPersonnel = dpPersonnel;
   if (searchQ) {
       const fuse = new window.Fuse(dpPersonnel, { keys: ['name'], threshold: 0.3 });
       filteredPersonnel = fuse.search(searchQ).map(res => res.item);
   }
   const selPerson = dpPersonnel.find(p => p.id === state.selectedPersonId);

   const showList = !isMobile || (isMobile && !selPerson);
   const showDetail = !isMobile || (isMobile && !!selPerson);

   return `
   <div class="space-y-4 md:space-y-6 w-full h-full flex flex-col min-w-0 animate-in fade-in duration-300">
       ${showList ? `
       <div class="mb-1 shrink-0">
           <h2 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wide">Personnel</h2>
           <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage workforce and map capabilities from Cloudy Contacts.</p>
       </div>
       ` : ''}
       <div class="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 w-full min-w-0 h-full overflow-hidden">
           ${showList ? `
           <div class="w-full lg:w-[350px] xl:w-[400px] ${css.card} flex flex-col shrink-0 ${isMobile ? 'flex-1' : 'h-full'} overflow-hidden min-w-0">
               <div class="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                   <div class="relative">
                       <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"></i>
                       <input type="text" id="dpSearchPersonnel" placeholder="Search..." value="${state.searchQuery.replace(/"/g, '&quot;')}" oninput="UI.state.searchQuery = this.value; UI.render();" class="${css.input} pl-9 py-2">
                   </div>
               </div>
               <div class="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 hide-scroll">
                   ${filteredPersonnel.map(p => `
                       <button onclick="UI.state.selectedPersonId = '${p.id}'; UI.render();" class="w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all outline-none ${state.selectedPersonId === p.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 shadow-sm' : 'bg-transparent border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}">
                           <div class="min-w-0 pr-3">
                               <div class="font-bold text-sm text-zinc-900 dark:text-white truncate">${p.name}</div>
                               <div class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">${getSeniorityName(p.seniority, state)}</div>
                           </div>
                           <i data-lucide="chevron-right" class="w-4 h-4 text-zinc-400 shrink-0"></i>
                       </button>
                   `).join('')}
                   ${filteredPersonnel.length === 0 ? `<div class="p-6 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg m-2">No matches</div>` : ''}
               </div>
           </div>
           ` : ''}
           ${showDetail ? `
           <div class="flex-1 ${css.card} flex flex-col w-full h-full overflow-hidden animate-in ${isMobile ? 'slide-in-from-right-4' : 'fade-in'} duration-300 min-w-0">
               ${!selPerson ? `
                   <div class="flex-1 flex flex-col items-center justify-center opacity-50 p-8 text-center">
                       <i data-lucide="user-square-2" class="w-16 h-16 mb-4 text-zinc-400"></i>
                       <p class="text-base font-bold uppercase tracking-widest text-zinc-400">Select personnel</p>
                   </div>
               ` : `
                   <div class="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
                       ${isMobile ? `<button onclick="window.dpClearSelection()" class="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white outline-none"><i data-lucide="arrow-left" class="w-6 h-6"></i></button>` : ''}
                       <div class="flex-1 min-w-0">
                           <h2 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white truncate w-full">${selPerson.name}</h2>
                       </div>
                   </div>
                   <div class="p-4 md:p-6 flex-1 overflow-y-auto space-y-6 hide-scroll w-full">
                       <div class="bg-zinc-50 dark:bg-zinc-800/30 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-700/50 w-full">
                           <label class="${css.label} flex items-center gap-2 mb-3"><i data-lucide="award" class="w-4 h-4 text-indigo-500"></i> Seniority Level</label>
                           <div class="flex flex-col sm:flex-row gap-3 w-full lg:max-w-md">
                               <select id="dpEditSeniority" class="${css.input}">
                                   <option value="">Unassigned</option>
                                   ${sortedSen.map(s => `<option value="${s.id}" ${selPerson.seniority === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                               </select>
                               <button onclick="window.dpHandleUpdateSeniority('${selPerson.id}', '${selPerson.name.replace(/'/g,"\\'")}')" class="${css.btnSecondary} w-full sm:w-auto px-6">Update</button>
                           </div>
                       </div>
                       <div class="bg-zinc-50 dark:bg-zinc-800/30 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-700/50 w-full">
                           <label class="${css.label} flex items-center gap-2 mb-3"><i data-lucide="shield" class="w-4 h-4 text-indigo-500"></i> Capabilities</label>
                           <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 min-h-[100px] flex flex-wrap gap-2 shadow-sm">
                               ${state.data.tags.filter(t => t.personId === selPerson.id).map(t => {
                                   const role = state.data.roles.find(r => r.id === t.roleId);
                                   if(!role) return '';
                                   return `
                                   <div class="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-semibold">
                                       <span class="uppercase">${role.name}</span>
                                       <button onclick="UI.dispatch('dp_deleteTag', {id: '${t.id}'})" class="w-6 h-6 rounded bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors outline-none"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
                                   </div>
                                   `;
                               }).join('') || `<div class="w-full text-center text-zinc-400 py-6 text-xs uppercase font-bold tracking-widest">No roles assigned.</div>`}
                           </div>
                           <div class="mt-4 flex flex-col sm:flex-row gap-3 w-full lg:max-w-xl">
                               <select id="dpAssignRoleSelect" class="${css.input}"><option value="">-- Select Capability --</option>${state.data.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select>
                               <button onclick="window.dpHandleAssign('${selPerson.id}')" class="${css.btnPrimary} w-full sm:w-auto px-6">Grant Access</button>
                           </div>
                       </div>
                   </div>
               `}
           </div>
           ` : ''}
       </div>
   </div>
   `;
}

// ROSTER VIEW
function RosterDesktop(state, isMobile) {
   const ym = document.getElementById('dpInpMonth')?.value || state.lastMonth || "";
   let scheduleRows = [];
   if(ym) scheduleRows = state.data.schedule.filter(s => String(s.yearMonth).startsWith(ym));
   const formatTime = (isoString) => { try { const d = new Date(isoString); if(!isNaN(d)) return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}); } catch(e) {} return isoString; };
   const formatDate = (isoString) => { try { const d = new Date(isoString); if(!isNaN(d)) return d.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'}); } catch(e) {} return isoString; };

   return `
   <div class="space-y-6 w-full flex flex-col min-w-0 h-full pb-4 animate-in fade-in duration-300">
       <div class="mb-2 shrink-0">
           <h2 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wide">Roster Engine</h2>
           <p class="text-zinc-500 dark:text-zinc-400 text-sm mt-1 flex items-center gap-1.5">
               <i data-lucide="info" class="w-4 h-4 text-indigo-500"></i> Enforces 11-hr rest, 44hr limit & handles OIL dynamically.
           </p>
       </div>
       <div class="${css.card} p-4 sm:p-5 flex flex-col sm:flex-row items-end gap-4 w-full shrink-0">
           <div class="w-full sm:max-w-[200px]">
               <label class="${css.label}">Target Month</label>
               <input type="month" id="dpInpMonth" value="${ym}" onchange="UI.state.lastMonth = this.value; UI.render();" class="${css.input}">
           </div>
           <button onclick="window.dpHandleGenerate()" class="${css.btnPrimary} w-full sm:w-auto px-6 h-[44px]">
               <i data-lucide="cpu" class="w-4 h-4"></i> Execute Engine
           </button>
       </div>
       <div class="flex-1 w-full min-w-0 overflow-hidden flex flex-col">
           ${scheduleRows.length > 0 ? `
               ${isMobile ? `
               <div class="flex-1 overflow-y-auto hide-scroll space-y-3 w-full">
                   ${scheduleRows.map(s => {
                       const isReserve = s.shift.includes('(Reserve)');
                       return `
                       <div class="${css.card} p-4 w-full">
                           <div class="flex justify-between items-start gap-3 mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                               <div class="min-w-0 flex-1">
                                   <div class="font-bold text-sm leading-snug truncate ${isReserve ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}">${s.role}</div>
                                   <div class="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">${s.shift}</div>
                               </div>
                               <div class="text-right shrink-0">
                                   <div class="font-semibold text-zinc-900 dark:text-white text-xs">${formatDate(s.date)}</div>
                                   <div class="text-[10px] font-mono text-zinc-500 mt-0.5">${formatTime(s.start)} - ${formatTime(s.end)}</div>
                               </div>
                           </div>
                           <div class="flex justify-between items-center w-full gap-2">
                               <span class="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold">${s.seniorityReqName || 'Any'}</span>
                               ${s.personName === 'UNFILLED' 
                                   ? `<span class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Unfilled</span>`
                                   : `<span class="font-bold text-zinc-900 dark:text-white text-xs truncate max-w-[60%]">${s.personName}</span>`
                               }
                           </div>
                       </div>
                       `;
                   }).join('')}
               </div>
               ` : `
               <div class="${css.card} flex-1 overflow-hidden w-full flex flex-col">
                   <div class="overflow-x-auto w-full hide-scroll flex-1">
                       <table class="w-full text-left text-sm text-zinc-600 dark:text-zinc-300 min-w-[800px]">
                           <thead class="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold tracking-widest border-b border-zinc-200 dark:border-zinc-800 sticky top-0">
                               <tr><th class="px-5 py-4">Date</th><th class="px-5 py-4">Role & Shift Node</th><th class="px-5 py-4">Seniority Req</th><th class="px-5 py-4">Time Window (24H)</th><th class="px-5 py-4 text-right">Assigned Personnel</th></tr>
                           </thead>
                           <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                               ${scheduleRows.map((s, i) => {
                                   const isReserve = s.shift.includes('(Reserve)');
                                   return `
                                   <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                       <td class="px-5 py-3 font-semibold text-zinc-900 dark:text-white">${formatDate(s.date)}</td>
                                       <td class="px-5 py-3 min-w-0 max-w-[200px] truncate"><div class="font-semibold text-sm ${isReserve ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'} truncate">${s.role}</div><div class="text-[10px] text-zinc-500 mt-0.5 uppercase">${s.shift}</div></td>
                                       <td class="px-5 py-3"><span class="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest">${s.seniorityReqName || 'Any'}</span></td>
                                       <td class="px-5 py-3 text-xs font-mono text-zinc-500">${formatTime(s.start)} - ${formatTime(s.end)}</td>
                                       <td class="px-5 py-3 text-right min-w-0 max-w-[200px] truncate">
                                           ${s.personName === 'UNFILLED' 
                                               ? `<span class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded text-xs font-bold uppercase inline-flex items-center gap-1.5"><i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> Unfilled</span>`
                                               : `<span class="font-bold text-zinc-900 dark:text-white text-sm truncate">${s.personName}</span>`
                                           }
                                       </td>
                                   </tr>
                                   `;
                               }).join('')}
                           </tbody>
                       </table>
                   </div>
               </div>
               `}
           ` : `
               <div class="${css.card} flex-1 flex flex-col items-center justify-center opacity-50 p-8 w-full">
                   <i data-lucide="calendar-x" class="w-16 h-16 mb-4 text-zinc-400"></i>
                   <p class="text-sm font-bold uppercase tracking-widest text-zinc-400 text-center">${ym ? "Engine has not generated data." : "Select a month."}</p>
               </div>
           `}
       </div>
   </div>
   `;
}

// CALCULATOR VIEW
function CalcDesktop(state) {
  const sortedSen = [...state.data.seniorities].sort((a,b) => a.order - b.order);
  const existingCount = {}; sortedSen.forEach(s => existingCount[s.id] = 0);
  
  let cloudyContacts = window.companyContacts || [];
  let dpPersonnel = [...cloudyContacts].map(c => {
      let dpPerson = state.data.personnel.find(p => p.id === (c.resourceName || c.emailAddresses?.[0]?.value || c.phone));
      return dpPerson;
  }).filter(p => p);
  
  dpPersonnel.forEach(p => { if(p.seniority && existingCount[p.seniority] !== undefined) existingCount[p.seniority]++; });
  const DUTY_HOURS_CAPACITY = 15; 
  const EFFECTIVE_SHIFTS_PER_WEEK = 192 / 52.14; 
  let workings = {};
  sortedSen.forEach(s => workings[s.id] = { onSiteHrs: 0, standbyHrs: 0, totalHrs: 0, reserveShifts: 0, reserveHeadcount: 0, requiredCount: 0 });
  state.data.roles.forEach(r => {
      let daysPerWeek = (r.is247 === true || r.is247 === 'TRUE') ? 7 : (r.days.split(',').filter(x=>x).length);
      let roleShifts = state.data.shifts.filter(s => s.roleId === r.id);
      roleShifts.forEach(s => {
          let st = new Date(`2000-01-01T${s.start || '00:00'}`); let et = new Date(`2000-01-01T${s.end || '00:00'}`);
          if(et <= st) et.setDate(et.getDate() + 1);
          let hrs = (et - st) / 3600000;
          let shiftReqs = {}; try{ shiftReqs = JSON.parse(s.reqs); }catch(e){}
          sortedSen.forEach(sen => {
              let count = parseInt(shiftReqs[sen.id]) || 0;
              if(count > 0) {
                  if (r.type === 'Standby') {
                      let weeklyStdbyHrs = 12 * count * (daysPerWeek / 7);
                      workings[sen.id].standbyHrs += weeklyStdbyHrs; workings[sen.id].totalHrs += weeklyStdbyHrs;
                  } else {
                      let weeklyOnSiteHrs = hrs * count * daysPerWeek;
                      workings[sen.id].onSiteHrs += weeklyOnSiteHrs; workings[sen.id].totalHrs += weeklyOnSiteHrs;
                      workings[sen.id].reserveShifts += (1 * daysPerWeek);
                  }
              }
          });
      });
  });
  sortedSen.forEach(sen => {
      let baseReq = Math.ceil(workings[sen.id].totalHrs / DUTY_HOURS_CAPACITY);
      let resReq = Math.ceil(workings[sen.id].reserveShifts / EFFECTIVE_SHIFTS_PER_WEEK);
      workings[sen.id].reserveHeadcount = resReq;
      workings[sen.id].requiredCount = baseReq + resReq;
  });
  return `
  <div class="space-y-6 w-full min-w-0 animate-in fade-in duration-300">
      <div class="flex flex-col lg:flex-row justify-between lg:items-end mb-4 gap-4 w-full">
          <div class="flex flex-col gap-1">
              <h2 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wide">Calculator</h2>
              <p class="text-sm text-zinc-500 dark:text-zinc-400">Mathematical framework mapping topology to hiring needs.</p>
          </div>
          <div class="w-full lg:w-48 shrink-0">
              <select onchange="UI.state.viewMode = this.value; UI.render();" class="${css.input} text-sm">
                  <option value="both" ${state.viewMode === 'both' ? 'selected' : ''}>Overview</option>
                  <option value="req" ${state.viewMode === 'req' ? 'selected' : ''}>Required Only</option>
                  <option value="act" ${state.viewMode === 'act' ? 'selected' : ''}>Current Only</option>
              </select>
          </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
          ${sortedSen.map(sen => {
              const w = workings[sen.id]; const req = w.requiredCount; const act = existingCount[sen.id]; const diff = act - req; const isDeficit = diff < 0;
              return `
              <div class="${css.card} flex flex-col w-full min-w-0 overflow-hidden">
                  <div class="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <h3 class="text-zinc-900 dark:text-white text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2"><i data-lucide="user-check" class="w-4 h-4 text-indigo-500"></i> ${sen.name}</h3>
                      <div class="flex justify-between items-end gap-2 w-full">
                          <div class="${state.viewMode === 'req' ? 'hidden' : ''}">
                              <div class="text-3xl font-black text-zinc-900 dark:text-white">${act}</div>
                              <div class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Current</div>
                          </div>
                          <div class="text-right ${state.viewMode === 'act' ? 'hidden' : ''} ${state.viewMode === 'req' ? 'w-full text-left' : ''}">
                              <div class="text-3xl font-black text-indigo-600 dark:text-indigo-400">${req}</div>
                              <div class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Required</div>
                          </div>
                      </div>
                      <div class="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 ${state.viewMode === 'both' ? '' : 'hidden'}">
                          ${isDeficit 
                              ? `<div class="text-red-600 dark:text-red-400 font-bold text-[11px] bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg uppercase tracking-wider flex justify-center items-center"><i data-lucide="trending-down" class="w-3.5 h-3.5 mr-2"></i> Deficit of ${Math.abs(diff)}</div>`
                              : `<div class="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg uppercase tracking-wider flex justify-center items-center"><i data-lucide="trending-up" class="w-3.5 h-3.5 mr-2"></i> Surplus of ${diff}</div>`
                          }
                      </div>
                  </div>
              </div>
              `;
          }).join('')}
      </div>
  </div>
  `;
}

// SETTINGS VIEW
function SettingsDesktop(state) {
   const sortedSen = [...state.data.seniorities].sort((a,b) => a.order - b.order);
   return `
   <div class="space-y-6 w-full max-w-3xl min-w-0 animate-in fade-in duration-300">
       <div class="mb-4"><h2 class="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wide">Advanced Settings</h2></div>
       <div class="${css.card} p-5 md:p-6 w-full min-w-0">
           <h3 class="text-base font-bold text-zinc-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2"><i data-lucide="bar-chart" class="w-5 h-5 text-indigo-500"></i> Seniority Tiers</h3>
           <div class="space-y-4 mb-6 w-full min-w-0">
               ${sortedSen.map(sen => `
                   <div class="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full min-w-0">
                       <div class="grid grid-cols-12 gap-3 w-full mb-3">
                           <div class="col-span-4 sm:col-span-2 min-w-0">
                               <label class="${css.label} truncate">Order</label>
                               <input type="number" id="dpSenOrder_${sen.id}" value="${sen.order}" class="${css.input} text-center px-1">
                           </div>
                           <div class="col-span-8 sm:col-span-6 min-w-0">
                               <label class="${css.label} truncate">Name</label>
                               <input type="text" id="dpSenName_${sen.id}" value="${sen.name}" class="${css.input}">
                           </div>
                           <div class="col-span-12 sm:col-span-4 flex items-end gap-2 w-full mt-1 sm:mt-0">
                               <button onclick="window.dpHandleUpdateSeniorityTier('${sen.id}')" class="${css.btnSecondary} flex-1 px-2"><i data-lucide="save" class="w-4 h-4"></i></button>
                               <button onclick="window.dpHandleDeleteSeniorityTier('${sen.id}')" class="${css.btnDanger} px-3"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                           </div>
                       </div>
                   </div>
               `).join('')}
           </div>
           <div class="pt-5 border-t border-zinc-200 dark:border-zinc-800 w-full min-w-0">
               <div class="grid grid-cols-12 gap-3 w-full mb-4">
                   <div class="col-span-8 sm:col-span-8 min-w-0">
                       <label class="${css.label}">New Tier</label>
                       <input type="text" id="dpNewSenName" placeholder="Trainee" class="${css.input}">
                   </div>
                   <div class="col-span-4 sm:col-span-4 min-w-0">
                       <label class="${css.label} truncate">Order</label>
                       <input type="number" id="dpNewSenOrder" placeholder="4" class="${css.input} text-center px-1">
                   </div>
               </div>
               <button onclick="window.dpHandleAddSeniorityTier()" class="${css.btnPrimary} w-full py-3">Add Tier</button>
           </div>
       </div>
       <div class="bg-red-50 dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-xl mt-8 w-full overflow-hidden min-w-0">
           <div class="p-4 bg-red-100/50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/30"><h3 class="text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i> System Actions</h3></div>
           <div class="p-5 border-b border-red-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
               <div class="w-full md:flex-1"><h4 class="text-zinc-900 dark:text-white font-bold text-sm uppercase">Initialize Schema</h4><p class="text-xs text-zinc-500 mt-1">Run this only on an empty Google Sheet.</p></div>
               <button onclick="window.dpHandleSetupDatabase()" class="${css.btnSecondary} w-full md:w-auto px-6">Run Setup</button>
           </div>
           <div class="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
               <div class="w-full md:flex-1"><h4 class="text-zinc-900 dark:text-white font-bold text-sm uppercase">Run Migration (v3)</h4><p class="text-xs mt-1 text-red-500 font-semibold">Warning: Clears existing Schedule.</p></div>
               <button onclick="window.dpHandleRunMigration()" class="${css.btnDanger} w-full md:w-auto px-6">Execute</button>
           </div>
       </div>
   </div>
   `;
}

function InfoModal(state) {
  if (!state.activeModal) return '';
  return `
  <div class="fixed inset-0 z-[250] flex items-center justify-center p-4 pb-20">
      <div class="absolute inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity" onclick="window.dpCloseModal()"></div>
      <div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 fade-in flex flex-col overflow-hidden">
          <div class="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
              <h3 class="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2.5 uppercase tracking-wide"><i data-lucide="info" class="w-5 h-5 text-indigo-500 dark:text-indigo-400"></i> Info</h3>
          </div>
          <div class="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex justify-end">
              <button onclick="window.dpCloseModal()" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold tracking-wide outline-none shadow-md shadow-indigo-500/20 active:scale-95 transition-all">Acknowledge</button>
          </div>
      </div>
  </div>
  `;
}
