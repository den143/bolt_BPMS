window.ContestantModule = {
    state: {
        activeEvent: null,
        editingId: null,
        contestants: []
    },

    init(view) {
        this.cacheElements(view);
        this.attachEventListeners();
        this.loadContestants();
        this.renderContestants();
    },

    cacheElements(view) {
        this.view = view;
        this.addContestantBtn = this.view.querySelector('#addContestantBtn');
        this.contestantModal = this.view.querySelector('#contestantModal');
        this.cancelContestantBtn = this.view.querySelector('#cancelContestant');
        this.contestantForm = this.view.querySelector('#contestantForm');
        this.photoInput = this.view.querySelector('#photo');
        this.imagePreview = this.view.querySelector('#imagePreview');
        this.searchInput = this.view.querySelector('#searchContestant');
        this.filterStatus = this.view.querySelector('#filterStatus');
        this.tableBody = this.view.querySelector('#contestantsTbody');
        this.modalTitle = this.view.querySelector('#contestantModalTitle');
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

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.renderContestants());
        }

        if (this.filterStatus) {
            this.filterStatus.addEventListener('change', () => this.renderContestants());
        }

        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => this.handleTableAction(e));
        }
    },

    loadContestants() {
        const stored = localStorage.getItem('bpms_contestants');
        this.state.contestants = stored ? JSON.parse(stored) : [];
    },

    saveContestants() {
        localStorage.setItem('bpms_contestants', JSON.stringify(this.state.contestants));
        this.renderContestants();
    },

    renderContestants() {
        if (!this.tableBody) return;

        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase() : '';
        const statusFilter = this.filterStatus ? this.filterStatus.value : 'All';

        const filtered = this.state.contestants.filter(c => {
            const matchesSearch = (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-state-text">No contestants found</div>
                    </td>
                </tr>`;
            return;
        }

        this.tableBody.innerHTML = filtered.map(c => `
            <tr>
                <td>
                    <img src="${c.photo || 'https://via.placeholder.com/40'}" alt="Photo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                </td>
                <td>${c.firstName} ${c.lastName}</td>
                <td>${this.calculateAge(c.dob)}</td>
                <td>
                    <span class="status-badge ${c.status === 'Active' ? 'approved' : 'pending'}">
                        ${c.status}
                    </span>
                </td>
                <td>${c.email}</td>
                <td>${c.contactNumber}</td>
                <td>
                    <button class="submit-button secondary-button" data-action="edit" data-id="${c.id}" style="width: auto; padding: 4px 10px; font-size: 12px; margin-right: 5px;">Edit</button>
                    <button class="submit-button secondary-button" data-action="toggle-status" data-id="${c.id}" style="width: auto; padding: 4px 10px; font-size: 12px;">${c.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                </td>
            </tr>
        `).join('');
    },

    calculateAge(dob) {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },

    openModal(id = null) {
        if (this.contestantModal) {
            this.contestantModal.classList.remove('hidden');
            this.state.editingId = id;
            
            if (this.modalTitle) {
                this.modalTitle.textContent = id ? 'Edit Contestant' : 'Add Contestant';
            }

            if (id) {
                const c = this.state.contestants.find(x => x.id === id);
                if (c) {
                    this.setFormValues(c);
                }
            } else {
                this.contestantForm.reset();
                this.resetImagePreview();
            }
        }
    },

    setFormValues(c) {
        if (!this.contestantForm) return;
        document.getElementById('firstName').value = c.firstName || '';
        document.getElementById('lastName').value = c.lastName || '';
        document.getElementById('dob').value = c.dob || '';
        document.getElementById('email').value = c.email || '';
        document.getElementById('contactNumber').value = c.contactNumber || '';
        document.getElementById('address').value = c.address || '';
        document.getElementById('tempPassword').value = c.tempPassword || ''; // In real app, don't show password
        
        if (c.photo) {
            this.imagePreview.src = c.photo;
        } else {
            this.resetImagePreview();
        }
    },

    closeModal() {
        if (this.contestantModal) {
            this.contestantModal.classList.add('hidden');
            this.contestantForm.reset();
            this.resetImagePreview();
            this.state.editingId = null;
        }
    },

    resetImagePreview() {
        this.imagePreview.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23555\' font-family=\'sans-serif\' font-size=\'30\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';
    },

    handleImagePreview() {
        const file = this.photoInput.files[0];
        const defaultImage = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect fill=\'%23ddd\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%23555\' font-family=\'sans-serif\' font-size=\'30\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';
        
        if (!file) {
            this.imagePreview.src = defaultImage;
            return;
        }

        const validImageTypes = ['image/jpeg', 'image/png'];
        if (!validImageTypes.includes(file.type)) {
            alert('Invalid file type. Please select a JPG or PNG image.');
            this.photoInput.value = '';
            this.imagePreview.src = defaultImage;
            return;
        }

        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeInBytes) {
            alert('File size exceeds 5MB. Please select a smaller file.');
            this.photoInput.value = '';
            this.imagePreview.src = defaultImage;
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
        
        const formData = {
            id: this.state.editingId || 'contestant_' + Date.now(),
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            dob: document.getElementById('dob').value,
            email: document.getElementById('email').value,
            contactNumber: document.getElementById('contactNumber').value,
            address: document.getElementById('address').value,
            tempPassword: document.getElementById('tempPassword').value,
            photo: this.imagePreview.src, // Saving data URL directly for demo
            status: 'Active',
            registeredAt: new Date().toISOString()
        };

        if (this.state.editingId) {
            const index = this.state.contestants.findIndex(c => c.id === this.state.editingId);
            if (index !== -1) {
                // Preserve status and registration date if editing
                formData.status = this.state.contestants[index].status;
                formData.registeredAt = this.state.contestants[index].registeredAt;
                this.state.contestants[index] = formData;
            }
        } else {
            this.state.contestants.push(formData);
        }

        this.saveContestants();
        this.closeModal();
    },

    handleTableAction(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'edit') {
            this.openModal(id);
        } else if (action === 'toggle-status') {
            this.toggleStatus(id);
        }
    },

    toggleStatus(id) {
        const contestant = this.state.contestants.find(c => c.id === id);
        if (contestant) {
            contestant.status = contestant.status === 'Active' ? 'Inactive' : 'Active';
            this.saveContestants();
        }
    }
};


