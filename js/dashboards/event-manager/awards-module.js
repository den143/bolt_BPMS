window.AwardsModule = {
  state: { activeEvent: null },

  initAwardsView(activeEvent) {
    this.state.activeEvent = activeEvent || null;
    this.attachHandlers();
    this.loadAndRenderAwards();
    this.populateScopeSelectors();
  },

  getAwardsKey(eventId) { return 'bpms_awards_' + eventId; },
  getAwardResultsKey(eventId) { return 'bpms_award_results_' + eventId; },

  loadAwards(eventId) {
    const raw = localStorage.getItem(this.getAwardsKey(eventId));
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },
  saveAwards(eventId, list) {
    localStorage.setItem(this.getAwardsKey(eventId), JSON.stringify(list || []));
  },

  loadAwardResults(eventId) {
    const raw = localStorage.getItem(this.getAwardResultsKey(eventId));
    try { return raw ? JSON.parse(raw) : {}; } catch(e) { return {}; }
  },
  saveAwardResults(eventId, map) {
    localStorage.setItem(this.getAwardResultsKey(eventId), JSON.stringify(map || {}));
  },

  attachHandlers() {
    const addBtn = document.getElementById('addAwardBtn');
    const modal = document.getElementById('awardModal');
    const overlay = modal ? modal.querySelector('.modal-overlay') : null;
    const cancelBtn = document.getElementById('cancelAward');
    const form = document.getElementById('awardForm');
    const typeSel = document.getElementById('awardType');
    const scopeSel = document.getElementById('awardScope');
    const nameEl = document.getElementById('awardName');
    const winnersClose = document.getElementById('closeWinners');
    if (addBtn) addBtn.addEventListener('click', () => this.openAwardModal('add'));
    if (overlay) overlay.addEventListener('click', () => this.closeAwardModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeAwardModal());
    if (form) form.addEventListener('submit', (e) => this.handleAwardSubmit(e));
    if (typeSel) typeSel.addEventListener('change', () => this.updateTypeSections());
    if (scopeSel) scopeSel.addEventListener('change', () => { this.updateScopeSelectors(); this.validateAwardForm(); });
    if (nameEl) nameEl.addEventListener('input', () => this.validateAwardForm());
    if (winnersClose) winnersClose.addEventListener('click', () => this.closeWinners());
    const tbody = document.getElementById('awardsTbody');
    if (tbody) tbody.addEventListener('click', (e) => this.handleAwardsTableClick(e));
    const search = document.getElementById('awardSearch');
    const fType = document.getElementById('filterAwardType');
    const fScope = document.getElementById('filterAwardScope');
    const fStatus = document.getElementById('filterAwardStatus');
    [search,fType,fScope,fStatus].forEach(el => { if (el) el.addEventListener('input', () => this.loadAndRenderAwards()); if (el) el.addEventListener('change', () => this.loadAndRenderAwards()); });
  },

  openAwardModal(mode, award) {
    const modal = document.getElementById('awardModal');
    const title = document.getElementById('awardModalTitle');
    const form = document.getElementById('awardForm');
    if (!modal || !form) return;
    if (title) title.textContent = mode === 'edit' ? 'Edit Award' : 'Add Award';
    form.setAttribute('data-mode', mode);
    form.setAttribute('data-id', award ? award.id : '');
    const nameEl = document.getElementById('awardName');
    const descEl = document.getElementById('awardDescription');
    const typeSel = document.getElementById('awardType');
    const scopeSel = document.getElementById('awardScope');
    const roundSel = document.getElementById('awardRound');
    const segSel = document.getElementById('awardSegment');
    const autoMulti = document.getElementById('autoAllowMultiple');
    const audMulti = document.getElementById('audAllowMultiple');
    const manualWinners = document.getElementById('manualWinners');
    const manualJust = document.getElementById('manualJustification');
    if (nameEl) nameEl.value = award ? (award.name||'') : '';
    if (descEl) descEl.value = award ? (award.description||'') : '';
    if (typeSel) typeSel.value = award ? (award.type||'') : '';
    if (scopeSel) scopeSel.value = award ? (award.scope?.level||'') : '';
    if (roundSel) roundSel.value = award && award.scope?.round_id ? award.scope.round_id : '';
    if (segSel) segSel.value = award && award.scope?.segment_id ? award.scope.segment_id : '';
    if (autoMulti) autoMulti.checked = !!(award && award.rules && award.rules.tie_allow_multiple);
    if (audMulti) audMulti.checked = !!(award && award.rules && award.rules.tie_allow_multiple);
    if (manualWinners) manualWinners.value = '';
    if (manualJust) manualJust.value = award ? (award.rules?.justification||'') : '';
    this.updateTypeSections();
    this.updateScopeSelectors();
    this.validateAwardForm();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    if (nameEl) nameEl.focus();
  },

  closeAwardModal() {
    const modal = document.getElementById('awardModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const form = document.getElementById('awardForm');
    if (form) form.reset();
    const err = document.getElementById('awardError');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
  },

  updateTypeSections() {
    const typeSel = document.getElementById('awardType');
    const scopeSel = document.getElementById('awardScope');
    const auto = document.getElementById('automaticSettings');
    const aud = document.getElementById('audienceSettings');
    const man = document.getElementById('manualSettings');
    const v = typeSel ? typeSel.value : '';
    if (auto) auto.style.display = v === 'Automatic' ? '' : 'none';
    if (aud) aud.style.display = v === 'Audience' ? '' : 'none';
    if (man) man.style.display = v === 'Manual' ? '' : 'none';
    if (v === 'Automatic' && scopeSel && scopeSel.value !== 'Segment') {
      scopeSel.value = 'Segment';
      this.updateScopeSelectors();
    }
    this.validateAwardForm();
  },

  updateScopeSelectors() {
    const scopeSel = document.getElementById('awardScope');
    const wr = document.getElementById('roundSelectorWrapper');
    const ws = document.getElementById('segmentSelectorWrapper');
    const container = document.getElementById('scopeSelectors');
    const v = scopeSel ? scopeSel.value : '';
    if (container) container.style.display = v && v !== 'Event' ? '' : 'none';
    if (wr) wr.style.display = v === 'Round' || v === 'Segment' ? '' : 'none';
    if (ws) ws.style.display = v === 'Segment' ? '' : 'none';
    this.populateScopeSelectors();
    this.updateAudienceVotingNote();
  },

  populateScopeSelectors() {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const roundsRaw = localStorage.getItem('bpms_rounds_' + eventId);
    let rounds = [];
    try { rounds = roundsRaw ? JSON.parse(roundsRaw) : []; } catch(e) { rounds = []; }
    const roundSel = document.getElementById('awardRound');
    if (roundSel) {
      roundSel.innerHTML = ['<option value="">Select round</option>'].concat(rounds.sort((a,b)=>a.order-b.order).map(r => `<option value="${r.id}">${r.name} (Order ${r.order})</option>`)).join('');
    }
    const segSel = document.getElementById('awardSegment');
    if (segSel) {
      const rid = roundSel ? roundSel.value : '';
      if (!rid) { segSel.innerHTML = '<option value="">Select segment</option>'; return; }
      const segRaw = localStorage.getItem('bpms_segments_' + eventId + '_' + rid);
      let segs = [];
      try { segs = segRaw ? JSON.parse(segRaw) : []; } catch(e) { segs = []; }
      segSel.innerHTML = ['<option value="">Select segment</option>'].concat(segs.map(s => `<option value="${s.id}">${s.name}</option>`)).join('');
    }
    const roundSelWrap = document.getElementById('roundSelectorWrapper');
    if (roundSel && roundSelWrap) roundSel.addEventListener('change', () => { this.populateScopeSelectors(); this.validateAwardForm(); this.updateAudienceVotingNote(); });
    if (segSel) segSel.addEventListener('change', () => this.validateAwardForm());
    const contestantsSel = document.getElementById('manualWinners');
    if (contestantsSel) {
      const raw = localStorage.getItem('bpms_contestants_' + eventId);
      let list = [];
      try { list = raw ? JSON.parse(raw) : []; } catch(e) { list = []; }
      contestantsSel.innerHTML = list.map(c => `<option value="${c.id}">${c.name||c.full_name||('Contestant '+c.id)}</option>`).join('');
    }
  },

  loadAndRenderAwards() {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadAwards(eventId);
    const filtered = this.applyAwardFilters(list);
    this.renderAwardsTable(filtered);
  },

  applyAwardFilters(list) {
    const s = (document.getElementById('awardSearch')?.value||'').toLowerCase();
    const t = document.getElementById('filterAwardType')?.value||'';
    const sc = document.getElementById('filterAwardScope')?.value||'';
    const st = document.getElementById('filterAwardStatus')?.value||'';
    let res = (list||[]).slice();
    if (s) res = res.filter(a => (a.name||'').toLowerCase().includes(s));
    if (t) res = res.filter(a => a.type === t);
    if (sc) res = res.filter(a => (a.scope && a.scope.level) === sc);
    if (st) res = res.filter(a => (a.active === false ? 'Deactivated' : (a.status||'Draft')) === st);
    return res;
  },

  renderAwardsTable(list) {
    const tbody = document.getElementById('awardsTbody');
    if (!tbody) return;
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="empty-state-text">No awards yet</div></td></tr>`;
      return;
    }
    const rows = list.map(a => {
      const scopeText = a.scope?.level === 'Event' ? 'Event' : (a.scope?.level === 'Round' ? 'Round' : (a.scope?.level === 'Segment' ? 'Segment' : '-'));
      const rule = a.type === 'Automatic' ? 'Judge scores • Highest total' : (a.type === 'Audience' ? 'Audience votes • Highest count' : 'Manual selection');
      const isActive = a.active !== false;
      const badgeClass = isActive ? (a.status === 'Awarded' ? 'approved' : (a.status === 'Ready' ? 'approved' : 'pending')) : 'rejected';
      const badgeText = isActive ? (a.status || 'Draft') : 'Deactivated';
      const toggleLabel = isActive ? 'Deactivate' : 'Activate';
      const readyLabel = a.status === 'Ready' ? 'Unready' : 'Ready';
      const computeLabel = a.type === 'Manual' ? 'Assign Winner' : 'Compute Winner';
      const editDisabled = a.status === 'Awarded';
      return `
        <tr data-id="${a.id}">
          <td>${a.name||'-'}</td>
          <td>${a.type}</td>
          <td>${scopeText}</td>
          <td>${rule}</td>
          <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
          <td>
            <div class="row-actions">
              <button class="table-action-btn view" data-action="edit" ${editDisabled ? 'disabled' : ''}>Edit</button>
              <button class="table-action-btn view" data-action="toggle-ready" ${a.status === 'Awarded' ? 'disabled' : ''}>${readyLabel}</button>
              <button class="table-action-btn view" data-action="toggle-active">${toggleLabel}</button>
              <button class="table-action-btn view" data-action="compute" ${a.status !== 'Ready' ? 'disabled' : ''}>${computeLabel}</button>
              <button class="table-action-btn view" data-action="winners" ${a.status !== 'Awarded' ? 'disabled' : ''}>View Winners</button>
            </div>
          </td>
        </tr>`;
    }).join('');
    tbody.innerHTML = rows;
  },

  handleAwardsTableClick(e) {
    const btn = e.target.closest('button');
    const row = e.target.closest('tr');
    if (!btn || !row) return;
    const id = row.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'edit') this.openEditAward(id);
    else if (action === 'toggle-ready') this.toggleAwardReady(id);
    else if (action === 'toggle-active') this.toggleAwardActive(id);
    else if (action === 'compute') this.computeAward(id);
    else if (action === 'winners') this.openWinners(id);
  },

  openEditAward(id) {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadAwards(eventId);
    const a = list.find(x => x.id === id);
    if (!a) return;
    this.openAwardModal('edit', a);
  },

  handleAwardSubmit(e) {
    e.preventDefault();
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const nameEl = document.getElementById('awardName');
    const typeSel = document.getElementById('awardType');
    const scopeSel = document.getElementById('awardScope');
    const roundSel = document.getElementById('awardRound');
    const segSel = document.getElementById('awardSegment');
    const err = document.getElementById('awardError');
    if (!nameEl || !typeSel || !scopeSel) return;
    const vType = typeSel ? typeSel.value : '';
    const vScope = scopeSel ? scopeSel.value : '';
    const fields = [
      { el: nameEl, valid: !!nameEl.value.trim() },
      { el: typeSel, valid: !!typeSel.value },
      { el: scopeSel, valid: !!scopeSel.value }
    ];
    let firstInvalid = null;
    fields.forEach(f => { if (!f.el) return; const invalid = !f.valid; this.setInvalid(f.el, invalid); if (invalid && !firstInvalid) firstInvalid = f.el; });
    if (firstInvalid) { if (err) { err.textContent = 'Please complete required fields.'; err.style.display = ''; } firstInvalid.focus(); return; }
    const errText = this.validateAwardForm();
    if (errText) { if (err) { err.textContent = errText; err.style.display = ''; } return; }
    const form = document.getElementById('awardForm');
    const mode = form ? form.getAttribute('data-mode') : 'add';
    const id = mode === 'edit' && form ? form.getAttribute('data-id') : ('award_' + Date.now());
    const list = this.loadAwards(eventId);
    const base = {
      id,
      name: nameEl.value.trim(),
      description: (document.getElementById('awardDescription')?.value || '').trim(),
      type: vType,
      scope: { level: vScope, round_id: vScope !== 'Event' ? (roundSel ? roundSel.value : '') : '', segment_id: vScope === 'Segment' ? (segSel ? segSel.value : '') : '' },
      rules: {},
      status: 'Draft',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_id: eventId
    };
    if (vType === 'Automatic') base.rules = { source: 'judge', tie_allow_multiple: !!document.getElementById('autoAllowMultiple')?.checked };
    else if (vType === 'Audience') base.rules = { requires_audience_enabled: true, tie_allow_multiple: !!document.getElementById('audAllowMultiple')?.checked };
    else if (vType === 'Manual') base.rules = { winners: Array.from(document.getElementById('manualWinners')?.selectedOptions||[]).map(o=>o.value), justification: (document.getElementById('manualJustification')?.value||'') };
    if (mode === 'edit') {
      const idx = list.findIndex(x => x.id === id);
      if (idx >= 0) list[idx] = base;
    } else {
      list.push(base);
    }
    this.saveAwards(eventId, list);
    this.closeAwardModal();
    this.loadAndRenderAwards();
  },

  setInvalid(el, invalid) { if (!el) return; el.classList.toggle('invalid', !!invalid); },

  validateAwardForm() {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const nameEl = document.getElementById('awardName');
    const typeSel = document.getElementById('awardType');
    const scopeSel = document.getElementById('awardScope');
    const roundSel = document.getElementById('awardRound');
    const segSel = document.getElementById('awardSegment');
    const err = document.getElementById('awardError');
    const form = document.getElementById('awardForm');
    const saveBtn = form ? form.querySelector('button[type="submit"]') : null;
    const vType = typeSel ? typeSel.value : '';
    const vScope = scopeSel ? scopeSel.value : '';
    let errors = [];
    let warnings = [];
    if (!nameEl || !typeSel || !scopeSel || !nameEl.value.trim() || !vType || !vScope) {
      errors.push('Please complete required fields.');
    }
    if (!errors.length) {
      if (vScope === 'Round') {
        if (!roundSel || !roundSel.value) errors.push('Select a round.');
      }
      if (vScope === 'Segment') {
        if (!roundSel || !roundSel.value) errors.push('Select a round.');
        if (!segSel || !segSel.value) warnings.push('No segment selected yet. You can still save as Draft.');
      }
      if (vType === 'Audience') {
        const rid = roundSel ? roundSel.value : '';
        const roundsRaw = localStorage.getItem('bpms_rounds_' + eventId);
        let rounds = []; try { rounds = roundsRaw ? JSON.parse(roundsRaw) : []; } catch(e) { rounds = []; }
        const r = rounds.find(x => x.id === rid);
        const enabled = !!(r && r.audience_voting);
        if (!enabled && vScope !== 'Event') warnings.push('Audience voting not enabled for selected round.');
      }
      if (vType === 'Automatic' && vScope !== 'Segment') warnings.push('Automatic awards work best when scoped to a specific segment.');
    }
    const errText = errors.join(' ');
    if (err) {
      if (errText) { err.textContent = errText; err.style.display = ''; }
      else if (warnings.length) { err.textContent = warnings.join(' '); err.style.display = ''; }
      else { err.style.display = 'none'; err.textContent = ''; }
    }
    if (saveBtn) saveBtn.disabled = !!errText;
    return errText;
  },

  toggleAwardReady(id) {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadAwards(eventId);
    const a = list.find(x => x.id === id);
    if (!a || a.status === 'Awarded') return;
    a.status = a.status === 'Ready' ? 'Draft' : 'Ready';
    a.updated_at = new Date().toISOString();
    this.saveAwards(eventId, list);
    this.loadAndRenderAwards();
  },

  toggleAwardActive(id) {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadAwards(eventId);
    const a = list.find(x => x.id === id);
    if (!a) return;
    a.active = a.active === false ? true : false;
    a.updated_at = new Date().toISOString();
    this.saveAwards(eventId, list);
    this.loadAndRenderAwards();
  },

  getScoresKey(eventId, roundId, segmentId) {
    return 'bpms_scores_' + eventId + '_' + roundId + '_' + segmentId;
  },
  loadScores(eventId, roundId, segmentId) {
    const raw = localStorage.getItem(this.getScoresKey(eventId, roundId, segmentId));
    try { return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
  },
  aggregateJudgeTotals(data) {
    const totals = {};
    if (!data) return totals;
    if (Array.isArray(data)) {
      data.forEach(entry => {
        const cid = entry && (entry.contestant_id || entry.contestantId || entry.cid);
        if (!cid) return;
        let t = 0;
        if (typeof entry.total === 'number') t = entry.total;
        else if (Array.isArray(entry.criteria_scores)) t = entry.criteria_scores.reduce((s,v)=>s+(typeof v==='number'?v:0),0);
        else if (Array.isArray(entry.criteriaScores)) t = entry.criteriaScores.reduce((s,v)=>s+(typeof v==='number'?v:0),0);
        else if (entry.criteria_scores && typeof entry.criteria_scores === 'object') t = Object.values(entry.criteria_scores).reduce((s,v)=>s+(typeof v==='number'?v:0),0);
        totals[cid] = (totals[cid]||0) + t;
      });
    } else if (typeof data === 'object') {
      Object.keys(data).forEach(cid => {
        const val = data[cid];
        if (typeof val === 'number') totals[cid] = (totals[cid]||0) + val;
      });
    }
    return totals;
  },

  getVotesKey(eventId, roundId, segmentId) {
    return segmentId ? ('bpms_votes_' + eventId + '_' + roundId + '_' + segmentId) : ('bpms_votes_' + eventId + '_' + roundId);
  },
  loadVotes(eventId, roundId, segmentId) {
    const primary = localStorage.getItem(this.getVotesKey(eventId, roundId, segmentId));
    const fallback = !segmentId ? null : localStorage.getItem(this.getVotesKey(eventId, roundId, null));
    let data = null;
    try { data = primary ? JSON.parse(primary) : null; } catch(e) { data = null; }
    if (!data && fallback) { try { data = JSON.parse(fallback); } catch(e) { data = null; } }
    return data;
  },
  aggregateVoteCounts(data) {
    const counts = {};
    if (!data) return counts;
    if (Array.isArray(data)) {
      data.forEach(entry => {
        const cid = entry && (entry.contestant_id || entry.contestantId || entry.cid);
        if (!cid) return;
        const c = typeof entry.count === 'number' ? entry.count : 1;
        counts[cid] = (counts[cid]||0) + c;
      });
    } else if (typeof data === 'object') {
      Object.keys(data).forEach(cid => {
        const val = data[cid];
        if (typeof val === 'number') counts[cid] = (counts[cid]||0) + val;
      });
    }
    return counts;
  },

  selectWinnersFromMap(map, allowMultiple, basis) {
    const entries = Object.entries(map).map(([cid,val]) => ({ cid, val }));
    if (!entries.length) return [];
    entries.sort((a,b)=>b.val - a.val);
    const topVal = entries[0].val;
    const top = allowMultiple ? entries.filter(e => e.val === topVal) : [entries[0]];
    return top.map(e => ({ contestant_id: e.cid, value: e.val, basis }));
  },

  loadContestantsMap(eventId) {
    const raw = localStorage.getItem('bpms_contestants_' + eventId);
    let list = [];
    try { list = raw ? JSON.parse(raw) : []; } catch(e) { list = []; }
    const map = {};
    list.forEach(c => { map[c.id] = c.name || c.full_name || ('Contestant ' + c.id); });
    return map;
  },

  updateAudienceVotingNote() {
    const note = document.getElementById('audienceVotingNote');
    const scopeSel = document.getElementById('awardScope');
    const roundSel = document.getElementById('awardRound');
    const vScope = scopeSel ? scopeSel.value : '';
    if (!note) return;
    if (vScope !== 'Round' && vScope !== 'Segment') { note.textContent = ''; return; }
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const roundsRaw = localStorage.getItem('bpms_rounds_' + eventId);
    let rounds = []; try { rounds = roundsRaw ? JSON.parse(roundsRaw) : []; } catch(e) { rounds = []; }
    const rid = roundSel ? roundSel.value : '';
    const r = rounds.find(x => x.id === rid);
    const enabled = !!(r && r.audience_voting);
    note.textContent = enabled ? 'Audience voting is enabled for this round.' : 'Audience voting is not enabled for this round.';
  },

  computeAward(id) {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadAwards(eventId);
    const a = list.find(x => x.id === id);
    if (!a || a.status !== 'Ready') return;
    const errText = this.validateComputePreconditions(a, eventId);
    if (errText) { alert(errText); return; }
    let winners = [];
    if (a.type === 'Manual') {
      const w = a.rules?.winners || [];
      winners = w.map(cid => ({ contestant_id: cid, value: null, basis: 'manual' }));
    } else if (a.type === 'Automatic') {
      const rid = a.scope.round_id;
      const sid = a.scope.segment_id;
      const data = this.loadScores(eventId, rid, sid);
      if (!data) { alert('No judge scores found for selected segment.'); return; }
      const totals = this.aggregateJudgeTotals(data);
      winners = this.selectWinnersFromMap(totals, !!(a.rules && a.rules.tie_allow_multiple), 'judge');
      if (!winners.length) { alert('No judge scores found for selected segment.'); return; }
    } else if (a.type === 'Audience') {
      const rid = a.scope.round_id;
      const sid = a.scope.segment_id;
      const data = this.loadVotes(eventId, rid, sid);
      if (!data) { alert('No audience votes found for selected scope.'); return; }
      const counts = this.aggregateVoteCounts(data);
      winners = this.selectWinnersFromMap(counts, !!(a.rules && a.rules.tie_allow_multiple), 'audience');
      if (!winners.length) { alert('No audience votes found for selected scope.'); return; }
    }
    const results = this.loadAwardResults(eventId);
    results[id] = { award_id: id, winners, computed_at: new Date().toISOString(), source: a.type };
    this.saveAwardResults(eventId, results);
    a.status = 'Awarded';
    a.updated_at = new Date().toISOString();
    this.saveAwards(eventId, list);
    this.loadAndRenderAwards();
  },

  validateComputePreconditions(a, eventId) {
    if (a.type === 'Automatic') {
      if (!(a.scope && a.scope.level === 'Segment' && a.scope.segment_id)) return 'Automatic awards must be linked to a segment.';
    }
    if (a.type === 'Audience') {
      if (!(a.scope && a.scope.level && a.scope.level !== 'Event')) return 'Audience awards must be linked to a round or segment.';
      const rid = a.scope.round_id;
      const roundsRaw = localStorage.getItem('bpms_rounds_' + eventId);
      let rounds = []; try { rounds = roundsRaw ? JSON.parse(roundsRaw) : [];} catch(e) { rounds = []; }
      const r = rounds.find(x => x.id === rid);
      const enabled = !!(r && r.audience_voting);
      if (!enabled) return 'Audience voting is not enabled for selected scope.';
    }
    return '';
  },

  openWinners(id) {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const results = this.loadAwardResults(eventId);
    const r = results[id];
    const modal = document.getElementById('awardWinnersModal');
    const body = document.getElementById('awardWinnersBody');
    if (!modal || !body) return;
    if (!r || !(r.winners||[]).length) { body.innerHTML = '<div class="empty-state"><div class="empty-state-text">No winners recorded</div></div>'; }
    else {
      const cmap = this.loadContestantsMap(eventId);
      const rows = r.winners.map(w => {
        const name = cmap[w.contestant_id] || ('Contestant ' + w.contestant_id);
        const val = w.value!==null ? (' ' + w.value) : '';
        return `<div class="form-group"><div class="input-wrapper"><input class="form-input" disabled value="${name} • ${w.basis}${val}"></div></div>`;
      }).join('');
      body.innerHTML = rows;
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  },

  closeWinners() {
    const modal = document.getElementById('awardWinnersModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const body = document.getElementById('awardWinnersBody');
    if (body) body.innerHTML = '';
  }
};
