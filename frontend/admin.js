// ==========================================
// Admin Settings, User Management & GitHub Backup
// ==========================================

let userToDeleteResource = null;
let userToManageResource = null;

function populateAdminSettingsForm(settings) {
 // KAH Fields
 document.getElementById('set-kah-limit').value = settings.kahLimit;
 document.getElementById('set-appr-email').value = settings.approvingAuthority;
 document.getElementById('set-kah-subject').value = settings.kahEmailSubject || "Leave Requires Approval: KAH Limit Crossed for {Unit}";
 document.getElementById('set-kah-body').value = settings.kahEmailBody || "User {Name} applied for {LeaveType} but KAH limit was crossed for {Unit}.\n\nRemarks: {Remarks}";
 
 // Admin Fields
 document.getElementById('set-user-keyword').value = settings.userKeyword || 'peace';
 document.getElementById('set-github-repo').value = settings.githubRepo || '';
 document.getElementById('set-backup-folder').value = settings.backupFolder || '';
 
 // Templates
 document.getElementById('tpl-gcal-leave').value = settings.displayTemplates?.gcalLeaveTitle || '{Type} - {Name} {HalfDay}';
 document.getElementById('tpl-gcal-event').value = settings.displayTemplates?.gcalEventTitle || '{Type} - {Name}, {Attendees} {HalfDay}';
 document.getElementById('tpl-agenda-leave').value = settings.displayTemplates?.agendaLeaveTitle || '{Name} ({Dept})';
 document.getElementById('tpl-agenda-event').value = settings.displayTemplates?.agendaEventTitle || '{Type}';
 
 document.getElementsByName('app-mode').forEach(r => { if(r.value === appMode) r.checked = true; });
 document.getElementsByName('form-mode').forEach(r => { if(r.value === formMode) r.checked = true; });

 tempMenuOrder = settings.menuOrder && settings.menuOrder.length ? settings.menuOrder : DEFAULT_MENU;
 renderMenuOrder();

 tempEventTypes = settings.eventTypes ||[];
 renderEventTypes();
 
 adminKAHList = settings.kahList ||[];
 adminKAHCustomGroups = settings.kahCustomGroups ||[];
 renderKAHSelected();
 updateKahAssignDropdown();
 
 tempAdminSectionsOrder = settings.adminSectionsOrder && settings.adminSectionsOrder.length 
  ? settings.adminSectionsOrder 
  :['app-mode', 'form-mode', 'register-user', 'manage-users', 'admin-pass', 'user-keyword', 'menu-order', 'event-types', 'display-templates', 'code-backup'];
 
 const container = document.getElementById('admin-sections-container');
 if (container) {
   tempAdminSectionsOrder.forEach(id => {
     const el = container.querySelector(`[data-section="${id}"]`);
     if (el) container.appendChild(el);
   });
   
   if (window.adminSectionsSortable) window.adminSectionsSortable.destroy();
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

async function loadAdminSettings() {
 try {
   const settings = await apiCall('getSettings', { adminPass: user.pass });
   appMode = settings.appMode || 'separated';
   formMode = settings.formMode || 'separated';
   companyStructure = settings.companyStructure || {};
   populateAdminSettingsForm(settings);
   
   if(settings.allContacts) {
     companyContacts = settings.allContacts;
     fuseAllContacts = new Fuse(settings.allContacts, { keys:['name', 'dept', 'phone'], threshold: 0.3 });
   }
 } catch (err) { alertError('login-alert', err.message); }
}

function renderMenuOrder() {
 const list = document.getElementById('menu-order-list');
 if(!list) return;
 list.innerHTML = tempMenuOrder.map((id) => `
   <div data-id="${id}" class="flex justify-between items-center bg-white dark:bg-darksurface p-3 rounded-lg border dark:border-darkborder shadow-sm cursor-grab">
     <div class="flex items-center space-x-3 w-full">
       <svg class="w-5 h-5 text-gray-400 dark:text-darkmuted handle cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
       <span class="font-bold text-gray-700 dark:text-darktext">${TAB_NAMES[id]}</span>
     </div>
   </div>
 `).join('');
 if(window.menuSortable) window.menuSortable.destroy();
 window.menuSortable = new Sortable(list, { animation: 150, handle: '.handle', ghostClass: 'opacity-50', onEnd: function () { tempMenuOrder = Array.from(list.children).map(el => el.dataset.id); } });
}
