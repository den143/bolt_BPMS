window.ContestantModule = {
    init(view) {
        this.cacheElements(view);
        this.attachEventListeners();
        this.renderContestantsTable();
    },

    cacheElements(view) {
        this.view = view;
        this.addContestantBtn = this.view.querySelector('#addContestantBtn');
        this.contestantModal = this.view.querySelector('#contestantModal');
        this.cancelContestantBtn = this.view.querySelector('#cancelContestant');
        this.contestantForm = this.view.querySelector('#contestantForm');
        this.photoInput = this.view.querySelector('#photo');
        this.imagePreview = this.view.querySelector('#imagePreview');
        this.contestantsTbody = this.view.querySelector('#contestantsTbody');
    },

    attachEventListeners() {
        if (this.addContestantBtn) {
            this.addContestantBtn.addEventListener('click', () => this.openModal());
        }

        if (this.cancelContestantBtn) {
            this.cancelContestantBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.contestantModal) {
            this.contestantModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeModal();
                }
            });
        }

        if (this.photoInput) {
            this.photoInput.addEventListener('change', () => this.handleImagePreview());
        }

        if (this.contestantForm) {
            this.contestantForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (this.contestantsTbody) {
            this.contestantsTbody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.edit-contestant');
                const toggleBtn = e.target.closest('.toggle-contestant-status');
                if (editBtn) {
                    const id = editBtn.getAttribute('data-id');
                    const list = this.loadContestants();
                    const obj = list.find(c => c.id === id);
                    if (obj) this.openModal(obj);
                    return;
                }
                if (toggleBtn) {
                    const id = toggleBtn.getAttribute('data-id');
                    const list = this.loadContestants();
                    const idx = list.findIndex(c => c.id === id);
                    if (idx >= 0) {
                        list[idx].status = list[idx].status === 'inactive' ? 'active' : 'inactive';
                        list[idx].updated_at = new Date().toISOString();
                        this.saveContestants(list);
                        this.renderContestantsTable();
                    }
                    return;
                }
            });
        }
    },

    openModal(contestant) {
        if (!this.contestantModal) return;
        const title = this.view.querySelector('#contestantModalTitle');
        const form = this.contestantForm;
        const firstNameEl = this.view.querySelector('#firstName');
        const lastNameEl = this.view.querySelector('#lastName');
        const dobEl = this.view.querySelector('#dob');
        const emailEl = this.view.querySelector('#email');
        const contactEl = this.view.querySelector('#contactNumber');
        const addressEl = this.view.querySelector('#address');
        const passEl = this.view.querySelector('#tempPassword');
        if (contestant) {
            if (title) title.textContent = 'Edit Contestant';
            if (form) { form.setAttribute('data-mode','edit'); form.setAttribute('data-id', contestant.id); }
            if (firstNameEl) firstNameEl.value = contestant.firstName || '';
            if (lastNameEl) lastNameEl.value = contestant.lastName || '';
            if (dobEl) dobEl.value = contestant.dob || '';
            if (emailEl) emailEl.value = contestant.email || '';
            if (contactEl) contactEl.value = contestant.contactNumber || '';
            if (addressEl) addressEl.value = contestant.address || '';
            if (passEl) passEl.value = contestant.temp_password || '';
            if (this.imagePreview) this.imagePreview.src = contestant.photo || this.getDefaultPhoto();
        } else {
            if (title) title.textContent = 'Add Contestant';
            if (form) { form.setAttribute('data-mode','add'); form.setAttribute('data-id',''); }
        }
        this.contestantModal.classList.remove('hidden');
    },

    closeModal() {
        if (this.contestantModal) {
            this.contestantModal.classList.add('hidden');
            this.contestantForm.reset();
            this.imagePreview.src = this.getDefaultPhoto();
            this.contestantForm.setAttribute('data-mode','add');
            this.contestantForm.setAttribute('data-id','');
        }
    },

    handleImagePreview() {
        const file = this.photoInput.files[0];
        if (!file) {
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#333333">No Image</text></svg>';
            const uri = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
            this.imagePreview.src = uri;
            return;
        }

        const validImageTypes = ['image/jpeg', 'image/png'];
        if (!validImageTypes.includes(file.type)) {
            alert('Invalid file type. Please select a JPG or PNG image.');
            this.photoInput.value = '';
            this.imagePreview.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#333333">No Image</text></svg>';
            return;
        }

        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
            alert('File size exceeds 5MB. Please select a smaller file.');
            this.photoInput.value = '';
            this.imagePreview.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#333333">No Image</text></svg>';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    handleFormSubmit(e) {
        e.preventDefault();
        const firstName = this.view.querySelector('#firstName')?.value.trim() || '';
        const lastName = this.view.querySelector('#lastName')?.value.trim() || '';
        const dob = this.view.querySelector('#dob')?.value || '';
        const email = this.view.querySelector('#email')?.value.trim() || '';
        const contactNumber = this.view.querySelector('#contactNumber')?.value.trim() || '';
        const address = this.view.querySelector('#address')?.value.trim() || '';
        const tempPassword = this.view.querySelector('#tempPassword')?.value || '';
        const photo = this.imagePreview?.src || this.getDefaultPhoto();
        const list = this.loadContestants();
        const form = this.contestantForm;
        const mode = form ? form.getAttribute('data-mode') : 'add';
        const id = mode === 'edit' && form ? form.getAttribute('data-id') : ('contestant_' + Date.now());
        const base = { id, firstName, lastName, dob, email, contactNumber, address, temp_password: tempPassword, photo, updated_at: new Date().toISOString() };
        if (mode === 'edit') {
            const idx = list.findIndex(c => c.id === id);
            if (idx >= 0) list[idx] = { ...(list[idx]||{}), ...base };
        } else {
            const obj = { ...base, created_at: new Date().toISOString(), status: 'active' };
            list.push(obj);
        }
        this.saveContestants(list);
        this.renderContestantsTable();
        this.closeModal();
    }
    ,
    getDefaultPhoto() {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#333333">No Image</text></svg>';
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    ,
    getContestantsKey() { return 'bpms_contestants'; }
    ,
    loadContestants() {
        let list = [];
        try { list = JSON.parse(localStorage.getItem(this.getContestantsKey()) || '[]'); } catch(e) { list = []; }
        return Array.isArray(list) ? list : [];
    }
    ,
    saveContestants(list) {
        localStorage.setItem(this.getContestantsKey(), JSON.stringify(list || []));
    }
    ,
    renderContestantsTable() {
        const tbody = this.contestantsTbody;
        if (!tbody) return;
        const list = this.loadContestants();
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-text">No contestants registered yet</div></td></tr>';
            return;
        }
        const rows = list.map(c => {
            const name = (c.firstName || '') + ' ' + (c.lastName || '');
            const photoSrc = c.photo || this.getDefaultPhoto();
            const toggleText = (c.status === 'inactive') ? 'Activate' : 'Deactivate';
            const statusBadge = '<span class="status-badge ' + ((c.status === 'inactive') ? 'rejected' : 'approved') + '">' + ((c.status === 'inactive') ? 'Inactive' : 'Active') + '</span>';
            return (
                '<tr>' +
                '<td><img class="avatar" src="' + photoSrc + '" alt="' + name + '" /></td>' +
                '<td>' + name + '</td>' +
                '<td>' + (c.email || '') + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' + (c.contactNumber || '') + '</td>' +
                '<td>' +
                    '<button class="table-action-btn view edit-contestant" data-id="' + c.id + '">Edit</button>' +
                    '<button class="table-action-btn view toggle-contestant-status" data-id="' + c.id + '">' + toggleText + '</button>' +
                '</td>' +
                '</tr>'
            );
        }).join('');
        tbody.innerHTML = rows;
    }
};
