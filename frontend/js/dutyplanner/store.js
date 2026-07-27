// We use Cloudy App's apiCall wrapper
export const UI = {
   state: {
       isMobile: window.innerWidth < 1024,
       activeTab: 'setup',
       loading: false,
       lastMonth: '',
       searchQuery: '',
       selectedPersonId: null,
       editingRoleId: null,
       viewMode: 'both',
       activeModal: null,
       data: { seniorities: [], personnel: [], roles: [], shifts: [], tags: [], schedule: [] }
   },
   
   init() {
       this.dispatch('dp_sync');
       window.addEventListener('resize', () => {
           const currentIsMobile = window.innerWidth < 1024;
           if (currentIsMobile !== this.state.isMobile) {
               this.state.isMobile = currentIsMobile;
               this.render();
               if(this.state.activeTab === 'setup' && typeof window.dpRenderShiftInputs === 'function') {
                   setTimeout(window.dpRenderShiftInputs, 50);
               }
           }
       });
   },

   async dispatch(action, payload = {}) {
       this.state.loading = true;
       this.render(); 
       
       try {
           payload.adminPass = window.user ? window.user.pass : null; // Inject Cloudy auth
           const json = await window.apiCall(action, payload);
           this.state.data = json;
           if (action === 'dp_deletePerson' && payload.id === this.state.selectedPersonId) this.state.selectedPersonId = null;
           if (action === 'dp_updateRole' || action === 'dp_addRole') this.state.editingRoleId = null;
           if (action === 'dp_deleteRole' && payload.id === this.state.editingRoleId) this.state.editingRoleId = null;
           if (action !== 'dp_sync') this.showToast("Action completed", 'success');
       } catch (e) {
           this.showToast(e.message, 'error');
       }
       
       this.state.loading = false;
       this.render();
   },

   showToast(msg, type) {
       // use Cloudy app's toast if possible, otherwise alert
       if (window.showToast) {
         window.showToast(msg, type === 'error');
       } else {
         alert(type === 'error' ? "Error: " + msg : msg);
       }
   },
   render: () => {} 
};

window.dpUI = UI;

window.dpSwitchTab = (tab) => { 
   UI.state.activeTab = tab;
   UI.state.selectedPersonId = null; 
   UI.state.editingRoleId = null;
   UI.render(); 
};

window.dpOpenModal = (key) => { UI.state.activeModal = key; UI.render(); };
window.dpCloseModal = () => { UI.state.activeModal = null; UI.render(); };

export function getSeniorityName(id, state) {
   const s = state.data.seniorities.find(x => x.id === id);
   return s ? s.name : 'Unassigned';
}
window.dpGetSeniorityName = getSeniorityName;

export const css = {
   input: "w-full text-[16px] font-medium bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-colors shadow-sm",
   btnPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 shadow-sm outline-none flex items-center justify-center gap-2",
   btnSecondary: "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 shadow-sm outline-none flex items-center justify-center gap-2",
   btnDanger: "bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 shadow-sm outline-none flex items-center justify-center gap-2",
   card: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-md transition-colors",
   label: "text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block"
};
