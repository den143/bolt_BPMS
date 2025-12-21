
// Judge Dashboard Logic
// Connects with Event Manager data via LocalStorage

window.JudgeApp = {
    state: {
        eventId: 'default', // Default event ID used in Event Manager
        activeRound: null,
        activeSegment: null,
        rounds: [],
        segments: [],
        criteria: [], // Criteria for the active segment
        currentContestant: null,
        scores: {} // Store scores locally for now: { contestantId_segmentId: { criteriaId: value, ... } }
    },

    init() {
        this.loadData();
        this.renderRoundInfo();
        this.renderSegments();
        this.attachGlobalHandlers();
        
        // Auto-select first segment if available
        if (this.state.segments.length > 0) {
            this.selectSegment(this.state.segments[0].id);
        } else {
            // Handle empty state
            document.getElementById('segmentTabsContainer').innerHTML = '<div style="padding:10px; color:#666; font-size:0.9rem;">No active segments found.</div>';
        }
    },

    loadData() {
        // Load Rounds
        const roundsKey = `bpms_rounds_${this.state.eventId}`;
        const roundsRaw = localStorage.getItem(roundsKey);
        this.state.rounds = roundsRaw ? JSON.parse(roundsRaw) : [];

        // Determine Active Round
        // Logic: 1. Locked (In Progress) -> 2. First Active -> 3. First Draft
        // For simplicity, we'll take the first "Locked" round, or just the first round if none are locked.
        // In a real app, the Event Manager would explicitly set an "Active Round" flag.
        // We'll look for a round with status 'Locked' (which implies it's ready/started).
        this.state.activeRound = this.state.rounds.find(r => r.status === 'Locked' && r.active !== false) 
                                || this.state.rounds.find(r => r.active !== false) 
                                || this.state.rounds[0] 
                                || null;

        if (this.state.activeRound) {
            // Load Segments for this round
            const segKey = `bpms_segments_${this.state.eventId}_${this.state.activeRound.id}`;
            const segRaw = localStorage.getItem(segKey);
            let allSegs = segRaw ? JSON.parse(segRaw) : [];
            // Filter only active segments
            this.state.segments = allSegs.filter(s => s.active !== false);
        }
    },

    renderRoundInfo() {
        const titleEl = document.querySelector('.round-title');
        const statusEl = document.querySelector('.round-status');
        
        if (!this.state.activeRound) {
            if(titleEl) titleEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> No Active Round';
            if(statusEl) statusEl.textContent = '-';
            return;
        }

        if (titleEl) {
            titleEl.innerHTML = `<i class="fas fa-medal"></i> ${this.state.activeRound.name}`;
        }
        
        // Mock progress for now
        if (statusEl) {
            statusEl.textContent = "0/5 Complete"; // Dynamic update can be added later
        }
    },

    renderSegments() {
        const container = document.getElementById('segmentTabsContainer');
        if (!container) return;

        container.innerHTML = ''; // Clear existing

        this.state.segments.forEach(seg => {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.dataset.id = seg.id;
            // Removed icons as requested, just text + percent
            btn.innerHTML = `${seg.name} (${seg.percent}%)`;
            
            btn.onclick = () => this.selectSegment(seg.id);
            
            container.appendChild(btn);
        });
    },

    selectSegment(segmentId) {
        this.state.activeSegment = this.state.segments.find(s => s.id === segmentId);
        
        // Update UI Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.id === segmentId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Load criteria for this segment immediately so it's ready for the modal
        if (this.state.activeRound && this.state.activeSegment) {
            const critKey = `bpms_criteria_${this.state.eventId}_${this.state.activeRound.id}_${this.state.activeSegment.id}`;
            const critRaw = localStorage.getItem(critKey);
            this.state.criteria = critRaw ? JSON.parse(critRaw) : [];
        }
    },

    attachGlobalHandlers() {
        // Expose functions to window for HTML onclick attributes
        window.openScoreModal = (id, name, currentScore) => this.openScoreModal(id, name, currentScore);
        window.closeScoreModal = () => this.closeScoreModal();
        window.saveScore = () => this.saveScore();
        window.updateSlider = (id, val) => this.updateSlider(id, val);
        
        // Logout Handlers
        window.confirmLogout = () => document.getElementById('logoutModal').classList.add('active');
        window.closeLogoutModal = () => document.getElementById('logoutModal').classList.remove('active');
        window.doLogout = () => {
            window.location.href = '../../index.html';
        };
    },

    openScoreModal(contestantId, contestantName, currentScore) {
        this.state.currentContestant = { id: contestantId, name: contestantName };
        
        // Update Modal Header
        document.getElementById('modalCName').textContent = contestantName;
        document.getElementById('modalCNumber').textContent = `Contestant #${contestantId}`;
        document.getElementById('modalTotalScore').textContent = '0'; // Reset total

        // Update Segment Info
        const segTitle = document.getElementById('modalSegmentTitle');
        const segWeight = document.getElementById('modalSegmentWeight');
        if (this.state.activeSegment) {
            if(segTitle) segTitle.textContent = this.state.activeSegment.name;
            if(segWeight) segWeight.textContent = `Weight: ${this.state.activeSegment.percent}%`;
        }

        // Render Criteria
        this.renderCriteriaForm();

        // Show Modal
        const modal = document.getElementById('scoreModal');
        modal.classList.add('active');
        
        // Recalculate total (initially 0)
        this.calculateTotal();
    },

    closeScoreModal() {
        document.getElementById('scoreModal').classList.remove('active');
        this.state.currentContestant = null;
    },

    renderCriteriaForm() {
        const container = document.getElementById('criteriaContainer');
        container.innerHTML = '';

        if (!this.state.criteria || this.state.criteria.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">No criteria defined for this segment.</div>';
            return;
        }

        this.state.criteria.forEach((crit, index) => {
            const critId = crit.id || `crit_${index}`;
            const maxScore = parseInt(crit.points) || 10; // Default to 10 if missing

            const div = document.createElement('div');
            div.className = 'criteria-item';
            div.innerHTML = `
                <div class="criteria-header">
                    <div class="crit-title">${crit.name}</div>
                    <div class="crit-score"><span id="val-${critId}">0</span>/${maxScore}</div>
                </div>
                <div class="crit-desc">${crit.description || ''}</div>
                <input type="range" min="0" max="${maxScore}" value="0" class="score-slider" 
                       id="slider-${critId}" 
                       data-crit-id="${critId}"
                       oninput="window.updateSlider('${critId}', this.value)">
                <div class="slider-labels">
                    <span>0</span>
                    <span>${maxScore}</span>
                </div>
            `;
            container.appendChild(div);
        });
    },

    updateSlider(critId, value) {
        const valSpan = document.getElementById(`val-${critId}`);
        if (valSpan) valSpan.textContent = value;
        this.calculateTotal();
    },

    calculateTotal() {
        let total = 0;
        const sliders = document.querySelectorAll('.score-slider');
        sliders.forEach(slider => {
            total += parseInt(slider.value || 0);
        });
        
        const totalEl = document.getElementById('modalTotalScore');
        if (totalEl) totalEl.textContent = total;
    },

    saveScore() {
        // Collect scores
        const scores = {};
        let total = 0;
        document.querySelectorAll('.score-slider').forEach(slider => {
            const critId = slider.dataset.critId;
            const val = parseInt(slider.value);
            scores[critId] = val;
            total += val;
        });

        // In a real app, save to localStorage or backend
        console.log(`Saved score for ${this.state.currentContestant.name}: ${total}`, scores);
        
        // Visual feedback (simulated)
        const btn = document.querySelector('.save-score-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        btn.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            this.closeScoreModal();
            // Reset button
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
            
            // Update the list view (Mock update)
            this.updateContestantCard(this.state.currentContestant.id, total);
        }, 800);
    },

    updateContestantCard(id, score) {
        // Find the card and update it to "Scored" state
        // This is a simple DOM manipulation to show immediate feedback
        // The list is static HTML, so we iterate to find the matching onclick
        const cards = document.querySelectorAll('.contestant-card');
        cards.forEach(card => {
            if (card.getAttribute('onclick') && card.getAttribute('onclick').includes(`openScoreModal(${id}`)) {
                card.classList.add('scored');
                
                // Remove existing button if any
                const btn = card.querySelector('.score-action-btn');
                if (btn) btn.remove();

                // Check if score display exists, else create it
                let scoreDisplay = card.querySelector('.score-display');
                if (!scoreDisplay) {
                    scoreDisplay = document.createElement('div');
                    scoreDisplay.className = 'score-display';
                    card.appendChild(scoreDisplay);
                }
                
                scoreDisplay.innerHTML = `
                    <span class="score-val">${score}</span>
                    <span class="score-total">pts</span>
                `;
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.JudgeApp.init();
});
