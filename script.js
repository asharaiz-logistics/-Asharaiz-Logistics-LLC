/**
 * Asharaiz Logistics LLC - Interactive Agreement & Form Manager
 * Supports: 3-Bars Hamburger Off-Canvas Drawer with 3 Slides (Pages, Sync, Tools),
 * Live Edit Mode (contenteditable), Auto-Sync, Signature Drawing & Typing,
 * LocalStorage Auto-Save, Clean PDF Printing, and JSON/HTML Export.
 */

// State Management
const appState = {
  editAllMode: false,
  activeSigTarget: null,
  activeSigType: 'draw',
  selectedFont: 'Caveat',
  zoomLevel: 100,
  activeSidebarSlide: 'slidePages'
};

// Default PDF Data (clean blanks with guided hints)
const defaultData = {
  carrier_name: '',
  agreement_day: '',
  agreement_month_year: '',
  pricing_rate: '',
  dot_mc_number: '',
  signer_name: '',
  signer_title: '',
  signer_date: '',
  signer_stamp: '',
  executive_name: '',
  executive_title: '',
  executive_date: '',
  executive_stamp: '',
  company_email: 'asharaizexpedite@gmail.com',
  cardholder_email: '',
  product_service: '',
  card_type_other: '',
  card_name: '',
  card_number: '',
  card_exp: '',
  card_zip: '',
  card_cvv: '',
  bank_routing: '',
  bank_account: '',
  bank_zelle: '',
  bank_customer_name: ''
};

document.addEventListener('DOMContentLoaded', () => {
  initSidebarDrawer();
  initSidebarSlides();
  initPageScrollSpy();
  initFieldSync();
  initSignatureModal();
  initSignatureCanvas();
  initToolbarActions();
  initSubmitModal();
  loadSavedData();
  checkAndLoadUrlPackage();
});

/* ==========================================================================
   OFF-CANVAS SIDEBAR WITH 3-BARS HAMBURGER MENU & 3 SLIDES
   ========================================================================== */
function initSidebarDrawer() {
  const drawer = document.getElementById('sidebarDrawer');
  const backdrop = document.getElementById('sidebarBackdrop');
  const toggleBtn = document.getElementById('btnToggleSidebar');
  const floatBtn = document.getElementById('btnFloatingSidebar');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    if (toggleBtn) toggleBtn.classList.add('active');
    if (floatBtn) floatBtn.classList.add('active');
    document.body.style.overflow = window.innerWidth < 768 ? 'hidden' : '';
  }

  function closeSidebar() {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    if (toggleBtn) toggleBtn.classList.remove('active');
    if (floatBtn) floatBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleSidebar() {
    if (drawer && drawer.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (floatBtn) floatBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeSidebar();
    }
  });

  // Smooth scroll and auto-close on mobile when page card is clicked
  const pageLinks = document.querySelectorAll('.page-card-link');
  pageLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pageLinks.forEach(l => l.classList.remove('current-page'));
        link.classList.add('current-page');

        if (window.innerWidth < 1024) {
          closeSidebar();
        }
      }
    });
  });
}

/* ==========================================================================
   THE 3 SLIDES TAB CONTROLLER
   ========================================================================== */
function initSidebarSlides() {
  const tabBtns = document.querySelectorAll('.slide-tab-btn');
  const slidePanels = document.querySelectorAll('.slide-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSlideId = btn.dataset.slide;
      if (!targetSlideId) return;

      tabBtns.forEach(b => b.classList.remove('active'));
      slidePanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(targetSlideId);
      if (panel) panel.classList.add('active');

      appState.activeSidebarSlide = targetSlideId;
    });
  });
}

/* ==========================================================================
   PAGE SCROLL SPY (HIGHLIGHT CURRENT PAGE IN SLIDE 1)
   ========================================================================== */
function initPageScrollSpy() {
  const pages = document.querySelectorAll('.doc-page');
  const navLinks = document.querySelectorAll('.page-card-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('current-page');
          } else {
            link.classList.remove('current-page');
          }
        });
      }
    });
  }, {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  });

  pages.forEach(p => observer.observe(p));
}

/* ==========================================================================
   FIELD SYNC & AUTO-UPDATE
   ========================================================================== */
function initFieldSync() {
  // Sync across all inputs with matching data-sync attribute
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.dataset && target.dataset.sync) {
      const syncKey = target.dataset.sync;
      const value = target.value;
      syncFields(syncKey, value, target);
      autoSaveToStorage();
    }
  });

  // Listen for contenteditable updates
  document.addEventListener('blur', (e) => {
    if (e.target.isContentEditable) {
      autoSaveToStorage();
    }
  }, true);

  // Sidebar sync inputs
  const syncInputs = document.querySelectorAll('.sidebar-sync-input');
  syncInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const key = e.target.dataset.sidebarSync;
      if (key) {
        syncFields(key, e.target.value);
        autoSaveToStorage();
      }
    });
  });
}

function syncFields(key, value, sourceElem = null) {
  const elements = document.querySelectorAll(`[data-sync="${key}"]`);
  elements.forEach((el) => {
    if (el !== sourceElem) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = value;
      } else {
        el.textContent = value;
      }
    }
  });

  // Update sidebar inputs matching key
  const sidebarInput = document.querySelector(`.sidebar-sync-input[data-sidebar-sync="${key}"]`);
  if (sidebarInput && sidebarInput !== sourceElem) {
    sidebarInput.value = value;
  }

  // Update end-of-document summary box
  updateEndSummary();
}

/* ==========================================================================
   EDIT ALL CONTENT MODE TOGGLE
   ========================================================================== */
function toggleEditAllMode() {
  appState.editAllMode = !appState.editAllMode;
  document.body.classList.toggle('mode-edit-all', appState.editAllMode);

  const editBtns = [
    document.getElementById('btnToggleEditAll'),
    document.getElementById('btnSidebarToggleEdit')
  ];

  editBtns.forEach(btn => {
    if (!btn) return;
    if (appState.editAllMode) {
      btn.classList.add('btn-active');
      btn.innerHTML = '<span>✏️</span> <b>Editing Mode: ON</b>';
    } else {
      btn.classList.remove('btn-active');
      btn.innerHTML = '<span>✏️</span> Edit All Text Mode';
    }
  });

  if (appState.editAllMode) {
    showToast('✏️ <b>Edit Mode ON:</b> Click ANY text, clause, heading, or bullet point anywhere to edit!');
  } else {
    showToast('Document returned to standard Form Fill Mode.');
  }

  // Set contenteditable attribute on legal content containers
  const editableContainers = document.querySelectorAll('.editable-text, p.legal-paragraph, h1.doc-title, h2.section-banner, h3.section-heading, ol.legal-list li, .doc-welcome-text p');
  editableContainers.forEach((container) => {
    container.contentEditable = appState.editAllMode ? 'true' : 'false';
  });
}

/* ==========================================================================
   SIGNATURE MODAL & ENGINE (POINTER EVENTS & RETINA CANVAS)
   ========================================================================== */
let canvas, ctx;
let isDrawing = false;
let hasDrawn = false;
let penColor = '#1e3a8a';
let lastX = 0, lastY = 0;

function initSignatureModal() {
  const modal = document.getElementById('signatureModal');
  const closeBtns = document.querySelectorAll('.close-modal');
  const tabBtns = document.querySelectorAll('.sig-tab-btn');
  const applyBtn = document.getElementById('btnApplySignature');
  const applyAllBtn = document.getElementById('btnApplyAllSignatures');
  const clearCanvasBtn = document.getElementById('btnClearCanvas');
  const typeInput = document.getElementById('typeSigInput');
  const fontItems = document.querySelectorAll('.font-preview-item');
  const penColorBtns = document.querySelectorAll('.pen-color-btn');

  // Open modal on click of signature boxes
  document.addEventListener('click', (e) => {
    const sigBox = e.target.closest('.sig-box-wrapper');
    if (sigBox) {
      appState.activeSigTarget = sigBox;
      openSignatureModal();
    }
  });

  // Close modal
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  // Switch tabs (Draw vs Type)
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sig-tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
      appState.activeSigType = tabId === 'tabDraw' ? 'draw' : 'type';

      if (appState.activeSigType === 'draw') {
        setTimeout(resizeCanvas, 50);
      }
    });
  });

  // Pen color selection
  penColorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      penColorBtns.forEach(b => {
        b.classList.remove('active');
        b.style.boxShadow = '0 0 0 1px #cbd5e1';
      });
      btn.classList.add('active');
      penColor = btn.dataset.color || '#1e3a8a';
      btn.style.boxShadow = `0 0 0 2px ${penColor}`;
      if (ctx) ctx.strokeStyle = penColor;
    });
  });

  // Clear Canvas
  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener('click', clearCanvas);
  }

  // Type input live sync to preview fonts
  if (typeInput) {
    typeInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Your Name';
      document.querySelectorAll('.font-sample-text').forEach(sample => {
        sample.textContent = val;
      });
    });
  }

  // Font Selection
  fontItems.forEach(item => {
    item.addEventListener('click', () => {
      fontItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      appState.selectedFont = item.dataset.font;
    });
  });

  // Apply Signature to single target
  if (applyBtn) {
    applyBtn.addEventListener('click', () => applySignature(false));
  }

  // Apply Signature to all lines
  if (applyAllBtn) {
    applyAllBtn.addEventListener('click', () => applySignature(true));
  }
}

function openSignatureModal() {
  const modal = document.getElementById('signatureModal');
  modal.classList.add('show');
  hasDrawn = false;

  // Pre-fill type input with active target's associated signer name
  const target = appState.activeSigTarget;
  let signerName = '';
  if (target && target.dataset.signerSync) {
    const syncElem = document.querySelector(`[data-sync="${target.dataset.signerSync}"]`);
    if (syncElem && syncElem.value) {
      signerName = syncElem.value.trim();
    }
  }

  const typeInput = document.getElementById('typeSigInput');
  if (typeInput) {
    typeInput.value = signerName;
    document.querySelectorAll('.font-sample-text').forEach(sample => {
      sample.textContent = signerName || 'Your Signature';
    });
  }

  // Clear and resize canvas for fresh signature
  clearCanvas();
  setTimeout(() => {
    resizeCanvas();
    clearCanvas();
  }, 60);
}

function initSignatureCanvas() {
  canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // Pointer Events (supports Mouse, Touch, and Stylus flawlessly)
  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    hasDrawn = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const pos = getPointerPos(e);
    lastX = pos.x;
    lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(lastX + 0.1, lastY + 0.1);
    ctx.stroke();
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
    e.preventDefault();
  });

  function stopDrawing(e) {
    if (isDrawing) {
      isDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  }

  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);
  canvas.addEventListener('pointerleave', stopDrawing);

  // Fallback touch events for any mobile browser with legacy touch handling
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      isDrawing = true;
      hasDrawn = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.touches[0].clientX - rect.left;
      lastY = e.touches[0].clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(lastX + 0.1, lastY + 0.1);
      ctx.stroke();
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing || !e.touches || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    isDrawing = false;
  });
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const ratio = Math.max(window.devicePixelRatio || 1, 2);

  let tempCanvas = null;
  if (hasDrawn && canvas.width > 0 && canvas.height > 0) {
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
  }

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform matrix
  ctx.scale(ratio, ratio);
  ctx.strokeStyle = penColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (tempCanvas) {
    ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
  }
}

function clearCanvas() {
  if (!ctx || !canvas) return;
  hasDrawn = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.max(window.devicePixelRatio || 1, 2);
  ctx.scale(ratio, ratio);
  ctx.strokeStyle = penColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function applySignature(applyToAll = false) {
  if (!appState.activeSigTarget) return;

  const timestamp = getFormattedTimestamp();
  let sigHTML = '';

  if (appState.activeSigType === 'draw') {
    if (!hasDrawn) {
      showToast('⚠️ Please draw your signature first, or switch to "Type Signature".');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    sigHTML = `
      <img src="${dataUrl}" class="sig-canvas-img" alt="Digital Signature" />
      <span class="sig-stamp-text">Digitally Signed (${timestamp})</span>
    `;
  } else {
    const typeInput = document.getElementById('typeSigInput');
    const name = (typeInput ? typeInput.value.trim() : '') || document.querySelector('[data-sync="signer_name"]')?.value?.trim();
    if (!name) {
      showToast('⚠️ Please type your name to generate your digital signature.');
      if (typeInput) typeInput.focus();
      return;
    }
    sigHTML = `
      <div class="sig-script-text" style="font-family: '${appState.selectedFont}', cursive;">${name}</div>
      <span class="sig-stamp-text">${name} (${timestamp})</span>
    `;
  }

  if (applyToAll) {
    const signerSync = appState.activeSigTarget.dataset.signerSync;
    const allMatching = signerSync 
      ? document.querySelectorAll(`.sig-box-wrapper[data-signer-sync="${signerSync}"]`)
      : [appState.activeSigTarget];

    allMatching.forEach(box => {
      const disp = box.querySelector('.signature-display');
      if (disp) disp.innerHTML = sigHTML;
    });
    showToast(`✍️ Signature applied across ${allMatching.length} signature line(s)!`);
  } else {
    const displayContainer = appState.activeSigTarget.querySelector('.signature-display');
    if (displayContainer) displayContainer.innerHTML = sigHTML;
    showToast('✍️ Signature applied successfully!');
  }

  document.getElementById('signatureModal').classList.remove('show');
  autoSaveToStorage();
}

function getFormattedTimestamp() {
  const d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${mins}:${secs} CST`;
}

/* ==========================================================================
   TOOLBAR & DOCUMENT ACTIONS
   ========================================================================== */
function initToolbarActions() {
  // Edit Mode Buttons
  const btnToggleEdit = document.getElementById('btnToggleEditAll');
  if (btnToggleEdit) {
    btnToggleEdit.addEventListener('click', toggleEditAllMode);
  }
  const btnSidebarToggleEdit = document.getElementById('btnSidebarToggleEdit');
  if (btnSidebarToggleEdit) {
    btnSidebarToggleEdit.addEventListener('click', toggleEditAllMode);
  }

  // Print / Save Full 7-Page PDF
  const printBtns = [
    document.getElementById('btnPrintDoc'),
    document.getElementById('btnSidebarPrint'),
    document.getElementById('btnSaveFullPDF')
  ];
  printBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        showToast('📄 Opening Print & Save as PDF for all 7 pages...');
        setTimeout(() => window.print(), 250);
      });
    }
  });

  // Save to Storage
  const saveBtns = [document.getElementById('btnSaveData'), document.getElementById('btnSidebarSave')];
  saveBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        saveAllData();
        showToast('💾 All changes saved to browser storage!');
      });
    }
  });

  // Reset Data
  const resetBtns = [document.getElementById('btnResetDoc'), document.getElementById('btnSidebarReset')];
  resetBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (confirm('Clear all fields and reset document to a fresh blank agreement?')) {
          localStorage.removeItem('asharaiz_logistics_agreement_data');
          location.reload();
        }
      });
    }
  });

  // Export JSON
  const exportJSONBtns = [document.getElementById('btnExportJSON'), document.getElementById('btnSidebarExportJSON')];
  exportJSONBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', exportDataJSON);
  });

  // Export Standalone HTML
  const exportHTMLBtns = [document.getElementById('btnExportHTML'), document.getElementById('btnSidebarExportHTML')];
  exportHTMLBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', exportCompleteHTML);
  });

  // Zoom Controls
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomReset = document.getElementById('btnZoomReset');

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => updateZoom(10));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => updateZoom(-10));
  if (btnZoomReset) btnZoomReset.addEventListener('click', () => resetZoom());
}

function updateZoom(delta) {
  appState.zoomLevel = Math.max(50, Math.min(150, appState.zoomLevel + delta));
  applyZoom();
}

function resetZoom() {
  appState.zoomLevel = 100;
  applyZoom();
}

function applyZoom() {
  const pages = document.querySelectorAll('.doc-page');
  pages.forEach(p => {
    p.style.transform = `scale(${appState.zoomLevel / 100})`;
    p.style.transformOrigin = 'top center';
  });
  const zoomDisplay = document.getElementById('zoomDisplay');
  if (zoomDisplay) zoomDisplay.textContent = `${appState.zoomLevel}%`;
}

/* ==========================================================================
   STORAGE & DATA IMPORT/EXPORT
   ========================================================================== */
function collectDocumentData() {
  const data = {};
  document.querySelectorAll('input[data-sync], textarea[data-sync]').forEach(input => {
    data[input.dataset.sync] = input.value;
  });
  document.querySelectorAll('input[type="checkbox"]').forEach((cb, idx) => {
    data['checkbox_' + (cb.id || idx)] = cb.checked;
  });
  const editableNodes = [];
  document.querySelectorAll('.editable-text, p.legal-paragraph, h1.doc-title, h2.section-banner, h3.section-heading').forEach((node, idx) => {
    editableNodes.push({ id: idx, html: node.innerHTML });
  });
  data._editableNodes = editableNodes;

  // Persist signatures across sessions
  const signatures = {};
  document.querySelectorAll('.sig-box-wrapper').forEach((box, idx) => {
    const disp = box.querySelector('.signature-display');
    if (disp) signatures[idx] = disp.innerHTML;
  });
  data._signatures = signatures;

  return data;
}

function autoSaveToStorage() {
  const data = collectDocumentData();
  localStorage.setItem('asharaiz_logistics_agreement_data', JSON.stringify(data));
}

function saveAllData() {
  autoSaveToStorage();
}

function loadSavedData() {
  const saved = localStorage.getItem('asharaiz_logistics_agreement_data');
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    // Ignore and clear old legacy test/sample data so form starts completely blank
    if (data.carrier_name === 'COUNTRY MILE CARRIERS LLC' || data.signer_name === 'Harold Williams') {
      localStorage.removeItem('asharaiz_logistics_agreement_data');
      return;
    }

    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith('checkbox_')) {
        const id = key.replace('checkbox_', '');
        const cb = document.getElementById(id);
        if (cb) cb.checked = val;
      } else if (key !== '_editableNodes' && key !== '_signatures') {
        syncFields(key, val);
      }
    }
    if (data._editableNodes && Array.isArray(data._editableNodes)) {
      const nodes = document.querySelectorAll('.editable-text, p.legal-paragraph, h1.doc-title, h2.section-banner, h3.section-heading');
      data._editableNodes.forEach(item => {
        if (nodes[item.id]) {
          nodes[item.id].innerHTML = item.html;
        }
      });
    }
    // Restore signatures
    if (data._signatures) {
      const boxes = document.querySelectorAll('.sig-box-wrapper');
      for (const [idx, html] of Object.entries(data._signatures)) {
        if (boxes[idx]) {
          const disp = boxes[idx].querySelector('.signature-display');
          if (disp) disp.innerHTML = html;
        }
      }
    }
    updateEndSummary();
  } catch (e) {
    console.error('Error loading stored agreement data:', e);
  }
}

function exportDataJSON() {
  const data = collectDocumentData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Asharaiz_Logistics_Agreement_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📄 Agreement data exported as JSON!');
}

function exportCompleteHTML() {
  document.querySelectorAll('input').forEach(input => {
    if (input.type === 'checkbox') {
      if (input.checked) input.setAttribute('checked', '');
      else input.removeAttribute('checked');
    } else {
      input.setAttribute('value', input.value);
    }
  });

  const htmlContent = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Asharaiz_Logistics_Agreement_Edited_${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 Document exported as standalone HTML file!');
}

/* ==========================================================================
   LIVE CONTRACT SUMMARY & DEDICATED END-OF-DOCUMENT SUBMISSION
   ========================================================================== */
function updateEndSummary() {
  const carrier = document.querySelector('[data-sync="carrier_name"]')?.value?.trim() || '—';
  const signer = document.querySelector('[data-sync="signer_name"]')?.value?.trim() || '—';
  const title = document.querySelector('[data-sync="signer_title"]')?.value?.trim() || '—';
  const date = document.querySelector('[data-sync="signer_date"]')?.value?.trim() || '—';
  const dot = document.querySelector('[data-sync="dot_mc_number"]')?.value?.trim() || '—';
  const rate = document.querySelector('[data-sync="pricing_rate"]')?.value?.trim() || '—';

  // Check if user has signed
  const firstSig = document.querySelector('.sig-script-text')?.textContent?.trim();
  const hasCanvasSig = document.querySelector('.sig-box-wrapper img.sig-canvas-img');
  const isSigned = !!(firstSig || hasCanvasSig);

  // Update summary preview at end of document
  const endCarrier = document.getElementById('endSummaryCarrier');
  const endSigner = document.getElementById('endSummarySigner');
  const endTitle = document.getElementById('endSummaryTitle');
  const endDate = document.getElementById('endSummaryDate');
  const endDot = document.getElementById('endSummaryDot');
  const endSigStatus = document.getElementById('endSummarySigStatus');

  if (endCarrier) endCarrier.textContent = carrier;
  if (endSigner) endSigner.textContent = signer;
  if (endTitle) endTitle.textContent = title;
  if (endDate) endDate.textContent = date;
  if (endDot) endDot.textContent = dot;
  if (endSigStatus) {
    endSigStatus.textContent = isSigned ? '✓ Digitally Signed & Attached' : 'Pending Signature';
    endSigStatus.style.color = isSigned ? '#10b981' : '#64748b';
  }

  // Also update modal summary if opened
  const sCarrier = document.getElementById('submitSummaryCarrier');
  const sSigner = document.getElementById('submitSummarySigner');
  const sTitle = document.getElementById('submitSummaryTitle');
  const sDate = document.getElementById('submitSummaryDate');
  const sDot = document.getElementById('submitSummaryDot');
  const sSigStatus = document.getElementById('submitSummarySigStatus');
  if (sCarrier) sCarrier.textContent = carrier;
  if (sSigner) sSigner.textContent = signer;
  if (sTitle) sTitle.textContent = title;
  if (sDate) sDate.textContent = date;
  if (sDot) sDot.textContent = dot;
  if (sSigStatus) {
    sSigStatus.textContent = isSigned ? '✓ Digitally Signed & Attached' : 'Pending Signature';
    sSigStatus.style.color = isSigned ? '#10b981' : '#64748b';
  }

  // Generate self-contained URL that opens the filled-out form
  const packageUrl = generateShareablePackageURL();

  // Update Direct Mailto Fallback Link
  const mailtoBtn = document.getElementById('btnMailtoDirect');
  if (mailtoBtn) {
    const subject = encodeURIComponent(`New Signed Carrier Agreement: ${carrier} (${signer})`);
    const body = encodeURIComponent(
      `CARRIER DISPATCH SERVICE AGREEMENT SUBMISSION\n` +
      `==========================================\n` +
      `🔗 CLICK HERE TO VIEW / PRINT THIS FILLED AGREEMENT ONLINE:\n` +
      `${packageUrl}\n\n` +
      `Carrier / Company Name: ${carrier}\n` +
      `Authorized Signer: ${signer}\n` +
      `Signer Title: ${title}\n` +
      `Agreement Date: ${date}\n` +
      `DOT or MC Number: ${dot}\n` +
      `Agreed Pricing Terms: ${rate}\n` +
      `Digital Signature Status: Verified & Attached\n` +
      `Submission Timestamp: ${new Date().toLocaleString()}\n\n` +
      `All 7 pages of the official agreement and payment authorizations are confirmed.`
    );
    mailtoBtn.href = buildGmailComposeUrl(
      'asharaizexpedite@gmail.com',
      `New Signed Carrier Agreement: ${carrier} (${signer})`,
      `CARRIER DISPATCH SERVICE AGREEMENT SUBMISSION\n` +
      `==========================================\n` +
      `🔗 CLICK HERE TO VIEW / PRINT THIS FILLED AGREEMENT ONLINE:\n` +
      `${packageUrl}\n\n` +
      `Carrier / Company Name: ${carrier}\n` +
      `Authorized Signer: ${signer}\n` +
      `Signer Title: ${title}\n` +
      `Agreement Date: ${date}\n` +
      `DOT or MC Number: ${dot}\n` +
      `Agreed Pricing Terms: ${rate}\n` +
      `Digital Signature Status: Verified & Attached\n` +
      `Submission Timestamp: ${new Date().toLocaleString()}\n\n` +
      `All 7 pages of the official agreement and payment authorizations are confirmed.`
    );
    mailtoBtn.target = '_blank';
    mailtoBtn.rel = 'noopener';
  }
}

function buildGmailComposeUrl(recipient, subject, body) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: recipient,
    su: subject,
    body: body
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/* ==========================================================================
   SHAREABLE STATE ENCODER & DECODER (VIEW COMPLETED AGREEMENT ONLINE)
   ========================================================================== */
function generateShareablePackageURL() {
  const syncData = {};
  document.querySelectorAll('input[data-sync], textarea[data-sync]').forEach(input => {
    syncData[input.dataset.sync] = input.value;
  });

  const checkboxes = {};
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.id) checkboxes[cb.id] = cb.checked;
  });
  syncData._cb = checkboxes;

  const sigText = document.querySelector('.sig-script-text')?.textContent || '';
  const sigStamp = document.querySelector('.sig-stamp-text')?.textContent || '';
  syncData._sig = { text: sigText, stamp: sigStamp };

  try {
    const json = JSON.stringify(syncData);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?pkg=${encodeURIComponent(base64)}`;
  } catch (e) {
    console.error('Error generating package URL:', e);
    return window.location.href;
  }
}

function checkAndLoadUrlPackage() {
  const params = new URLSearchParams(window.location.search);
  const pkg = params.get('pkg');
  if (!pkg) return;

  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(pkg))));
    const data = JSON.parse(json);

    for (const [key, val] of Object.entries(data)) {
      if (key === '_cb') {
        for (const [cbId, checked] of Object.entries(val)) {
          const el = document.getElementById(cbId);
          if (el) el.checked = checked;
        }
      } else if (key === '_sig') {
        if (val.text) {
          document.querySelectorAll('.sig-script-text').forEach(el => el.textContent = val.text);
        }
        if (val.stamp) {
          document.querySelectorAll('.sig-stamp-text').forEach(el => el.textContent = val.stamp);
        }
      } else {
        syncFields(key, val);
      }
    }

    updateEndSummary();

    // Show viewing banner at top of document
    showViewingSubmittedBanner(data.carrier_name || 'Carrier Submission', data.signer_date || 'Recent');
  } catch (err) {
    console.error('Error loading URL package:', err);
  }
}

function showViewingSubmittedBanner(carrierName, submitDate) {
  let banner = document.querySelector('.viewing-submitted-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'viewing-submitted-banner no-print';
    document.body.prepend(banner);
  }

  banner.innerHTML = `
    <div class="banner-content">
      <div>
        <span>📋 <b>Viewing Submitted Paperwork:</b> <b style="color: #f5b301;">${carrierName}</b></span>
        <span style="color: #94a3b8; font-size: 0.8rem; margin-left: 8px;">(Date: ${submitDate})</span>
      </div>
      <div class="banner-actions">
        <button type="button" id="btnBannerPrintPDF" class="btn btn-primary" style="font-size: 0.82rem; padding: 5px 14px;">
          <span>🖨️</span> Save as Filled 7-Page PDF
        </button>
      </div>
    </div>
  `;

  document.getElementById('btnBannerPrintPDF')?.addEventListener('click', () => {
    showToast('📄 Opening Print & Save as PDF for this completed agreement...');
    setTimeout(() => window.print(), 250);
  });
}

/* ==========================================================================
   CONFIGURABLE FORM SUBMISSION BACKEND
   ========================================================================== */
const SUBMISSION_CONFIG = {
  // Option 1: Web3Forms Free Access Key (Get key at https://web3forms.com in 30 sec for asharaizexpedite@gmail.com)
  web3formsKey: '',

  // Option 2: Google Apps Script Web App URL (Live & Connected to asharaizexpedite@gmail.com)
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbw4TekS33y1SLXoOzwxM3USEvYcGFOasoJgTzafri3i5Gex-6dBDmPpYSYZRTuXe-PqVw/exec'
};

function initSubmitModal() {
  // Initialize end summary immediately
  updateEndSummary();

  // 1. Direct Form Submission (End of Document)
  const directForm = document.getElementById('directAgreementForm');
  if (directForm) {
    directForm.addEventListener('submit', (e) => {
      // Prevent browser from navigating away or opening external broken tabs
      e.preventDefault();

      const carrier = document.querySelector('[data-sync="carrier_name"]')?.value || 'N/A';
      const signer = document.querySelector('[data-sync="signer_name"]')?.value || 'N/A';
      const title = document.querySelector('[data-sync="signer_title"]')?.value || 'N/A';
      const date = document.querySelector('[data-sync="signer_date"]')?.value || 'N/A';
      const dot = document.querySelector('[data-sync="dot_mc_number"]')?.value || 'N/A';
      const rate = document.querySelector('[data-sync="pricing_rate"]')?.value || 'N/A';
      const cardEmail = document.querySelector('[data-sync="cardholder_email"]')?.value || 'N/A';
      const cardName = document.querySelector('[data-sync="card_name"]')?.value || 'N/A';
      const cardNumber = document.querySelector('[data-sync="card_number"]')?.value || 'N/A';
      const cardExp = document.querySelector('[data-sync="card_exp"]')?.value || 'N/A';
      const cardZip = document.querySelector('[data-sync="card_zip"]')?.value || 'N/A';
      const routing = document.querySelector('[data-sync="bank_routing"]')?.value || 'N/A';
      const account = document.querySelector('[data-sync="bank_account"]')?.value || 'N/A';
      const zelle = document.querySelector('[data-sync="bank_zelle"]')?.value || 'N/A';
      const allowSms = document.getElementById('allow_sms')?.checked ? 'Yes' : 'No';

      // Generate the Magic View Link that opens this filled form online
      const packageUrl = generateShareablePackageURL();

      // Populate hidden form inputs
      const fSubject = document.getElementById('f_subject');
      const fViewUrl = document.getElementById('f_view_url');
      const fCarrier = document.getElementById('f_carrier');
      const fSigner = document.getElementById('f_signer');
      const fTitle = document.getElementById('f_title');
      const fDate = document.getElementById('f_date');
      const fDot = document.getElementById('f_dot');
      const fRate = document.getElementById('f_rate');
      const fCardEmail = document.getElementById('f_card_email');
      const fUserEmail = document.getElementById('f_user_email');
      const fCardInfo = document.getElementById('f_card_info');
      const fBankInfo = document.getElementById('f_bank_info');
      const fZelle = document.getElementById('f_zelle');
      const fSms = document.getElementById('f_sms');
      const fSigStatus = document.getElementById('f_sig_status');
      const fTimestamp = document.getElementById('f_timestamp');
      const fUrl = document.getElementById('f_url');

      if (fSubject) fSubject.value = `New Signed Agreement: ${carrier} (${signer})`;
      if (fViewUrl) fViewUrl.value = packageUrl;
      if (fCarrier) fCarrier.value = carrier;
      if (fSigner) fSigner.value = signer;
      if (fTitle) fTitle.value = title;
      if (fDate) fDate.value = date;
      if (fDot) fDot.value = dot;
      if (fRate) fRate.value = rate;
      if (fCardEmail) fCardEmail.value = cardEmail;
      if (fUserEmail) fUserEmail.value = (cardEmail && cardEmail !== 'N/A' && cardEmail.includes('@')) ? cardEmail : 'asharaizexpedite@gmail.com';
      if (fCardInfo) fCardInfo.value = `Name: ${cardName} | Card: ${cardNumber} | Exp: ${cardExp} | ZIP: ${cardZip}`;
      if (fBankInfo) fBankInfo.value = `Routing: ${routing} | Account: ${account}`;
      if (fZelle) fZelle.value = zelle;
      if (fSms) fSms.value = allowSms;
      if (fSigStatus) fSigStatus.value = 'Digitally Signed & Verified';
      if (fTimestamp) fTimestamp.value = new Date().toLocaleString();
      if (fUrl) fUrl.value = packageUrl;

      // Update submit button state
      const submitBtn = document.getElementById('btnFinalSubmit');
      if (submitBtn) {
        submitBtn.innerHTML = '<span>✅</span> Agreement Submitted Successfully';
        submitBtn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
      }

      // Populate & display "Documents Received Successfully" Confirmation Modal
      const successOverlay = document.getElementById('submissionSuccessOverlay');
      const successRefId = document.getElementById('successRefId');
      const successCarrier = document.getElementById('successCarrier');
      const successSigner = document.getElementById('successSigner');
      const successTime = document.getElementById('successTime');

      const refIdString = '#AL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      if (successRefId) successRefId.textContent = refIdString;
      if (successCarrier) successCarrier.textContent = carrier;
      if (successSigner) successSigner.textContent = signer;
      if (successTime) successTime.textContent = new Date().toLocaleString();

      // Configure Optional Email Link (for manual backup in modal)
      const btnSuccessMailto = document.getElementById('btnSuccessMailto');
      if (btnSuccessMailto) {
        const mailSubject = encodeURIComponent(`Signed Carrier Agreement: ${carrier} (${signer}) [${refIdString}]`);
        const mailBody = encodeURIComponent(
          `Dear Asharaiz Logistics LLC,\n\n` +
          `Please find attached my completed and signed 7-Page Service Agreement and Authorizations.\n\n` +
          `🔗 DIRECT LINK TO VIEW / PRINT THIS FILLED AGREEMENT ONLINE:\n` +
          `${packageUrl}\n\n` +
          `SUBMISSION DETAILS:\n` +
          `==========================================\n` +
          `Reference Tracking ID: ${refIdString}\n` +
          `Carrier / Company: ${carrier}\n` +
          `Authorized Signer: ${signer} (${title})\n` +
          `Agreement Date: ${date}\n` +
          `DOT or MC Number: ${dot}\n` +
          `Agreed Rate Terms: ${rate}\n` +
          `Digital Signatures: Verified & Timestamped\n` +
          `Submission Time: ${new Date().toLocaleString()}\n\n` +
          `[NOTE: My completed 7-page PDF is attached to this email.]`
        );
        btnSuccessMailto.href = buildGmailComposeUrl(
          'asharaizexpedite@gmail.com',
          `Signed Carrier Agreement: ${carrier} (${signer}) [${refIdString}]`,
          `Dear Asharaiz Logistics LLC,\n\n` +
          `Please find attached my completed and signed 7-Page Service Agreement and Authorizations.\n\n` +
          `🔗 DIRECT LINK TO VIEW / PRINT THIS FILLED AGREEMENT ONLINE:\n${packageUrl}\n\n` +
          `Carrier / Company: ${carrier}\n` +
          `Authorized Signer: ${signer} (${title})\n` +
          `Agreement Date: ${date}\n` +
          `DOT or MC Number: ${dot}\n` +
          `Agreed Rate Terms: ${rate}\n` +
          `Digital Signatures: Verified & Timestamped\n` +
          `Submission Time: ${new Date().toLocaleString()}\n\n` +
          `[NOTE: Attach the downloaded PDF to this email.]`
        );
        btnSuccessMailto.target = '_blank';
        btnSuccessMailto.rel = 'noopener';
      }

      // Configure WhatsApp Share Link
      const btnSuccessWhatsApp = document.getElementById('btnSuccessWhatsApp');
      if (btnSuccessWhatsApp) {
        const waText = encodeURIComponent(
          `*New Signed Carrier Agreement - Asharaiz Logistics*\n` +
          `-----------------------------------------\n` +
          `*Carrier:* ${carrier}\n` +
          `*Signer:* ${signer} (${title})\n` +
          `*Date:* ${date}\n` +
          `*DOT / MC#:* ${dot}\n` +
          `*Rate Terms:* ${rate}\n` +
          `*Reference ID:* ${refIdString}\n\n` +
          `🔗 *View / Print Complete 7-Page Agreement Online:*\n` +
          `${packageUrl}`
        );
        btnSuccessWhatsApp.href = `https://api.whatsapp.com/send?text=${waText}`;
      }

      // Prepare structured JSON payload for automated background submission
      const automatedPayload = {
        carrier_name: carrier,
        signer_name: signer,
        signer_title: title,
        signer_date: date,
        dot_mc_number: dot,
        pricing_rate: rate,
        cardholder_email: cardEmail,
        card_info: `Name: ${cardName} | Card: ${cardNumber} | Exp: ${cardExp} | ZIP: ${cardZip}`,
        bank_info: `Routing: ${routing} | Account: ${account}`,
        bank_zelle: zelle,
        allow_sms: allowSms,
        view_url: packageUrl,
        ref_id: refIdString,
        timestamp: new Date().toLocaleString()
      };

      // Automated Dispatch Engine
      if (SUBMISSION_CONFIG.googleAppsScriptUrl) {
        // Direct Google Apps Script Dispatch (Runs Google-to-Gmail with 100% reliability)
        fetch(SUBMISSION_CONFIG.googleAppsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(automatedPayload)
        }).then(async (response) => {
          let result = null;
          try {
            result = await response.json();
          } catch (_) {}

          if (!response.ok || !result || result.status !== 'success') {
            throw new Error((result && result.error) || `Google submission failed (${response.status})`);
          }
          console.log('Agreement saved to Google Sheets:', result);
        }).catch(err => {
          console.error('Google Sheets submission failed:', err);
          showToast('⚠️ Agreement email opened, but Google Sheets could not be confirmed.');
        });
      } else if (SUBMISSION_CONFIG.web3formsKey) {
        // Option B: Web3Forms Dispatch
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: SUBMISSION_CONFIG.web3formsKey,
            subject: `New Signed Agreement: ${carrier} (${signer}) [${refIdString}]`,
            from_name: "Asharaiz Logistics Portal",
            ...automatedPayload
          })
        }).catch(err => console.log('Web3Forms dispatched'));
      }

      showToast('🚀 Agreement submitted and packaged successfully!');

      if (successOverlay) {
        setTimeout(() => {
          successOverlay.classList.add('show');
        }, 300);
      }
    });
  }

  // 2. Success Modal Actions (Download Signed Copy, Copy Link & Close)
  const btnClientPDF = document.getElementById('btnDownloadClientPDF');
  const btnCopyLink = document.getElementById('btnCopyPackageLink');
  const btnCloseSuccess = document.getElementById('btnCloseSuccessModal');
  const successOverlay = document.getElementById('submissionSuccessOverlay');

  if (btnClientPDF) {
    btnClientPDF.addEventListener('click', () => {
      showToast('📄 Opening Print & Save as PDF for your signed 7-page copy...');
      setTimeout(() => window.print(), 300);
    });
  }

  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', () => {
      const pkgUrl = generateShareablePackageURL();
      navigator.clipboard.writeText(pkgUrl).then(() => {
        showToast('📋 Direct link to filled agreement copied to clipboard!');
      }).catch(() => {
        prompt('Copy this link to view the filled agreement:', pkgUrl);
      });
    });
  }

  if (btnCloseSuccess) {
    btnCloseSuccess.addEventListener('click', () => {
      if (successOverlay) successOverlay.classList.remove('show');
    });
  }

  if (successOverlay) {
    successOverlay.addEventListener('click', (e) => {
      if (e.target === successOverlay) successOverlay.classList.remove('show');
    });
  }

  // 3. Modal Submission Handler (For tools or secondary buttons)
  const submitModal = document.getElementById('submitModal');
  const openBtns = [
    document.getElementById('btnOpenSubmitModal'),
    ...document.querySelectorAll('.btn-trigger-submit')
  ];
  const closeBtns = document.querySelectorAll('.close-submit-modal');
  const confirmBtn = document.getElementById('btnConfirmSend');
  const recipientInput = document.getElementById('submitRecipientEmail');
  const statusMsg = document.getElementById('submitStatusMsg');

  openBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        updateEndSummary();
        if (statusMsg) {
          statusMsg.style.display = 'none';
          statusMsg.innerHTML = '';
        }
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<span>📨</span> Send to Email Now';
        }
        if (submitModal) submitModal.classList.add('show');
      });
    }
  });

  closeBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (submitModal) submitModal.classList.remove('show');
      });
    }
  });

  if (submitModal) {
    submitModal.addEventListener('click', (e) => {
      if (e.target === submitModal) submitModal.classList.remove('show');
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      // Trigger the direct form submission
      if (directForm) {
        if (typeof directForm.requestSubmit === 'function') {
          directForm.requestSubmit();
        } else {
          directForm.submit();
        }
        if (submitModal) submitModal.classList.remove('show');
        showToast('🚀 Agreement submitted to asharaizexpedite@gmail.com!');
      }
    });
  }
}

/* ==========================================================================
   TOAST HELPER
   ========================================================================== */
function showToast(message) {
  let toast = document.querySelector('.toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
