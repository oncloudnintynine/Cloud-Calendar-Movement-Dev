<!-- Admin Tab -->
      <div id="view-admin" class="tab-content hidden-view flex-col max-w-2xl mx-auto w-full h-full pb-2 md:pb-6">
        <div class="flex flex-col h-full bg-white dark:bg-darksurface rounded-2xl shadow border dark:border-darkborder overflow-hidden">
          
          <div class="flex-grow overflow-y-auto p-5 space-y-6">
            <h2 class="text-xl font-bold border-b dark:border-darkborder pb-3 text-blue-600 dark:text-blue-400">Global Configuration</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold mb-1 text-base">Admin Password</label>
                <div class="relative">
                  <input type="password" id="set-admin-pass" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-darkmuted focus:border-blue-500 transition" placeholder="Leave blank to keep current">
                  <button onclick="togglePassword('set-admin-pass', this)" class="absolute right-3 top-3 text-gray-500 dark:text-darkmuted"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                </div>
              </div>
              <div>
                <label class="block font-semibold mb-1 text-base">User Login Keyword</label>
                <input type="text" id="set-user-keyword" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-darkmuted focus:border-blue-500 transition" placeholder="e.g. peace">
                <p class="text-[11px] text-gray-500 mt-1 leading-tight">Users will log in with their mobile number followed by this keyword.</p>
              </div>
            </div>

            <!-- Menu Reordering block -->
            <div>
              <label class="block font-semibold mb-2 text-base">App Menu Order</label>
              <div id="menu-order-list" class="space-y-2 bg-gray-100 dark:bg-[#1a1a1a] p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600"></div>
            </div>
            
            <div>
              <label class="block font-semibold mb-2 text-base">Leave/MC/OIL Types</label>
              <div id="leave-types-list" class="space-y-3 mb-3"></div>
              <div class="flex space-x-3">
                <input type="text" id="new-leave-type" class="flex-grow border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none shadow-sm placeholder-gray-400 dark:placeholder-darkmuted focus:border-blue-500 transition" placeholder="Add new type...">
                <button type="button" onclick="addLeaveType()" class="bg-gray-300 dark:bg-darkhover font-bold px-5 rounded-xl hover:bg-gray-400 dark:hover:bg-[#333] transition">Add</button>
              </div>
            </div>
            
            <div><label class="block font-semibold mb-1 text-base">KAH Limit (%)</label><input type="number" id="set-kah-limit" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"></div>
            <div><label class="block font-semibold mb-1 text-base">Approving Authority Email</label><input type="email" id="set-appr-email" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"></div>
            
            <div>
              <label class="block font-semibold mb-1 text-base">KAH Personnel Search</label>
              <div class="relative">
                <input type="text" id="kah-search" placeholder="Type name to add..." class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2.5 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none shadow-sm placeholder-gray-400 dark:placeholder-darkmuted focus:border-blue-500 transition" autocomplete="off" onkeyup="searchKAH()">
                <div id="kah-results" class="absolute z-50 w-full bg-white dark:bg-darksurface border-x-2 border-b-2 border-gray-300 dark:border-darkborder rounded-b-xl shadow-2xl hidden-view max-h-48 overflow-y-auto -mt-1"></div>
              </div>
              
              <div class="mt-4 font-bold text-base mb-2">Current KAH List:</div>
              <ul id="kah-selected-list" class="space-y-2 bg-gray-100 dark:bg-[#1a1a1a] p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 min-h-[50px] empty:hidden"></ul>
            </div>
            
            <!-- REGISTER NEW USER SYSTEM -->
            <div class="border-t-2 border-dashed border-gray-300 dark:border-darkborder pt-5 mt-2">
              <h3 class="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-3">Register New User</h3>
              <div id="admin-alert" class="hidden bg-red-100 text-red-700 text-sm p-3 rounded-xl mb-4 text-center"></div>
              <div class="space-y-4">
                <div>
                  <label class="block font-semibold mb-1">Full Name</label>
                  <input type="text" id="admin-reg-name" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition" placeholder="e.g. Tan Ah Kow">
                </div>
                <div>
                  <label class="block font-semibold mb-1">Mobile No</label>
                  <input type="tel" id="admin-reg-mobile" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition" placeholder="e.g. 96745345">
                </div>
                <div>
                  <label class="block font-semibold mb-1">Unit</label>
                  <select id="admin-reg-unit" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition cursor-pointer">
                    <option value="" disabled selected>Select...</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold mb-1">Birthday</label>
                  <button type="button" id="btn-admin-register-birthday" onclick="openPicker('date', 'adminRegister', 'birthday')" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] hover:bg-white dark:hover:bg-black text-left outline-none font-medium transition text-gray-900 dark:text-white">Select...</button>
                </div>
                <button onclick="submitAdminRegister()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition text-lg mt-2">Register User</button>
              </div>
            </div>
            
            <!-- MANAGE USERS SYSTEM -->
            <div class="border-t-2 border-dashed border-gray-300 dark:border-darkborder pt-5 mt-2">
              <h3 class="font-bold text-lg text-red-600 dark:text-red-400 mb-3">Edit / Remove Users</h3>
              <div class="relative mb-3">
                <input type="text" id="admin-manage-search" placeholder="Search user to edit or remove..." class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2.5 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none shadow-sm placeholder-gray-400 dark:placeholder-darkmuted focus:border-blue-500 transition" autocomplete="off" onkeyup="searchUserToManage()">
                <div id="admin-manage-results" class="absolute z-50 w-full bg-white dark:bg-darksurface border-x-2 border-b-2 border-gray-300 dark:border-darkborder rounded-b-xl shadow-2xl hidden-view max-h-48 overflow-y-auto -mt-1"></div>
              </div>
              
              <div id="user-to-manage-container" class="hidden-view p-4 bg-gray-100 dark:bg-darkinput border border-gray-300 dark:border-darkborder rounded-xl space-y-4">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-lg text-gray-800 dark:text-gray-200">Edit User Details</span>
                  <button type="button" onclick="cancelManageUser()" class="text-gray-500 hover:text-gray-700 dark:text-darkmuted dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
                </div>
                
                <div>
                  <label class="block font-semibold mb-1 text-sm">Full Name</label>
                  <input type="text" id="edit-user-name" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-lg py-2 px-3 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition">
                </div>
                <div>
                  <label class="block font-semibold mb-1 text-sm">Mobile No</label>
                  <input type="tel" id="edit-user-mobile" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-lg py-2 px-3 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition">
                </div>
                <div>
                  <label class="block font-semibold mb-1 text-sm">Unit</label>
                  <select id="edit-user-unit" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-lg py-2 px-3 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition cursor-pointer">
                  </select>
                </div>
                
                <div class="flex space-x-3 pt-2 border-t dark:border-darkborder">
                  <button onclick="confirmUpdateUser()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow transition text-sm">Update User</button>
                  <button onclick="confirmDeleteUser()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow transition text-sm">Remove User</button>
                </div>
              </div>
            </div>

            <!-- CODE BACKUP SYSTEM -->
            <div class="border-t-2 border-dashed border-gray-300 dark:border-darkborder pt-5 mt-2">
              <div class="flex justify-between items-center mb-3">
                 <h3 class="font-bold text-lg text-purple-600 dark:text-purple-400">Code Backup</h3>
                 <button onclick="triggerCodeBackup()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition text-xs md:text-sm">One-Click Backup</button>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block font-semibold mb-1">GitHub Repo <span class="text-xs text-gray-500">(owner/repo)</span></label>
                  <input type="text" id="set-github-repo" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition" placeholder="e.g. oncloudnintynine/Cloud-Calendar-Movement-Dev">
                </div>
                <div>
                  <label class="block font-semibold mb-1">Backup Drive Folder ID</label>
                  <input type="text" id="set-backup-folder" class="w-full border-2 border-gray-400 dark:border-gray-500 rounded-xl py-2 px-4 bg-gray-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-500 transition" placeholder="Paste Folder ID or URL here">
                </div>
              </div>
            </div>

          </div>

          <div class="shrink-0 p-4 border-t dark:border-darkborder bg-gray-100 dark:bg-darkinput z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button onclick="saveAdminSettings()" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md transition text-lg">Save Settings</button>
          </div>

        </div>
      </div>
