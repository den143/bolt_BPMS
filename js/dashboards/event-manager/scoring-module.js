window.ScoringModule = {
    state: {
        activeEvent: null,
        activeTab: 'overview'
    },

    init(event) {
        this.state.activeEvent = event || null;
        this.cacheElements();
        this.attachEvents();
        const saved = localStorage.getItem('bpms_result_panel_active_tab');
        this.showTab(saved || this.state.activeTab);
    },

    cacheElements() {
        this.view = document.getElementById('resultPanelView');
        this.tabButtons = this.view ? this.view.querySelectorAll('[data-tab]') : [];
        this.panels = {
            'overview': document.getElementById('tab-overview'),
            'round-results': document.getElementById('tab-round-results'),
            'leaderboard': document.getElementById('tab-leaderboard'),
            'breakdown': document.getElementById('tab-breakdown'),
            'export': document.getElementById('tab-export')
        };
    },

    attachEvents() {
        if (!this.tabButtons) return;
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.showTab(tab);
            });
        });
    },

    showTab(tab) {
        Object.keys(this.panels).forEach(key => {
            const panel = this.panels[key];
            if (!panel) return;
            if (key === tab) panel.classList.remove('hidden');
            else panel.classList.add('hidden');
        });
        if (this.tabButtons && this.tabButtons.length) {
            this.tabButtons.forEach(btn => {
                const isActive = btn.getAttribute('data-tab') === tab;
                btn.classList.toggle('active', isActive);
            });
        }
        this.state.activeTab = tab;
        localStorage.setItem('bpms_result_panel_active_tab', tab);
    }
};
