//Rounds, Segments, and Criteria are all part of the Competition Setup.

window.CompetitionModule = {
  state: {
    activeEvent: null,
    selectedRoundId: null,
    selectedRound: null,
    editingSegmentId: null,
  },

  initSegmentsView(activeEvent) {
    this.state.activeEvent = activeEvent || null;
    const hasEvent = !!(activeEvent && activeEvent.id);
    const rounds = this.loadRounds(hasEvent ? activeEvent.id : 'default');
    const roundSelect = document.getElementById('roundSelect');
    const noRounds = document.getElementById('noRoundsState');
    const selection = document.getElementById('roundSelectionContainer');
    const addBtn = document.getElementById('addSegmentBtn');
    const goBtn = document.getElementById('goToManageRounds');
    if (goBtn) goBtn.addEventListener('click', () => {
      const nav = document.querySelector('[data-nav="manage-rounds"]');
      if (nav) nav.click();
    });
    if (!rounds || rounds.length === 0) {
      if (noRounds) noRounds.style.display = '';
      if (selection) selection.style.display = 'none';
      if (addBtn) addBtn.disabled = true;
      return;
    }
    if (noRounds) noRounds.style.display = 'none';
    if (selection) selection.style.display = '';
    this.populateRoundSelect(rounds);
    if (roundSelect) roundSelect.addEventListener('change', () => this.onRoundChange());
    this.onRoundChange();
    this.attachSegmentHandlers();
  },

  getRoundsKey(eventId) {
    return 'bpms_rounds_' + eventId;
  },

  loadRounds(eventId) {
    const raw = localStorage.getItem(this.getRoundsKey(eventId));
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },

  getSegmentsKey(eventId, roundId) {
    return 'bpms_segments_' + eventId + '_' + roundId;
  },

  getCriteriaKey(eventId, roundId, segmentId) {
    return 'bpms_criteria_' + eventId + '_' + roundId + '_' + segmentId;
  },

  loadCriteria(eventId, roundId, segmentId) {
    const raw = localStorage.getItem(this.getCriteriaKey(eventId, roundId, segmentId));
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },

  saveCriteria(eventId, roundId, segmentId, list) {
    localStorage.setItem(this.getCriteriaKey(eventId, roundId, segmentId), JSON.stringify(list || []));
  },

  loadSegments(eventId, roundId) {
    const raw = localStorage.getItem(this.getSegmentsKey(eventId, roundId));
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },

  saveSegments(eventId, roundId, list) {
    localStorage.setItem(this.getSegmentsKey(eventId, roundId), JSON.stringify(list || []));
  },

  populateRoundSelect(rounds) {
    const roundSelect = document.getElementById('roundSelect');
    if (!roundSelect) return;
    const options = ['<option value="">Select a round</option>'].concat(
      rounds.sort((a,b)=>a.order-b.order).map(r => `<option value="${r.id}">${r.name} (Order ${r.order})</option>`)
    );
    roundSelect.innerHTML = options.join('');
  },

  onRoundChange() {
    const sel = document.getElementById('roundSelect');
    const badge = document.getElementById('roundStatusBadge');
    const lockMsg = document.getElementById('roundLockMessage');
    const addBtn = document.getElementById('addSegmentBtn');
    const lockBtn = document.getElementById('lockRoundBtn');
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const rounds = this.loadRounds(eventId);
    const id = sel && sel.value ? sel.value : '';
    this.state.selectedRoundId = id || null;
    this.state.selectedRound = id ? rounds.find(r => r.id === id) : null;
    const r = this.state.selectedRound;
    if (!r) {
      if (badge) { badge.className = 'status-badge pending'; badge.textContent = '-'; }
      if (lockMsg) lockMsg.style.display = 'none';
      if (addBtn) addBtn.disabled = true;
      if (lockBtn) lockBtn.disabled = true;
      this.renderSegmentsTable([]);
      return;
    }
    const status = r.status || 'Draft';
    const cls = status === 'Locked' ? 'approved' : (status === 'Draft' ? 'pending' : 'approved');
    if (badge) { badge.className = 'status-badge ' + cls; badge.textContent = status; }
    const inactive = r.active === false;
    const locked = status !== 'Draft' || inactive;
    if (lockMsg) {
      if (locked) {
        lockMsg.textContent = inactive ? 'This round is deactivated. Editing is disabled.' : 'This round is locked. Editing is disabled.';
        lockMsg.style.display = '';
      } else {
        lockMsg.style.display = 'none';
      }
    }
    if (addBtn) addBtn.disabled = locked;
    if (lockBtn && inactive) lockBtn.disabled = true;
    const segs = this.loadSegments(eventId, r.id);
    this.renderSegmentsTable(segs);
    this.updatePercentStatus(segs);
    this.updateScoringOptions(r);
  },

  updateScoringOptions(round) {
    const sel = document.getElementById('scoringMethod');
    if (!sel) return;
    const hasAudience = !!round.audience_voting;
    const opts = hasAudience
      ? ['<option value="Judge">Judge only</option>','<option value="Judge+Audience">Judge + Audience</option>']
      : ['<option value="Judge">Judge only</option>'];
    sel.innerHTML = opts.join('');
  },

  attachSegmentHandlers() {
    const addBtn = document.getElementById('addSegmentBtn');
    const modal = document.getElementById('segmentModal');
    const overlay = modal ? modal.querySelector('.modal-overlay') : null;
    const cancelBtn = document.getElementById('cancelSegment');
    const form = document.getElementById('segmentForm');
    const lockBtn = document.getElementById('lockRoundBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.openSegmentModal());
    if (overlay) overlay.addEventListener('click', () => this.closeSegmentModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSegmentModal());
    if (form) form.addEventListener('submit', (e) => this.handleSegmentSubmit(e));
    const tbody = document.getElementById('segmentsTbody');
    if (tbody) tbody.addEventListener('click', (e) => this.handleSegmentsTableClick(e));
    if (lockBtn) lockBtn.addEventListener('click', () => this.lockSelectedRound());

    const cModal = document.getElementById('criteriaModal');
    const cOverlay = cModal ? cModal.querySelector('.modal-overlay') : null;
    const cCancel = document.getElementById('cancelCriteria');
    const cForm = document.getElementById('criteriaForm');
    const addRow = document.getElementById('addCriteriaRow');
    if (cOverlay) cOverlay.addEventListener('click', () => this.closeCriteriaModal());
    if (cCancel) cCancel.addEventListener('click', () => this.closeCriteriaModal());
    if (addRow) addRow.addEventListener('click', () => this.addCriteriaRow());
    if (cForm) cForm.addEventListener('submit', (e) => this.handleCriteriaSubmit(e));
  },

  openSegmentModal() {
    const modal = document.getElementById('segmentModal');
    if (!modal) return;
    const title = document.getElementById('segmentModalTitle');
    if (title) title.textContent = 'Add Segment';
    const nameEl = document.getElementById('segmentName');
    const descEl = document.getElementById('segmentDescription');
    const methodSel = document.getElementById('scoringMethod');
    const percentEl = document.getElementById('segmentPercent');
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    if (methodSel) methodSel.value = 'Judge';
    if (percentEl) { percentEl.value = ''; this.setInvalid(percentEl, false); }
    this.state.editingSegmentId = null;
    const form = document.getElementById('segmentForm');
    if (form) form.setAttribute('data-mode','add');
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    if (nameEl) nameEl.focus();
  },

  closeSegmentModal() {
    const modal = document.getElementById('segmentModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const form = document.getElementById('segmentForm');
    if (form) form.reset();
  },

  handleSegmentSubmit(e) {
    e.preventDefault();
    const nameEl = document.getElementById('segmentName');
    const methodSel = document.getElementById('scoringMethod');
    const percentEl = document.getElementById('segmentPercent');
    if (!nameEl || !methodSel) return;
    const validName = !!nameEl.value.trim();
    this.setInvalid(nameEl, !validName);
    if (!validName) { nameEl.focus(); return; }
    if (!percentEl) return;
    const pVal = parseInt(percentEl.value, 10);
    const validPercent = !!percentEl.value && pVal >= 1 && pVal <= 100;
    this.setInvalid(percentEl, !validPercent);
    if (!validPercent) { percentEl.focus(); return; }
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const r = this.state.selectedRound;
    if (!r) return;
    if (r.active === false) {
      const status = document.getElementById('roundLockMessage');
      if (status) { status.textContent = 'This round is deactivated. Editing is disabled.'; status.style.display = ''; }
      return;
    }
    const list = this.loadSegments(evId, r.id);
    const mode = (document.getElementById('segmentForm')?.getAttribute('data-mode')) || 'add';
    const existingId = this.state.editingSegmentId;
    const id = mode === 'edit' && existingId ? existingId : ('segment_' + Date.now());
    const method = methodSel.value || 'Judge';
    const weights = method === 'Judge+Audience' ? { judge: 0.8, audience: 0.2 } : { judge: 1, audience: 0 };
    const obj = {
      id,
      round_id: r.id,
      name: nameEl.value.trim(),
      description: (document.getElementById('segmentDescription')?.value || '').trim(),
      scoring_method: method,
      weights,
      percent: pVal,
      active: (mode === 'edit' ? (list.find(s => s.id === id)?.active !== false) : true),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_id: evId
    };
    if (mode === 'edit') {
      const idx = list.findIndex(s => s.id === id);
      if (idx >= 0) {
        const original = list[idx];
        const sumExcluding = this.sumSegmentsPercent(list) - (typeof original.percent === 'number' ? original.percent : 0);
        if (sumExcluding + pVal > 100) {
          const status = document.getElementById('segmentsPercentStatus');
          if (status) { status.textContent = 'Total segment percentage cannot exceed 100%'; }
          return;
        }
        list[idx] = obj;
      }
    } else {
      const sumBefore = this.sumSegmentsPercent(list);
      if (sumBefore + pVal > 100) {
        const status = document.getElementById('segmentsPercentStatus');
        if (status) { status.textContent = 'Total segment percentage cannot exceed 100%'; }
        return;
      }
      list.push(obj);
    }
    this.saveSegments(evId, r.id, list);
    this.closeSegmentModal();
    this.renderSegmentsTable(list);
    this.updatePercentStatus(list);
  },

  setInvalid(el, invalid) {
    if (!el) return;
    el.classList.toggle('invalid', !!invalid);
  },

  renderSegmentsTable(list) {
    const tbody = document.getElementById('segmentsTbody');
    if (!tbody) return;
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="empty-state-text">No segments yet</div></td></tr>`;
      return;
    }
    const rows = list.map(s => {
      const isActive = s.active !== false;
      const statusClass = isActive ? 'approved' : 'rejected';
      const statusBadge = `<span class="status-badge ${statusClass}">${isActive ? 'Active' : 'Inactive'}</span>`;
      const toggleLabel = isActive ? 'Deactivate' : 'Activate';
      return `
        <tr data-id="${s.id}">
          <td>${s.name}</td>
          <td>${typeof s.percent === 'number' ? s.percent : '-'}</td>
          <td>${s.scoring_method}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="row-actions">
              <button class="table-action-btn view" data-action="edit">Edit</button>
              <button class="table-action-btn view" data-action="criteria">Define Criteria</button>
              <button class="table-action-btn view" data-action="toggle-active">${toggleLabel}</button>
            </div>
          </td>
        </tr>`;
    }).join('');
    tbody.innerHTML = rows;
  },

  handleSegmentsTableClick(e) {
    const btn = e.target.closest('button');
    const row = e.target.closest('tr');
    if (!btn || !row) return;
    const id = row.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'edit') {
      this.openSegmentEdit(id);
    } else if (action === 'criteria') {
      this.openCriteriaModal(id);
    } else if (action === 'toggle-active') {
      this.toggleSegmentActive(id);
    }
  }
  ,

  openSegmentEdit(id) {
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const r = this.state.selectedRound;
    if (!r) return;
    const list = this.loadSegments(evId, r.id);
    const s = list.find(x => x.id === id);
    if (!s) return;
    const modal = document.getElementById('segmentModal');
    if (!modal) return;
    const title = document.getElementById('segmentModalTitle');
    if (title) title.textContent = 'Edit Segment';
    const nameEl = document.getElementById('segmentName');
    const descEl = document.getElementById('segmentDescription');
    const methodSel = document.getElementById('scoringMethod');
    const percentEl = document.getElementById('segmentPercent');
    if (nameEl) nameEl.value = s.name || '';
    if (descEl) descEl.value = s.description || '';
    if (methodSel) methodSel.value = s.scoring_method || 'Judge';
    if (percentEl) percentEl.value = typeof s.percent === 'number' ? s.percent : '';
    const form = document.getElementById('segmentForm');
    if (form) form.setAttribute('data-mode','edit');
    this.state.editingSegmentId = id;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    if (nameEl) nameEl.focus();
  },

  sumSegmentsPercent(list) {
    return (list || []).reduce((acc, s) => acc + (typeof s.percent === 'number' ? s.percent : 0), 0);
  },

  updatePercentStatus(list) {
    const status = document.getElementById('segmentsPercentStatus');
    const lockBtn = document.getElementById('lockRoundBtn');
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const r = this.state.selectedRound;
    const sum = this.sumSegmentsPercent(list);
    let criteriaOk = true;
    if (r) {
      for (const s of list) {
        const crit = this.loadCriteria(evId, r.id, s.id);
        const total = crit.reduce((acc,c)=>acc + (parseInt(c.points,10)||0), 0);
        if (total !== 100) { criteriaOk = false; break; }
      }
    }
    const ready = sum === 100 && criteriaOk;
    if (status) {
      status.textContent = `Segments total: ${sum}%` + (criteriaOk ? ' • Criteria totals valid' : ' • Criteria totals invalid');
    }
    const isDraft = r && (r.status || 'Draft') === 'Draft';
    const isActive = r && r.active !== false;
    if (lockBtn) lockBtn.disabled = !(ready && isDraft && isActive);
  },

  lockSelectedRound() {
    const r = this.state.selectedRound;
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    if (!r) return;
    const key = this.getRoundsKey(evId);
    const raw = localStorage.getItem(key);
    let list = [];
    try { list = raw ? JSON.parse(raw) : []; } catch(e) { list = []; }
    const rr = list.find(x => x.id === r.id);
    if (!rr) return;
    rr.status = 'Locked';
    rr.updated_at = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(list));
    this.onRoundChange();
  },

  openCriteriaModal(segmentId) {
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const r = this.state.selectedRound;
    if (!r) return;
    const modal = document.getElementById('criteriaModal');
    const list = this.loadCriteria(evId, r.id, segmentId);
    const container = document.getElementById('criteriaList');
    if (container) {
      container.innerHTML = '';
      list.forEach(c => this.addCriteriaRow(c.name, c.points));
      const rows = Array.from(document.querySelectorAll('#criteriaList .criteria-row'));
      rows.forEach((row, idx) => {
        const input = row.querySelector('.criteria-desc');
        if (input) input.value = (list[idx] && list[idx].description) ? list[idx].description : '';
      });
    }
    modal.setAttribute('data-segment-id', segmentId);
    const totalEl = document.getElementById('criteriaTotal');
    if (totalEl) totalEl.textContent = '';
    this.updateCriteriaTotal();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  },

  closeCriteriaModal() {
    const modal = document.getElementById('criteriaModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const container = document.getElementById('criteriaList');
    if (container) container.innerHTML = '';
  },

  addCriteriaRow(name = '', points = '') {
    const container = document.getElementById('criteriaList');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'criteria-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1.2fr 160px 1.8fr auto';
    row.style.columnGap = '0.5rem';
    row.style.alignItems = 'center';
    row.innerHTML = `
      <div class="form-group" style="margin:0">
        <div class="input-wrapper">
          <input type="text" class="form-input criteria-name" placeholder="Criterion name" value="${name}">
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <div class="input-wrapper">
          <input type="number" class="form-input criteria-points" min="1" max="100" step="1" placeholder="Points" value="${points}">
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <div class="input-wrapper">
          <input type="text" class="form-input criteria-desc" placeholder="Description (optional)">
        </div>
      </div>
      <button type="button" class="submit-button secondary-button remove-criterion">Remove</button>
    `;
    container.appendChild(row);
    // ensure full width and avoid wrapping that shrinks inputs
    row.style.width = '100%';
    const removeBtn = row.querySelector('.remove-criterion');
    if (removeBtn) removeBtn.addEventListener('click', () => {
      row.remove();
      this.updateCriteriaTotal();
    });
    const pts = row.querySelector('.criteria-points');
    const nm = row.querySelector('.criteria-name');
    const ds = row.querySelector('.criteria-desc');
    if (pts) pts.addEventListener('input', () => this.updateCriteriaTotal());
    if (nm) nm.addEventListener('input', () => this.updateCriteriaTotal());
    if (ds) ds.addEventListener('input', () => this.updateCriteriaTotal());
    this.updateCriteriaTotal();
  },

  updateCriteriaTotal() {
    const totalEl = document.getElementById('criteriaTotal');
    const err = document.getElementById('criteriaError');
    const form = document.getElementById('criteriaForm');
    const saveBtn = form ? form.querySelector('button[type="submit"]') : null;
    const rows = Array.from(document.querySelectorAll('#criteriaList .criteria-row'));
    const total = rows.reduce((acc, row) => {
      const v = parseInt(row.querySelector('.criteria-points')?.value || '0', 10);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    if (totalEl) totalEl.textContent = 'Total points: ' + total;
    if (err) {
      if (total === 100) {
        err.style.display = 'none';
        err.textContent = '';
      } else {
        err.textContent = total > 100 ? 'Exceeded the total points of 100' : 'Need total points of 100';
        err.style.display = 'block';
      }
    }
    if (saveBtn) saveBtn.disabled = (total !== 100);
  },

  handleCriteriaSubmit(e) {
    e.preventDefault();
    const modal = document.getElementById('criteriaModal');
    if (!modal) return;
    const segId = modal.getAttribute('data-segment-id');
    const rows = Array.from(document.querySelectorAll('#criteriaList .criteria-row'));
    const data = rows.map(row => {
      const name = (row.querySelector('.criteria-name')?.value || '').trim();
      const pts = parseInt(row.querySelector('.criteria-points')?.value || '0', 10);
      const desc = (row.querySelector('.criteria-desc')?.value || '').trim();
      return { name, points: pts, description: desc };
    }).filter(c => c.name && c.points > 0);
    const total = data.reduce((acc,c)=>acc + (parseInt(c.points,10)||0), 0);
    const err = document.getElementById('criteriaError');
    if (total !== 100) {
      if (err) { err.textContent = total > 100 ? 'Exceeded the total points of 100' : 'Need total points of 100'; err.style.display = 'block'; }
      return;
    }
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const r = this.state.selectedRound;
    if (!r || !segId) return;
    this.saveCriteria(evId, r.id, segId, data);
    this.closeCriteriaModal();
    const list = this.loadSegments(evId, r.id);
    this.updatePercentStatus(list);
  },

  toggleSegmentActive(id) {
    const evId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const r = this.state.selectedRound;
    if (!r) return;
    const list = this.loadSegments(evId, r.id);
    const s = list.find(x => x.id === id);
    if (!s) return;
    s.active = s.active === false ? true : false;
    s.updated_at = new Date().toISOString();
    this.saveSegments(evId, r.id, list);
    this.renderSegmentsTable(list);
    this.updatePercentStatus(list);
  }
};
