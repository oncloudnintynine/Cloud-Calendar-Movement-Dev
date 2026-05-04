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
  
  // Hierarchical map
  let hierarchyMap = {};

  try {
    companyContacts.forEach(contact => {
      const contactDeptFull = String(contact.dept || 'Unassigned');
      let parent = contactDeptFull;
      let child = null;
      
      if (contactDeptFull.includes('-')) {
          const parts = contactDeptFull.split('-');
          parent = parts[0];
          child = parts.slice(1).join('-');
      }
      
      if (!hierarchyMap[parent]) hierarchyMap[parent] = { members:[], total: 0, inOffice: 0, children: {} };
      if (child && !hierarchyMap[parent].children[child]) {
          hierarchyMap[parent].children[child] = { members:[], total: 0, inOffice: 0 };
      }
      
      const activeRecords = allLeaves.filter(l => {
        if (l.Status === 'Cancelled') return false;
        
        let isTarget = false;
        if (l.Phone == contact.phone) {
          isTarget = true;
        } else if (l.Attendees) {
          try {
            const att = JSON.parse(l.Attendees);
            isTarget = att.some(a => (a.type === 'contact' && a.id == contact.phone) || (a.type === 'group' && a.dept === contact.dept));
          } catch(e) {
            isTarget = String(l.Attendees).includes(contact.phone);
          }
        }
        if (!isTarget) return false;
        
        const sDate = new Date(l.StartDate);
        const eDate = new Date(l.EndDate);
        
        const isEvent = window.appLeaveTypes && !window.appLeaveTypes.includes(l.LeaveType);
        if (!isEvent) { eDate.setHours(23, 59, 59, 999); }
        
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

      hierarchyMap[parent].total++;
      if (isOffice) { hierarchyMap[parent].inOffice++; inOfficeGlobal++; }
      
      const memberObj = { name: contact.name || 'Unknown', isOffice: isOffice, location: locationStr };

      if (child) {
          hierarchyMap[parent].children[child].total++;
          if (isOffice) hierarchyMap[parent].children[child].inOffice++;
          hierarchyMap[parent].children[child].members.push(memberObj);
      } else {
          hierarchyMap[parent].members.push(memberObj);
      }
    });

    if (paradeHeader) paradeHeader.innerText = `Overall Parade State: (${inOfficeGlobal} / ${totalGlobal})`;

    const isHQ = (str) => str && String(str).toLowerCase() === 'hq';
    const parentKeys = Object.keys(hierarchyMap).sort((a, b) => {
      if (isHQ(a) && !isHQ(b)) return -1;
      if (!isHQ(a) && isHQ(b)) return 1;
      return String(a).localeCompare(String(b));
    });

    const sortMembers = (mems) => {
        mems.sort((a, b) => {
            if (a.isOffice && !b.isOffice) return -1;
            if (!a.isOffice && b.isOffice) return 1;
            return String(a.name).localeCompare(String(b.name));
        });
    };

    let html = '';
    parentKeys.forEach(parent => {
      const pData = hierarchyMap[parent];
      sortMembers(pData.members);
      
      html += `
        <div class="mb-6 border-l-4 border-blue-500 pl-4">
          <h3 class="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">${parent} <span class="text-sm font-semibold text-gray-500 dark:text-darkmuted">(${pData.inOffice} / ${pData.total})</span></h3>
          <div class="space-y-1.5 text-[15px]">
            ${pData.members.map((m, i) => {
              const colorClass = m.isOffice ? 'text-gray-800 dark:text-gray-200' : 'text-orange-600 dark:text-orange-500';
              return `
              <div class="flex items-start">
                <span class="w-6 shrink-0 text-right mr-3 text-gray-400 dark:text-darkmuted font-medium">${i+1}.</span>
                <div>
                  <span class="font-semibold ${colorClass}">${m.name}</span>
                  ${!m.isOffice ? `<span class="italic ${colorClass} ml-1">(${m.location})</span>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
      `;

      // Render Children
      const childKeys = Object.keys(pData.children).sort((a, b) => String(a).localeCompare(String(b)));
      childKeys.forEach(child => {
          const cData = pData.children[child];
          sortMembers(cData.members);
          html += `
            <div class="mt-3 ml-4 border-l-2 border-blue-300 pl-3">
              <h4 class="font-semibold text-base mb-1.5 text-gray-700 dark:text-gray-300">${child} <span class="text-xs font-semibold text-gray-500 dark:text-darkmuted">(${cData.inOffice} / ${cData.total})</span></h4>
              <div class="space-y-1 text-[14px]">
                ${cData.members.map((m, i) => {
                  const colorClass = m.isOffice ? 'text-gray-700 dark:text-gray-300' : 'text-orange-600 dark:text-orange-500';
                  return `
                  <div class="flex items-start">
                    <span class="w-6 shrink-0 text-right mr-2 text-gray-400 dark:text-darkmuted font-medium">${i+1}.</span>
                    <div>
                      <span class="font-semibold ${colorClass}">${m.name}</span>
                      ${!m.isOffice ? `<span class="italic ${colorClass} ml-1">(${m.location})</span>` : ''}
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          `;
      });
      html += `</div>`;
    });

    if (paradeBody) paradeBody.innerHTML = html || `<p class="text-center text-gray-500">No departments to display.</p>`;
  } catch(err) {
    console.error('Parade State Render Error:', err);
    if (paradeBody) paradeBody.innerHTML = `<p class="text-red-500 text-center p-4">Error generating parade state. Please check console.</p>`;
  }
}