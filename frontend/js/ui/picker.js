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

// Validate end date not before start date
if (activePicker.field === 'end' && activePicker.ctx !== 'parade') {
  const startD = appData[activePicker.ctx].startD;
  if (finalDate < startD) {
      alert("End date/time cannot be before the start date/time.");
      return; // Stay in the picker
  }
}

appData[activePicker.ctx][activePicker.field + 'D'] = finalDate;
appData[activePicker.ctx][activePicker.field + 'Selected'] = true;

if (activePicker.ctx === 'parade') {
 renderParadeState();
} else {
 if (activePicker.field === 'start') {
   if (activePicker.type === 'datetime') {
     // Auto change end date/time to 1 hour after start time for numerical timing events
     appData[activePicker.ctx].endD = new Date(finalDate.getTime() + 60 * 60 * 1000);
   } else {
     // For all-day events, just match the end date if it is currently set before the new start date
     if (finalDate > appData[activePicker.ctx].endD) {
       appData[activePicker.ctx].endD = new Date(finalDate);
     }
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

const isBirthday = activePicker.field === 'birthday';
const yearsLen = isBirthday ? 100 : 15;
const baseYear = isBirthday ? (new Date().getFullYear() - 99) : 2024;
const years = Array.from({length: yearsLen}, (_, i) => ({ val: baseYear+i, label: baseYear+i }));

const hours = Array.from({length: 24}, (_, i) => ({ val: i, label: String(i).padStart(2,'0') }));
const min5 = Math.floor(cv.getMinutes() / 5) * 5;
const mins = Array.from({length: 12}, (_, i) => ({ val: i*5, label: String(i*5).padStart(2,'0') }));

const dw = createWheel(wrapper, 'day', days, cv.getDate());
dw.dataset.maxDays = initialMaxDays;
createWheel(wrapper, 'month', months, cv.getMonth());
createWheel(wrapper, 'year', years, cv.getFullYear());

if (activePicker.type === 'datetime') {
const sep = document.createElement('div');
sep.className = 'w-px bg-gray-300 dark:bg-darkborder mx-2 h-3/4 my-auto relative z-20';
wrapper.appendChild(sep);

createWheel(wrapper, 'hour', hours, cv.getHours());
createWheel(wrapper, 'min', mins, min5);
}
}

function populateWheel(container, dataArr, currentVal) {
container.dataset.len = dataArr.length;
const loops = 3; 
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

// Pointer Drag Events for Desktop UX
let isDragging = false;
let wasDragged = false;
let startY = 0;
let startScrollTop = 0;

container.addEventListener('pointerdown', (e) => {
   if (e.pointerType !== 'mouse') return;
   isDragging = true;
   wasDragged = false;
   container.style.scrollBehavior = 'auto';
   container.style.scrollSnapType = 'none';
   startY = e.pageY;
   startScrollTop = container.scrollTop;
});

const stopDrag = () => {
   if (!isDragging) return;
   isDragging = false;
   container.style.scrollSnapType = 'y mandatory';
   
   // Snap to nearest
   const currentIdx = Math.round(container.scrollTop / 40);
   container.style.scrollBehavior = 'smooth';
   container.scrollTop = currentIdx * 40;
};

container.addEventListener('pointerleave', stopDrag);
container.addEventListener('pointerup', stopDrag);
container.addEventListener('pointercancel', stopDrag);

container.addEventListener('pointermove', (e) => {
   if (!isDragging || e.pointerType !== 'mouse') return;
   e.preventDefault();
   const y = e.pageY;
   const walk = (y - startY) * 1.5;
   if (Math.abs(walk) > 5) wasDragged = true;
   container.scrollTop = startScrollTop - walk;
});

// Click to center functionality
container.addEventListener('click', (e) => {
   if (wasDragged) {
       e.preventDefault();
       e.stopPropagation();
       return;
   }
   const item = e.target.closest('.wheel-item');
   if (!item) return;
   const allItems = Array.from(container.querySelectorAll('.wheel-item'));
   const idx = allItems.indexOf(item);
   if (idx !== -1) {
       container.style.scrollBehavior = 'smooth';
       container.scrollTop = idx * 40;
   }
});

container.addEventListener('scroll', () => {
if (isDragging) return;
const currentIdx = Math.round(container.scrollTop / 40);

if (lastCenterIdx !== -1 && lastCenterIdx !== currentIdx) {
 if (navigator.vibrate) navigator.vibrate(20);
}
lastCenterIdx = currentIdx;

clearTimeout(scrollTimeout);
scrollTimeout = setTimeout(() => {
 const len = parseInt(container.dataset.len);
 const loops = 3; 
 
 // Recenter if nearing edges
 if (currentIdx < len || currentIdx > (len * loops) - len) {
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

if (m === null || y === null || d === null) return;

// Only enforce maximum days in the month to prevent selecting invalid dates like Feb 30.
const maxDays = new Date(y, m + 1, 0).getDate();
const currentMaxD = parseInt(dayWheel.dataset.maxDays || '31');

if (currentMaxD !== maxDays) {
 dayWheel.dataset.maxDays = maxDays;
 const daysArr = Array.from({length: maxDays}, (_, i) => ({ val: i+1, label: String(i+1).padStart(2,'0') }));
 populateWheel(dayWheel, daysArr, Math.min(d, maxDays));
}
}

function updateActiveItem(container) {
const items = container.querySelectorAll('.wheel-item');
items.forEach(el => el.classList.remove('active'));
const centerIdx = Math.round(container.scrollTop / 40);
if(items[centerIdx]) items[centerIdx].classList.add('active');
}