// ==========================================
// Global State & Constants
// ==========================================

let user = JSON.parse(localStorage.getItem('user')) || null;
let allLeaves =[];
let currentEditId = null;

// Contact & Search State
let companyContacts =[];
let validContactNames =[];
let fuseAllContacts = null;
let fuseAttendees = null;

// Form & Admin State
let tempLeaveTypes =[];
let adminKAHList =[];
let tempMenuOrder = [];
let eventAttendees =[]; 
let isInfoAll = false;

// Configuration States
let appMode = 'separated'; // 'separated' or 'unified'
let companyStructure =[]; // CHANGED: Now a flat array of hierarchical paths e.g.["HQ", "CIU", "CIU-COY1"]
let pendingStructureChanges = {}; 
let adminBehalfUser = null; 

// Dashboard State
let dashViewMode = 'agenda'; // 'agenda' or 'month'

// Date & Time Picker Target Data
let appData = {
  leave: { startD: new Date(), endD: new Date(), startAMPM: 'AM', endAMPM: 'PM' },
  event: { startD: new Date(), endD: new Date(), untilD: new Date(), isAllDay: false },
  parade: { targetD: new Date() },
  register: { birthdayD: new Date(2000, 0, 1), birthdaySelected: false },
  adminRegister: { birthdayD: new Date(2000, 0, 1), birthdaySelected: false },
  manageUser: { birthdayD: new Date(2000, 0, 1), birthdaySelected: false }
};

// Calendar Specific Dates
let dashDate = new Date(); dashDate.setHours(0,0,0,0);
let myDate = new Date(); myDate.setHours(0,0,0,0);
let dashMonth = new Date(dashDate.getFullYear(), dashDate.getMonth(), 1);
let myMonth = new Date(myDate.getFullYear(), myDate.getMonth(), 1);

// Constants
const mos =['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TAB_NAMES = {
  'dashboard': 'Dashboard',
  'parade-state': 'Parade State',
  'my-leaves': 'My Calendar',
  'submit-leave': 'Add Leave/MC/OIL',
  'submit-event': 'Add Event',
  'admin': 'Admin Settings',
  'admin-structure': 'Organisational Structure'
};

const DEFAULT_MENU =['dashboard', 'parade-state', 'my-leaves', 'submit-leave', 'submit-event'];