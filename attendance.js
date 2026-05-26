function buildAttendanceUI() {
document.getElementById('tab-attendance').innerHTML = `
  <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 admin-only">
    <div class="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2"><h3 class="text-lg font-bold text-gray-900 dark:text-white">Take Attendance</h3><span class="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">🟢 Live Sync</span></div>
    <div class="grid grid-cols-2 gap-4 mb-4"><div><label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Juncture</label><select id="attendanceJunctureSelect" class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"></select></div><div><label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">My Assignment</label><select class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"><option>All Participants</option></select></div></div>
    <div id="attendanceChecklist" class="space-y-2 border border-gray-200 dark:border-gray-700 p-2 rounded-xl bg-gray-50 dark:bg-gray-900 h-64 overflow-y-auto"><div class="loader border-primary mx-auto my-10"></div></div>
    <button class="w-full mt-4 bg-primary text-white font-semibold py-3 rounded-lg shadow-sm transition hover:bg-blue-600 flex justify-center items-center"><span class="btn-text">Submit Attendance</span><div class="btn-spinner spinner-white hidden-force ml-2"></div></button>
  </div>`;
}

function renderAttendanceChecklist() {
if(!globalLogistics || !document.getElementById('attendanceChecklist')) return; let html = '';
globalLogistics.participants.forEach(p => {
  let roleColor = p.role === 'TRAINEE' ? 'text-blue-500 dark:text-blue-400' : (p.role === 'CAREGIVER' ? 'text-purple-500 dark:text-purple-400' : 'text-green-500 dark:text-green-400');
  const dynColor = getProjectColor(p.group);
  html += `<label class="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition mb-2">
      <div class="flex items-center flex-wrap gap-2"><span class="font-bold text-sm px-2 py-0.5 rounded border ${dynColor}">${p.name}</span> <span class="text-xs font-semibold ${roleColor}">(${p.role})</span></div>
      <input type="checkbox" checked class="w-5 h-5 text-primary rounded border border-gray-300 dark:border-gray-600 focus:ring-primary focus:ring-offset-0 dark:bg-gray-700">
    </label>`;
});
document.getElementById('attendanceChecklist').innerHTML = html || '<p class="text-sm font-medium text-gray-400 p-2">No participants found.</p>';
const attSel = document.getElementById('attendanceJunctureSelect'); if(attSel && appSettings.junctures) { attSel.innerHTML = ''; appSettings.junctures.forEach(j => attSel.innerHTML += `<option value="${j}">${j}</option>`); }
}