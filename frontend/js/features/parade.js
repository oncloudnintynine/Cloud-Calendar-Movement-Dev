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
    if (String(l.Phone).trim() === String(contact.phone).trim() || String(l.Name).trim() === String(contact.name).trim()) {
        isTarget = true;
    } else if (l.Attendees) {
      try {
        const att = JSON.parse(l.Attendees);
        isTarget = att.some(a => {
            if (a.type === 'contact' && (String(a.id).trim() === String(contact.phone).trim() || String(a.name).trim() === String(contact.name).trim())) return true;
            if (a.type === 'group') {
                if (a.dept === 'Custom') {
                    const customG = window.appCustomKahGroups.find(cg => cg.name === a.name.replace('zz KAH: ', ''));
                    return customG && customG.members.some(m => String(m).trim() === String(contact.phone).trim());
                } else if (a.name.startsWith('zz KAH:')) {
                    return window.appKahList.some(k => k.dept === a.dept && String(k.phone).trim() === String(contact.phone).trim());
                } else {
                    const contactDepts = (contact.dept || '').split(',').map(d => d.trim());
                    return contactDepts.includes(a.dept);
                }
            }
            return false;
        });
      } catch(e) { isTarget = String(l.Attendees).includes(String(contact.phone).trim()); }
    }
    
    if (!isTarget) return false;
    
    let sDate = new Date(l.StartDate);
    let eDate = new Date(l.EndDate);
    const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === l.LeaveType) : null;
    const isEvent = typeObj ? typeObj.isEvent : false;
    
    let isRepeating = false;
    if (isEvent && l.HalfDay && ['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY', 'WEEKDAY'].includes(String(l.HalfDay).toUpperCase())) {
        isRepeating = true;
    }

    if (!isEvent || (isEvent && !isRepeating)) {
        if (!isEvent || String(l.IsAllDay).toUpperCase() === 'TRUE') {
            sDate.setHours(0, 0, 0, 0);
            eDate.setHours(23, 59, 59, 999);
        }
        
        if (l.HalfDay === 'AM') {
            eDate.setHours(12, 30, 0, 0); 
        } else if (l.HalfDay === 'PM') {
            sDate.setHours(12, 30, 0, 0);
        } else if (l.HalfDay === 'Start PM') {
            if (now.toDateString() === sDate.toDateString()) sDate.setHours(12, 30, 0, 0);
        } else if (l.HalfDay === 'End AM') {
            if (now.toDateString() === eDate.toDateString()) eDate.setHours(12, 30, 0, 0);
        } else if (l.HalfDay === 'Start PM, End AM') {
            if (now.toDateString() === sDate.toDateString()) sDate.setHours(12, 30, 0, 0);
            if (now.toDateString() === eDate.toDateString()) eDate.setHours(12, 30, 0, 0);
        }
        
        return now >= sDate && now <= eDate;
    } else {
        const untilD = l.UntilDate ? new Date(l.UntilDate) : new Date(sDate.getTime() + 31536000000);
        untilD.setHours(23, 59, 59, 999);
        
        if (now < sDate || now > untilD) return false;
        
        const targetDate = new Date(now);
        targetDate.setHours(0,0,0,0);
        const startDay = new Date(sDate);
        startDay.setHours(0,0,0,0);
        
        let isDayMatch = false;
        const hd = String(l.HalfDay).toUpperCase();
        
        if (hd === 'DAILY') isDayMatch = true;
        else if (hd === 'WEEKDAY') isDayMatch = (targetDate.getDay() !== 0 && targetDate.getDay() !== 6);
        else if (hd === 'WEEKLY') {
            const diffDays = Math.round((targetDate.getTime() - startDay.getTime()) / 86400000);
            isDayMatch = (diffDays % 7 === 0);
        } else if (hd === 'MONTHLY') isDayMatch = (targetDate.getDate() === startDay.getDate());
        else if (hd === 'ANNUALLY') isDayMatch = (targetDate.getMonth() === startDay.getMonth() && targetDate.getDate() === startDay.getDate());
        
        if (!isDayMatch) return false;
        if (String(l.IsAllDay).toUpperCase() === 'TRUE') return true;
        
        const nowTime = now.getHours() * 60 + now.getMinutes();
        const sTime = sDate.getHours() * 60 + sDate.getMinutes();
        const eTime = eDate.getHours() * 60 + eDate.getMinutes();
        return nowTime >= sTime && nowTime <= eTime;
    }
  });
  
  let isOffice = true;
  let locationStr = 'Office';
  let halfDayIndicator = '';

  if (activeRecords.length > 0) {
    let activeRecord = activeRecords[0]; 
    
    for (const rec of activeRecords) {
       const tObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === rec.LeaveType) : null;
       const isEvt = tObj ? tObj.isEvent : false;
       let checkLoc = isEvt ? (rec.Location || 'Event') : (rec.LeaveType || 'Leave');
       
       if (String(checkLoc).toLowerCase() !== 'office') {
           activeRecord = rec; 
           break;
       }
    }

    const hd = activeRecord.HalfDay;
    if (hd && !['NONE', 'None', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY', 'WEEKDAY'].includes(hd)) {
        halfDayIndicator = ` (${hd})`;
    }

    const typeObj = window.appTypicalEventTypes ? window.appTypicalEventTypes.find(t => t.name === activeRecord.LeaveType) : null;
    const isEvent = typeObj ? typeObj.isEvent : false;

    if (isEvent) {
      locationStr = activeRecord.Location || 'Event';
      if (activeRecord.LocationDetails) {
          locationStr += ` - ${activeRecord.LocationDetails}`;
      }
      locationStr += halfDayIndicator;
      isOffice = String(activeRecord.Location || '').toLowerCase() === 'office';
    } else {
      locationStr = activeRecord.LeaveType || 'Leave';
      if (activeRecord.Country) locationStr += ` (${activeRecord.Country})`;
      locationStr += halfDayIndicator;
      isOffice = false;
    }
  }

  if (isOffice) inOfficeGlobal++;
  
  const isKAH = window.kahPhones && window.kahPhones.includes(String(contact.phone));
  
  const finalLocationStr = applyAcronymsFront(locationStr);
  const memberObj = { name: applyAcronymsFront(contact.name || 'Unknown'), isOffice: isOffice, location: finalLocationStr, isKAH: isKAH };
  
  let updateLevel = tree;
  parts.forEach(part => {
      if (isOffice) updateLevel[part]._meta.inOffice++;
      if (updateLevel[part]._meta.isTerminal && part === parts[parts.length - 1]) {
          updateLevel[part]._meta.members.push(memberObj);
      }
      updateLevel = updateLevel[part];
  });
});

if (paradeHeader) paradeHeader.innerHTML = `Overall Parade State<br><span class="text-green-600 dark:text-green-400 font-bold">(${inOfficeGlobal} / ${totalGlobal})</span>`;

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
        html += `<h3 class="font-bold text-lg md:text-xl mb-3 text-blue-700 dark:text-blue-400">${applyAcronymsFront(nodeName)} <span class="text-sm font-semibold text-gray-500 dark:text-darkmuted">(${meta.inOffice} / ${meta.total})</span></h3>`;
    } else if (depth === 1) {
        html += `<div class="mt-3 ml-3 border-l-2 border-purple-400 pl-3">`;
        html += `<h4 class="font-bold text-base mb-2 text-purple-700 dark:text-purple-400">${applyAcronymsFront(nodeName)} <span class="text-xs font-semibold text-gray-500 dark:text-darkmuted">(${meta.inOffice} / ${meta.total})</span></h4>`;
    } else {
        html += `<div class="mt-2 ml-3 border-l border-emerald-400 pl-2">`;
        html += `<h5 class="font-semibold text-sm mb-1.5 text-emerald-700 dark:text-emerald-400">${applyAcronymsFront(nodeName)} <span class="text-[10px] font-semibold text-gray-500 dark:text-darkmuted">(${meta.inOffice} / ${meta.total})</span></h5>`;
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