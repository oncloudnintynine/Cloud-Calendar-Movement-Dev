// ==========================================
// Parade State Logic
// ==========================================

function renderParadeState() {
 const paradeHeader = document.getElementById('parade-state-header');
 const paradeBody = document.getElementById('parade-state-body');

 if (!companyContacts || companyContacts.length === 0) {
   if(paradeHeader) paradeHeader.innerText = `Overall Parade State`;
   if(paradeBody) paradeBody.innerHTML = `<div class="flex items-center justify-center h-32"><p class="text-gray-500 dark:text-darkmuted italic">Loading personnel data or no contacts found...</p></div>`;
   return;
 }

 const now = appData.parade.targetD || new Date();
 let inOfficeGlobal = 0;
 let totalGlobal = companyContacts.length;
 
 // Build dynamic N-Tier Tree Map
 let tree = {};

 try {
   companyContacts.forEach(contact => {
     const fullPath = String(contact.dept || 'Unassigned').toUpperCase();
     const parts = fullPath.split('-');
     
     let currentLevel = tree;
     parts.forEach((part, index) => {
         if (!currentLevel[part]) {
             currentLevel[part] = { _meta: { members:[], total: 0, inOffice: 0, isTerminal: false } };
         }
         currentLevel[part]._meta.total++;
         if (index === parts.length - 1) currentLevel[part]._meta.isTerminal = true;
         currentLevel = currentLevel[part];
     });

     const activeRecords = allLeaves.filter(l => {
       if (l.Status === 'Cancelled') return false;
       
       let isTarget = false;
       if (l.Phone == contact.phone) isTarget = true;
       else if (l.Attendees) {
         try {
           const att = JSON.parse(l.Attendees);
           isTarget = att.some(a => (a.type === 'contact' && a.id == contact.phone) || (a.type === 'group' && a.dept === contact.dept));
         } catch(e) { isTarget = String(l.Attendees).includes(contact.phone); }
       }
       if (!isTarget) return false;
       
       const sDate = new Date(l.StartDate);
       const eDate = new Date(l.EndDate);
       const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
       if (!isEvent) eDate.setHours(23, 59, 59, 999);
       
       return sDate <= now && eDate >= now;
     });
     
     let isOffice = true;
     let locationStr = 'Office';

     if (activeRecords.length > 0) {
       const r = activeRecords[0];
       const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(r.LeaveType);
       if (isEvent) {
         locationStr = r.Location || 'Event';
         isOffice = String(locationStr).toLowerCase() === 'office';
       } else {
         locationStr = r.LeaveType || 'Leave';
         if (r.Country) locationStr += ` (${r.Country})`;
         isOffice = false;
       }
     }

     if (isOffice) inOfficeGlobal++;
     
     // Determine KAH status globally
     const isKAH = window.kahPhones && window.kahPhones.includes(String(contact.phone));
     const memberObj = { name: contact.name || 'Unknown', isOffice: isOffice, location: locationStr, isKAH: isKAH };
     
     let updateLevel = tree;
     parts.forEach(part => {
         if (isOffice) updateLevel[part]._meta.inOffice++;
         if (updateLevel[part]._meta.isTerminal && part === parts[parts.length - 1]) {
             updateLevel[part]._meta.members.push(memberObj);
         }
         updateLevel = updateLevel[part];
     });
   });

   if (paradeHeader) paradeHeader.innerHTML = `Overall Parade State:<br><span class="text-[0.9em] opacity-90">(${inOfficeGlobal} / ${totalGlobal})</span>`;

   // SORT RULE: 1. In Office, 2. KAH, 3. Alpha
   const sortMembers = (mems) => {
       mems.sort((a, b) => {
           if (a.isOffice && !b.isOffice) return -1;
           if (!a.isOffice && b.isOffice) return 1;
           if (a.isKAH && !b.isKAH) return -1;
           if (!a.isKAH && b.isKAH) return 1;
           return String(a.name).localeCompare(String(b.name));
       });
   };

   const isHQ = (str) => str && String(str).toLowerCase() === 'hq';

   function renderNode(node, nodeName, depth) {
       const meta = node._meta;
       sortMembers(meta.members);
       
       let html = '';
       
       if (depth === 0) {
           html += `<div class="mb-5 border-l-4 border-blue-500 pl-3 md:pl-4 bg-white dark:bg-darksurface py-2">`;
           html += `<h3 class="font-bold text-lg md:text-xl mb-3 text-blue-700 dark:text-blue-400">${nodeName} <span class="text-sm font-semibold text-gray-500 dark:text-darkmuted">(${meta.inOffice} / ${meta.total})</span></h3>`;
       } else if (depth === 1) {
           html += `<div class="mt-3 ml-3 border-l-2 border-purple-400 pl-3">`;
           html += `<h4 class="font-bold text-base mb-2 text-purple-700 dark:text-purple-400">${nodeName} <span class="text-xs font-semibold text-gray-500 dark:text-darkmuted">(${meta.inOffice} / ${meta.total})</span></h4>`;
       } else {
           html += `<div class="mt-2 ml-3 border-l border-emerald-400 pl-2">`;
           html += `<h5 class="font-semibold text-sm mb-1.5 text-emerald-700 dark:text-emerald-400">${nodeName} <span class="text-[10px] font-semibold text-gray-500 dark:text-darkmuted">(${meta.inOffice} / ${meta.total})</span></h5>`;
       }

       if (meta.members.length > 0) {
           html += `<div class="space-y-1.5 text-[13px] md:text-[14px]">`;
           meta.members.forEach((m, i) => {
               const colorClass = m.isOffice ? 'text-gray-800 dark:text-gray-200' : 'text-orange-600 dark:text-orange-500';
               const kahStar = m.isKAH ? `<span class="text-yellow-500 mr-1 text-xs" title="KAH">★</span>` : '';
               html += `
               <div class="flex items-start">
                 <span class="w-5 md:w-6 shrink-0 text-right mr-2 text-gray-400 dark:text-darkmuted font-medium text-xs md:text-sm pt-0.5">${i+1}.</span>
                 <div class="leading-tight">
                   ${kahStar}<span class="font-semibold ${colorClass}">${m.name}</span>
                   ${!m.isOffice ? `<span class="italic ${colorClass} ml-1 block md:inline text-xs md:text-sm">(${m.location})</span>` : ''}
                 </div>
               </div>`;
           });
           html += `</div>`;
       }

       const childrenKeys = Object.keys(node).filter(k => k !== '_meta').sort((a, b) => String(a).localeCompare(String(b)));
       childrenKeys.forEach(childKey => { html += renderNode(node[childKey], childKey, depth + 1); });

       html += `</div>`;
       return html;
   }

   let finalHtml = '';
   const rootKeys = Object.keys(tree).sort((a, b) => {
     if (isHQ(a) && !isHQ(b)) return -1;
     if (!isHQ(a) && isHQ(b)) return 1;
     return String(a).localeCompare(String(b));
   });

   rootKeys.forEach(root => { finalHtml += renderNode(tree[root], root, 0); });

   if (paradeBody) paradeBody.innerHTML = finalHtml || `<p class="text-center text-gray-500">No departments to display.</p>`;
 } catch(err) {
   console.error('Parade State Render Error:', err);
   if (paradeBody) paradeBody.innerHTML = `<p class="text-red-500 text-center p-4">Error generating parade state. Please check console.</p>`;
 }
}
