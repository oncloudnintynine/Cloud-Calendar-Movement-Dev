// ==========================================
// INFINITE ROLODEX PICKER ENGINE
// ==========================================
let activePicker = { ctx: '', field: '', type: 'date', currentVal: new Date() };

function openPicker(type, ctx, field) {
  activePicker = { ctx, field, type, currentVal: new Date(appData[ctx][field + 'D']) };
  document.getElementById('picker-title').innerText = type === 'datetime' ? 'Select Date & Time' : 'Select Date';
  buildWheels();
  document.getElementById('picker-modal').classList.remove('hidden-view');
  document.getElementById('picker-modal').classList.add('flex');
}

function closePicker() {
  document.getElementById('picker-modal').classList.add('hidden-view');
  document.getElementById('picker-modal').classList.remove('flex');
}

function confirmPicker() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  if(!wrapper) return;
  const wheels = Array.from(wrapper.querySelectorAll('.wheel-container'));
  
  const getVal = (wheel) => {
    if(!wheel) return null;
    const items = wheel.querySelectorAll('.wheel-item');
    const centerIdx = Math.round(wheel.scrollTop / 40);
    return items[centerIdx] ? parseInt(items[centerIdx].dataset.val) : null;
  };

  const dayWheel = wheels.find(w => w.dataset.type === 'day');
  const monthWheel = wheels.find(w => w.dataset.type === 'month');
  const yearWheel = wheels.find(w => w.dataset.type === 'year');
  const hourWheel = wheels.find(w => w.dataset.type === 'hour');
  const minWheel = wheels.find(w => w.dataset.type === 'min');

  const d = getVal(dayWheel) || 1;
  const m = getVal(monthWheel) || 0;
  const y = getVal(yearWheel) || 2024;
  const h = hourWheel ? getVal(hourWheel) : 0;
  const min = minWheel ? getVal(minWheel) : 0;

  const finalDate = new Date(y, m, d, h, min, 0);
  appData[activePicker.ctx][activePicker.field + 'D'] = finalDate;

  // Auto-sync start to end
  if (activePicker.ctx === 'parade') {
      renderParadeState();
  } else {
      if (activePicker.field === 'start') {
        if (finalDate > appData[activePicker.ctx].endD) {
          appData[activePicker.ctx].endD = new Date(finalDate);
        }
      }
  }

  updateButtonLabels(); 
  closePicker();
}

function buildWheels() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  wrapper.innerHTML = '<div class="wheel-highlight"></div>'; 
  const cv = activePicker.currentVal;
  
  const initialMaxDays = new Date(cv.getFullYear(), cv.getMonth() + 1, 0).getDate();
  const days = Array.from({length: initialMaxDays}, (_, i) => ({ val: i+1, label: String(i+1).padStart(2,'0') }));
  const months = mos.map((l, i) => ({ val: i, label: l }));
  const years = Array.from({length: 15}, (_, i) => ({ val: 2024+i, label: 2024+i }));
  const hours = Array.from({length: 24}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));
  const mins = Array.from({length: 60}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));

  const dw = createWheel(wrapper, 'day', days, cv.getDate());
  dw.dataset.maxDays = initialMaxDays;
  createWheel(wrapper, 'month', months, cv.getMonth());
  createWheel(wrapper, 'year', years, cv.getFullYear());
  
  if (activePicker.type === 'datetime') {
    const sep = document.createElement('div');
    sep.className = 'w-px bg-gray-300 dark:bg-darkborder mx-2 h-3/4 my-auto relative z-20';
    wrapper.appendChild(sep);

    createWheel(wrapper, 'hour', hours, cv.getHours());
    createWheel(wrapper, 'min', mins, cv.getMinutes());
  }
}

function populateWheel(container, dataArr, currentVal) {
  container.dataset.len = dataArr.length;
  const loops = 15; // Decreased from 50 to drastically reduce DOM generation delay
  let html = `<div style="height: 76px;"></div>`; 
  let targetScrollIndex = 0;
  for (let loop = 0; loop < loops; loop++) {
    dataArr.forEach(item => {
      if (loop === Math.floor(loops/2) && item.val === currentVal) targetScrollIndex = (loop * dataArr.length) + dataArr.indexOf(item);
      html += `<div class="wheel-item text-xl cursor-pointer select-none flex items-center justify-center h-[40px]" data-val="${item.val}">${item.label}</div>`;
    });
  }
  html += `<div style="height: 76px;"></div>`;
  
  container.style.scrollBehavior = 'auto';
  container.innerHTML = html; 
  
  requestAnimationFrame(() => {
    container.scrollTop = targetScrollIndex * 40;
    updateActiveItem(container);
    setTimeout(() => { container.style.scrollBehavior = 'smooth'; }, 100);
  });
}

function createWheel(parent, type, dataArr, currentVal) {
  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'flex flex-col items-center flex-1 h-full relative z-10 min-w-0';
  
  if(type === 'hour' || type === 'min') {
      const lbl = document.createElement('div');
      lbl.className = 'absolute top-1 text-[11px] font-bold text-gray-400 dark:text-darkmuted z-30 pointer-events-none w-full text-center bg-gradient-to-b from-gray-50 dark:from-darkinput to-transparent pb-3 pt-1';
      lbl.innerText = type === 'hour' ? 'HH' : 'MM';
      wrapperDiv.appendChild(lbl);
  }

  const container = document.createElement('div');
  container.className = 'wheel-container w-full h-full overflow-y-auto text-center px-1 relative';
  container.dataset.type = type;

  parent.appendChild(wrapperDiv); 
  populateWheel(container, dataArr, currentVal);
  wrapperDiv.appendChild(container); 

  let scrollTimeout;
  let lastCenterIdx = -1;

  container.addEventListener('scroll', () => {
    const currentIdx = Math.round(container.scrollTop / 40);

    if (lastCenterIdx !== -1 && lastCenterIdx !== currentIdx) {
      if (navigator.vibrate) navigator.vibrate(60); // Increased from 6 to 60 for 10x stronger haptics
    }
    lastCenterIdx = currentIdx;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const len = parseInt(container.dataset.len);
      const loops = 15; // Decreased from 50 to match populateWheel
      if (currentIdx < len * 5 || currentIdx > (len * loops) - (len * 5)) {
        const middleBase = Math.floor(loops/2) * len;
        container.style.scrollBehavior = 'auto'; 
        container.scrollTop = (middleBase + (currentIdx % len)) * 40;
        setTimeout(() => container.style.scrollBehavior = 'smooth', 50);
      }
      updateActiveItem(container);
      if (type !== 'min') adjustWheels();
    }, 100);
  });
  return container;
}

function adjustWheels() {
  const wrapper = document.getElementById('picker-wheels-wrapper');
  if (!wrapper) return;
  const wheels = Array.from(wrapper.querySelectorAll('.wheel-container'));
  const dayWheel = wheels.find(w => w.dataset.type === 'day');
  const monthWheel = wheels.find(w => w.dataset.type === 'month');
  const yearWheel = wheels.find(w => w.dataset.type === 'year');
  const hourWheel = wheels.find(w => w.dataset.type === 'hour');
  const minWheel = wheels.find(w => w.dataset.type === 'min');
  
  if (!dayWheel || !monthWheel || !yearWheel) return;

  const getVal = (wheel) => {
    if(!wheel) return null;
    const items = wheel.querySelectorAll('.wheel-item');
    const centerIdx = Math.round(wheel.scrollTop / 40);
    return items[centerIdx] ? parseInt(items[centerIdx].dataset.val) : null;
  };

  let y = getVal(yearWheel);
  let m = getVal(monthWheel);
  let d = getVal(dayWheel);
  let h = hourWheel ? getVal(hourWheel) : 0;
  let min = minWheel ? getVal(minWheel) : 0;
  
  if (m === null || y === null || d === null) return;

  // Active validation engine
  let minM = 0, minD = 1, minH = 0, minMin = 0;
  
  if (activePicker.field === 'end' && activePicker.ctx !== 'parade') {
      const startD = appData[activePicker.ctx].startD;
      
      // Check if user scrolled Year before start year
      if (y < startD.getFullYear()) {
          y = startD.getFullYear();
          populateWheel(yearWheel, Array.from({length: 15}, (_, i) => ({ val: Math.max(2024, y)+i, label: Math.max(2024, y)+i })), y);
      }
      
      if (y === startD.getFullYear()) {
          minM = startD.getMonth();
          if (m < minM) {
              m = minM;
              const monthsArr = mos.map((l, i) => ({ val: i, label: l })).filter(x => x.val >= minM);
              monthWheel.dataset.minVal = minM;
              populateWheel(monthWheel, monthsArr, m);
          }
          
          if (m === minM) {
              minD = startD.getDate();
              if (d < minD) d = minD;
              
              if (activePicker.type === 'datetime' && d === minD) {
                  minH = startD.getHours();
                  if (h < minH) {
                      h = minH;
                      if(hourWheel) {
                        hourWheel.dataset.minVal = minH;
                        populateWheel(hourWheel, Array.from({length: 24}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') })).filter(x => x.val >= minH), h);
                      }
                  }
                  
                  if (h === minH) {
                      minMin = startD.getMinutes();
                      if (min < minMin) {
                          min = minMin;
                          if(minWheel) {
                            minWheel.dataset.minVal = minMin;
                            populateWheel(minWheel, Array.from({length: 60}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') })).filter(x => x.val >= minMin), min);
                          }
                      }
                  }
              }
          }
      }
  }

  // Restore non-constrained boundaries dynamically if scrolled past the restricted zones
  if (activePicker.field === 'end' && activePicker.ctx !== 'parade') {
      const startD = appData[activePicker.ctx].startD;
      if (y > startD.getFullYear() || m > startD.getMonth()) minD = 1;
      if (y > startD.getFullYear() || m > startD.getMonth() || d > startD.getDate()) minH = 0;
      if (y > startD.getFullYear() || m > startD.getMonth() || d > startD.getDate() || h > startD.getHours()) minMin = 0;
  }

  // Dynamically reset wheels if their restrictions are lifted by scrolling
  const currentMinM = parseInt(monthWheel.dataset.minVal || '0');
  if (currentMinM !== minM) {
      monthWheel.dataset.minVal = minM;
      const monthsArr = mos.map((l, i) => ({ val: i, label: l })).filter(x => x.val >= minM);
      populateWheel(monthWheel, monthsArr, Math.max(m, minM));
  }
  
  const maxDays = new Date(y, m + 1, 0).getDate();
  const currentMinD = parseInt(dayWheel.dataset.minVal || '1');
  const currentMaxD = parseInt(dayWheel.dataset.maxDays || '31');
  
  if (currentMinD !== minD || currentMaxD !== maxDays) {
      dayWheel.dataset.minVal = minD;
      dayWheel.dataset.maxDays = maxDays;
      const daysArr = Array.from({length: maxDays}, (_, i) => ({ val: i+1, label: String(i+1).padStart(2,'0') })).filter(x => x.val >= minD);
      populateWheel(dayWheel, daysArr, Math.max(d, minD));
  }

  if (hourWheel) {
      const currentMinH = parseInt(hourWheel.dataset.minVal || '0');
      if (currentMinH !== minH) {
          hourWheel.dataset.minVal = minH;
          const hoursArr = Array.from({length: 24}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') })).filter(x => x.val >= minH);
          populateWheel(hourWheel, hoursArr, Math.max(h, minH));
      }
  }

  if (minWheel) {
      const currentMinMin = parseInt(minWheel.dataset.minVal || '0');
      if (currentMinMin !== minMin) {
          minWheel.dataset.minVal = minMin;
          const minsArr = Array.from({length: 60}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') })).filter(x => x.val >= minMin);
          populateWheel(minWheel, minsArr, Math.max(min, minMin));
      }
  }
}

function updateActiveItem(container) {
  const items = container.querySelectorAll('.wheel-item');
  items.forEach(el => el.classList.remove('active'));
  const centerIdx = Math.round(container.scrollTop / 40);
  if(items[centerIdx]) items[centerIdx].classList.add('active');
}
