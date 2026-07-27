import { UI } from './store.js';
import { AppTemplate } from './views.js';
import './handlers.js';

UI.render = function() {
  const activeEl = document.activeElement;
  const activeId = activeEl ? activeEl.id : null;
  let cursorStart = null, cursorEnd = null;
  if (activeId && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      try { cursorStart = activeEl.selectionStart; cursorEnd = activeEl.selectionEnd; } catch (e) {} 
  }

  const template = AppTemplate(this.state);
  const container = document.getElementById('dp-app');
  if (container) {
    container.innerHTML = template;
    if (window.lucide) window.lucide.createIcons();
  }

  if (this.state.activeTab === 'setup' && !this.state.editingRoleId && typeof window.dpRenderShiftInputs === 'function') {
      window.dpRenderShiftInputs();
  }

  if (activeId) {
      const restoredEl = document.getElementById(activeId);
      if (restoredEl) {
          restoredEl.focus();
          if (cursorStart !== null && cursorEnd !== null) {
              try { restoredEl.setSelectionRange(cursorStart, cursorEnd); } catch (e) {}
          }
      }
  }
};

// Expose initialization so Cloudy app can call it
window.initDutyPlanner = () => {
  UI.init();
};

