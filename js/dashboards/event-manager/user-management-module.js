window.UserManagementModule = {
  state: { activeEvent: null },

  initJudgeView(activeEvent) {
    this.state.activeEvent = activeEvent || null;
    this.attachJudgeHandlers();
    this.loadAndRenderJudges();
  },

  getJudgesKey(eventId) { return 'bpms_judges_' + eventId; },

  loadJudges(eventId) {
    const raw = localStorage.getItem(this.getJudgesKey(eventId));
    try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
  },

  saveJudges(eventId, list) {
    localStorage.setItem(this.getJudgesKey(eventId), JSON.stringify(list || []));
  },

  attachJudgeHandlers() {
    const addBtn = document.getElementById('addJudgeBtn');
    const modal = document.getElementById('judgeModal');
    const overlay = modal ? modal.querySelector('.modal-overlay') : null;
    const cancelBtn = document.getElementById('cancelJudge');
    const form = document.getElementById('judgeForm');
    const search = document.getElementById('judgeSearch');
    const fStatus = document.getElementById('filterJudgeStatus');
    const tbody = document.getElementById('judgesTbody');
    if (addBtn) addBtn.addEventListener('click', () => this.openJudgeModal());
    if (overlay) overlay.addEventListener('click', () => this.closeJudgeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeJudgeModal());
    if (form) form.addEventListener('submit', (e) => this.handleJudgeSubmit(e));
    if (search) search.addEventListener('input', () => this.loadAndRenderJudges());
    if (fStatus) fStatus.addEventListener('change', () => this.loadAndRenderJudges());
    if (tbody) tbody.addEventListener('click', (e) => this.handleJudgesTableClick(e));
  },

  openJudgeModal(judge) {
    const modal = document.getElementById('judgeModal');
    if (!modal) return;
    const title = document.getElementById('judgeModalTitle');
    if (title) title.textContent = judge ? 'Edit Judge' : 'Add Judge';
    const nameEl = document.getElementById('judgeFullName');
    const emailEl = document.getElementById('judgeEmail');
    const passEl = document.getElementById('judgeTempPassword');
    if (nameEl) nameEl.value = judge ? (judge.name||'') : '';
    if (emailEl) emailEl.value = judge ? (judge.email||'') : '';
    if (passEl) passEl.value = '';
    const form = document.getElementById('judgeForm');
    if (form) { form.setAttribute('data-mode', judge ? 'edit' : 'add'); form.setAttribute('data-id', judge ? judge.id : ''); }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    if (nameEl) nameEl.focus();
  },

  closeJudgeModal() {
    const modal = document.getElementById('judgeModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    const form = document.getElementById('judgeForm');
    if (form) form.reset();
    const err = document.getElementById('judgeError');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
  },

  handleJudgeSubmit(e) {
    e.preventDefault();
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const nameEl = document.getElementById('judgeFullName');
    const emailEl = document.getElementById('judgeEmail');
    const passEl = document.getElementById('judgeTempPassword');
    const err = document.getElementById('judgeError');
    if (!nameEl || !emailEl || !passEl) return;
    const nameValid = !!nameEl.value.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
    const passValid = (passEl.value||'').length >= 8;
    const form = document.getElementById('judgeForm');
    const mode = form ? form.getAttribute('data-mode') : 'add';
    const id = mode === 'edit' && form ? form.getAttribute('data-id') : ('judge_' + Date.now());
    if (!nameValid || !emailValid || !passValid) {
      if (err) { err.textContent = 'Provide full name, valid email, and 8+ char password.'; err.style.display = ''; }
      return;
    }
    const list = this.loadJudges(eventId);
    const base = {
      id,
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      temp_password: passEl.value,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
      event_id: eventId
    };
    if (mode === 'edit') {
      const idx = list.findIndex(j => j.id === id);
      if (idx >= 0) list[idx] = base;
    } else {
      list.push(base);
    }
    this.saveJudges(eventId, list);
    this.closeJudgeModal();
    this.loadAndRenderJudges();
  },

  loadAndRenderJudges() {
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadJudges(eventId);
    const filtered = this.applyJudgeFilters(list);
    this.renderJudgesTable(filtered);
  },

  applyJudgeFilters(list) {
    const s = (document.getElementById('judgeSearch')?.value||'').toLowerCase();
    const st = document.getElementById('filterJudgeStatus')?.value||'';
    let res = (list||[]).slice();
    if (s) res = res.filter(j => ((j.name||'').toLowerCase().includes(s)) || ((j.email||'').toLowerCase().includes(s)));
    if (st) res = res.filter(j => (j.status||'') === st);
    return res;
  },

  renderJudgesTable(list) {
    const tbody = document.getElementById('judgesTbody');
    if (!tbody) return;
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="empty-state-text">No judges yet</div></td></tr>`;
      return;
    }
    const rows = list.map(j => {
      const initials = (j.name||'').split(' ').map(n=>n[0]).join('').toUpperCase();
      const statusBadge = `<span class="status-badge ${j.status==='active'?'approved':(j.status==='inactive'?'rejected':'pending')}">${j.status||'active'}</span>`;
      return `
        <tr data-id="${j.id}">
          <td><div class="judge-avatar">${initials||'J'}</div></td>
          <td>${j.name||'-'}<div class="table-subtext">${j.email||''}</div></td>
          <td>${statusBadge}</td>
          <td>${j.created_at ? new Date(j.created_at).toLocaleDateString() : '-'}</td>
          <td>${j.last_login ? new Date(j.last_login).toLocaleString() : '-'}</td>
          <td>
            <div class="row-actions">
              <button class="table-action-btn view" data-action="edit">Edit</button>
              <button class="table-action-btn view" data-action="toggle">${j.status==='active'?'Deactivate':'Activate'}</button>
            </div>
          </td>
        </tr>`;
    }).join('');
    tbody.innerHTML = rows;
  },

  handleJudgesTableClick(e) {
    const btn = e.target.closest('button');
    const row = e.target.closest('tr');
    if (!btn || !row) return;
    const id = row.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    const eventId = (this.state.activeEvent && this.state.activeEvent.id) ? this.state.activeEvent.id : 'default';
    const list = this.loadJudges(eventId);
    const j = list.find(x => x.id === id);
    if (!j) return;
    if (action === 'edit') this.openJudgeModal(j);
    else if (action === 'toggle') { j.status = j.status==='active'?'inactive':'active'; j.updated_at = new Date().toISOString(); this.saveJudges(eventId, list); this.loadAndRenderJudges(); }
    
  }
};
