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
        if ((saved || this.state.activeTab) === 'overview') this.renderOverview();
        if ((saved || this.state.activeTab) === 'round-results') this.renderRoundResults();
        if ((saved || this.state.activeTab) === 'leaderboard') this.renderLeaderboard();
        if ((saved || this.state.activeTab) === 'breakdown') this.renderBreakdown();
        if ((saved || this.state.activeTab) === 'export') this.renderExport();
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
                if (tab === 'overview') this.renderOverview();
                if (tab === 'round-results') this.renderRoundResults();
                if (tab === 'leaderboard') this.renderLeaderboard();
                if (tab === 'breakdown') this.renderBreakdown();
                if (tab === 'export') this.renderExport();
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
    },

    getRoundsKey(eventId) {
        return 'bpms_rounds_' + (eventId || 'default');
    },

    loadRounds() {
        const ev = this.state.activeEvent;
        const key = this.getRoundsKey(ev && ev.id ? ev.id : 'default');
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },

    loadContestants() {
        const raw = localStorage.getItem('bpms_contestants');
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },

    loadFinalWinner() {
        const ev = this.state.activeEvent;
        const key = 'bpms_final_winner_' + (ev && ev.id ? ev.id : 'default');
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
    },

    // Breakdown helpers
    getSegmentsKey(eventId, roundId) { return 'bpms_segments_' + (eventId || 'default') + '_' + (roundId || 'none'); },
    getCriteriaKey(eventId, roundId, segmentId) { return 'bpms_criteria_' + (eventId || 'default') + '_' + (roundId || 'none') + '_' + (segmentId || 'none'); },
    getSegmentScoresKey(eventId, roundId, segmentId) { return 'bpms_segment_scores_' + (eventId || 'default') + '_' + (roundId || 'none') + '_' + (segmentId || 'none'); },
    loadSegmentsForRound(roundId) {
        const ev = this.state.activeEvent;
        const key = this.getSegmentsKey(ev && ev.id ? ev.id : 'default', roundId);
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },
    loadCriteriaForSegment(roundId, segmentId) {
        const ev = this.state.activeEvent;
        const key = this.getCriteriaKey(ev && ev.id ? ev.id : 'default', roundId, segmentId);
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },
    loadSegmentScores(roundId, segmentId) {
        const ev = this.state.activeEvent;
        const key = this.getSegmentScoresKey(ev && ev.id ? ev.id : 'default', roundId, segmentId);
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },

    renderBreakdown() {
        const roundSel = document.getElementById('breakdownRoundSelect');
        const segmentSel = document.getElementById('breakdownSegmentSelect');
        const contestantSel = document.getElementById('breakdownContestantSelect');
        const tbody = document.getElementById('breakdownTbody');
        const header = document.getElementById('breakdownHeader');
        const totalEl = document.getElementById('breakdownTotal');
        if (!roundSel || !segmentSel || !contestantSel || !tbody || !header || !totalEl) return;

        const rounds = this.loadRounds().sort((a,b) => a.order - b.order);
        roundSel.innerHTML = rounds.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        const segments = roundSel.value ? this.loadSegmentsForRound(roundSel.value) : [];
        segmentSel.innerHTML = segments.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        const contestants = this.loadContestants();
        contestantSel.innerHTML = contestants.map(c => `<option value="${c.id}">${(c.firstName||'') + ' ' + (c.lastName||'')}</option>`).join('');

        const render = () => {
            const roundId = roundSel.value;
            const segmentId = segmentSel.value;
            const contestantId = contestantSel.value;
            if (!roundId || !segmentId || !contestantId) {
                tbody.innerHTML = `<tr><td colspan="3" class="empty-state"><div class="empty-state-text">Select a round, segment, and contestant</div></td></tr>`;
                header.textContent = '';
                totalEl.textContent = 'Segment Total: -';
                return;
            }
            const rObj = rounds.find(r => r.id === roundId);
            const sList = this.loadSegmentsForRound(roundId);
            const sObj = sList.find(s => s.id === segmentId);
            const cObj = contestants.find(c => c.id === contestantId);
            header.textContent = `Round: ${rObj ? rObj.name : '-'} • Segment: ${sObj ? sObj.name : '-'} • Contestant: ${cObj ? ((cObj.firstName||'') + ' ' + (cObj.lastName||'')) : '-'}`;
            const criteria = this.loadCriteriaForSegment(roundId, segmentId);
            const scoresList = this.loadSegmentScores(roundId, segmentId);
            const entry = scoresList.find(x => x.contestantId === contestantId) || { scores: {} };
            let total = 0;
            const rows = criteria.map(cr => {
                const max = parseInt(cr.points,10) || 0;
                const val = entry && entry.scores && typeof entry.scores[cr.name] !== 'undefined' ? Number(entry.scores[cr.name]) : null;
                const shown = val === null ? '-' : val;
                if (typeof val === 'number') total += val;
                return `<tr>
                    <td>${cr.name}</td>
                    <td>${shown}</td>
                    <td>${max}</td>
                </tr>`;
            }).join('');
            tbody.innerHTML = rows || `<tr><td colspan="3" class="empty-state"><div class="empty-state-text">No criteria defined</div></td></tr>`;
            totalEl.textContent = `Segment Total: ${criteria.length ? total : '-'}`;
        };
        render();
        roundSel.addEventListener('change', () => {
            const segs = this.loadSegmentsForRound(roundSel.value);
            segmentSel.innerHTML = segs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            render();
        });
        segmentSel.addEventListener('change', render);
        contestantSel.addEventListener('change', render);
    },

    renderExport() {
        const btn = document.getElementById('exportPdfBtn');
        const csvBtn = document.getElementById('exportCSV');
        const audit = document.getElementById('auditContent');
        const anomalies = document.getElementById('anomaliesList');
        if (!audit || !anomalies) return;
        if (btn) {
            btn.onclick = () => {
                window.print();
            };
        }
        if (csvBtn) {
            csvBtn.onclick = () => {
                this.exportToCSV();
            };
        }
        const evId = this.state.activeEvent && this.state.activeEvent.id ? this.state.activeEvent.id : 'default';
        const judgesRaw = localStorage.getItem('bpms_judges_' + evId);
        let judges = [];
        try { judges = judgesRaw ? JSON.parse(judgesRaw) : []; } catch(e) { judges = []; }
        const rounds = this.loadRounds();
        const contestants = this.loadContestants();
        // Total scores submitted: sum of criteria scores recorded per contestant across all segments
        let totalScores = 0;
        let lastTime = null;
        rounds.forEach(r => {
            const segs = this.loadSegmentsForRound(r.id);
            segs.forEach(s => {
                const scores = this.loadSegmentScores(r.id, s.id);
                scores.forEach(entry => {
                    const crit = this.loadCriteriaForSegment(r.id, s.id);
                    crit.forEach(cr => {
                        const v = entry && entry.scores ? entry.scores[cr.name] : undefined;
                        if (typeof v !== 'undefined' && v !== null) totalScores += 1;
                    });
                    if (entry && entry.updated_at) {
                        const ts = new Date(entry.updated_at).getTime();
                        if (!isNaN(ts)) {
                            if (lastTime === null || ts > lastTime) lastTime = ts;
                        }
                    }
                });
            });
        });
        // Scoring completed: all locked rounds have complete scores for all contestants and criteria
        let completed = true;
        rounds.filter(r => r.status === 'Locked').forEach(r => {
            const segs = this.loadSegmentsForRound(r.id);
            segs.forEach(s => {
                const crit = this.loadCriteriaForSegment(r.id, s.id);
                const scores = this.loadSegmentScores(r.id, s.id);
                contestants.forEach(c => {
                    const e = scores.find(x => x.contestantId === c.id);
                    if (!e) { completed = false; return; }
                    crit.forEach(cr => {
                        const v = e.scores ? e.scores[cr.name] : undefined;
                        if (typeof v === 'undefined' || v === null) completed = false;
                    });
                });
            });
        });
        const lastTimeStr = lastTime ? new Date(lastTime).toLocaleString() : '-';
        audit.innerHTML = `
            <div>Judges: ${judges.length}</div>
            <div>Total Scores Submitted: ${totalScores}</div>
            <div>Scoring Completed: ${completed ? 'Yes' : 'No'}</div>
            <div>Last Scoring Time: ${lastTimeStr}</div>
        `;

        // Anomalies detection
        const anomaliesList = [];
        // Criteria total != 100
        rounds.forEach(r => {
            const segs = this.loadSegmentsForRound(r.id);
            segs.forEach(s => {
                const crit = this.loadCriteriaForSegment(r.id, s.id);
                const total = crit.reduce((acc,c)=> acc + (parseInt(c.points,10)||0), 0);
                if (total !== 100) anomaliesList.push(`Criteria total ≠ 100 in ${r.name} → ${s.name}`);
            });
        });
        // Missing score
        rounds.forEach(r => {
            const segs = this.loadSegmentsForRound(r.id);
            segs.forEach(s => {
                const crit = this.loadCriteriaForSegment(r.id, s.id);
                const scores = this.loadSegmentScores(r.id, s.id);
                contestants.forEach(c => {
                    const e = scores.find(x => x.contestantId === c.id);
                    if (!e) {
                        anomaliesList.push(`Missing score → ${r.name} • ${s.name} • ${c.firstName||''} ${c.lastName||''}`);
                    } else {
                        crit.forEach(cr => {
                            const v = e.scores ? e.scores[cr.name] : undefined;
                            if (typeof v === 'undefined' || v === null) {
                                anomaliesList.push(`Missing score → ${r.name} • ${s.name} • ${c.firstName||''} ${c.lastName||''} • ${cr.name}`);
                            }
                        });
                    }
                });
            });
        });
        // Judge did not score a segment (if judge-level data exists)
        const keys = Object.keys(localStorage || {});
        const judgeScorePrefixes = keys.filter(k => k.startsWith('bpms_judge_segment_scores_'));
        if (judgeScorePrefixes.length > 0) {
            // Basic detection: for each judge key map, ensure every defined segment has an entry for every contestant
            judgeScorePrefixes.forEach(k => {
                let map = {};
                try { map = JSON.parse(localStorage.getItem(k)||'{}'); } catch(e) { map = {}; }
                // map structure is not standardized; flag if empty
                if (!map || Object.keys(map).length === 0) anomaliesList.push(`Judge did not score a segment → Key ${k} empty`);
            });
        } else {
            anomaliesList.push('Judge did not score a segment → ⚠ not available (no judge-level data)');
        }
        if (anomaliesList.length === 0) {
            anomalies.innerHTML = `<div class="empty-state"><div class="empty-state-text">No anomalies detected</div></div>`;
        } else {
            anomalies.innerHTML = '<ul style="list-style: none; padding: 0; margin: 0;">' + anomaliesList.map(a => `<li style="padding: 4px 0;">${a}</li>`).join('') + '</ul>';
        }
    },

    renderOverview() {
        const container = document.getElementById('overviewContent');
        if (!container) return;
        const contestants = this.loadContestants();
        const rounds = this.loadRounds();
        const completed = rounds.filter(r => r.status === 'Locked').length;
        const finalWinner = this.loadFinalWinner();
        const winnerName = finalWinner && finalWinner.name ? finalWinner.name : '-';
        const statsHtml = `
            <div class="quick-stats" style="margin-bottom: 1rem;">
                <div class="stat-card">
                    <div class="stat-label">Total Contestants</div>
                    <div class="stat-value">${contestants.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Rounds Completed</div>
                    <div class="stat-value">${completed}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Final Winner</div>
                    <div class="stat-value">${winnerName}</div>
                </div>
            </div>`;
        let progHtml = '';
        if (!rounds || rounds.length === 0) {
            progHtml = `<div class="empty-state"><div class="empty-state-text">No rounds yet</div></div>`;
        } else {
            const rows = rounds
                .sort((a,b) => a.order - b.order)
                .map(r => {
                    const adv = r.advancement_rule === 'TopN' ? `Top ${r.top_n}` : 'Final (1)';
                    const aud = r.audience_voting ? 'Enabled' : 'Disabled';
                    const isActive = r.active !== false;
                    const statusText = isActive ? (r.status || 'Draft') : 'Deactivated';
                    const statusClass = !isActive ? 'rejected' : (r.status === 'Locked' ? 'approved' : (r.status === 'Draft' ? 'pending' : 'approved'));
                    const statusBadge = `<span class="status-badge ${statusClass}">${statusText}</span>`;
                    return `<tr>
                        <td>${r.name}</td>
                        <td>${r.order}</td>
                        <td>${adv}</td>
                        <td>${aud}</td>
                        <td>${statusBadge}</td>
                    </tr>`;
                }).join('');
            progHtml = `
                <div class="recent-registrations-card" style="margin-top: 2rem;">
                    <h3 class="section-title">Round Progression</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Round</th>
                                <th>Order</th>
                                <th>Advancement Rule</th>
                                <th>Audience Voting</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
        }
        container.innerHTML = statsHtml + progHtml;
    },

    getScoresKey(eventId, roundId) {
        return 'bpms_round_scores_' + (eventId || 'default') + '_' + (roundId || 'none');
    },

    loadRoundScores(roundId) {
        const ev = this.state.activeEvent;
        const key = this.getScoresKey(ev && ev.id ? ev.id : 'default', roundId);
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },

    renderRoundResults() {
        const select = document.getElementById('roundSelect');
        const tbody = document.getElementById('roundResultsTbody');
        if (!select || !tbody) return;
        const rounds = this.loadRounds().sort((a,b) => a.order - b.order);
        select.innerHTML = rounds.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        const savedRound = localStorage.getItem('bpms_selected_round_' + (this.state.activeEvent && this.state.activeEvent.id ? this.state.activeEvent.id : 'default'));
        const initialRoundId = savedRound && rounds.find(r => r.id === savedRound) ? savedRound : (rounds[0] ? rounds[0].id : null);
        if (initialRoundId) select.value = initialRoundId;
        const renderFor = (roundId) => {
            const scores = this.loadRoundScores(roundId);
            if (!scores || scores.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><div class="empty-state-text">No results available</div></td></tr>`;
                return;
            }
            const contestants = this.loadContestants();
            const roundObj = rounds.find(r => r.id === roundId) || null;
            const topN = roundObj && roundObj.advancement_rule === 'TopN' ? (roundObj.top_n || 1) : 1;
            const merged = scores.map(s => {
                const c = contestants.find(x => x.id === s.contestantId) || {};
                return {
                    id: s.contestantId,
                    name: (c.firstName && c.lastName) ? (c.firstName + ' ' + c.lastName) : (c.firstName || c.lastName || 'Unknown'),
                    score: typeof s.totalScore === 'number' ? s.totalScore : 0
                };
            }).sort((a,b) => b.score - a.score);
            const rows = merged.map((m, idx) => {
                const rank = idx + 1;
                const advanced = rank <= topN;
                const statusClass = advanced ? 'approved' : 'rejected';
                const statusText = advanced ? 'Advanced' : 'Eliminated';
                return `<tr>
                    <td>${rank}</td>
                    <td>${m.name || 'Unknown'}</td>
                    <td>${m.score.toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                </tr>`;
            }).join('');
            tbody.innerHTML = rows || `<tr><td colspan="4" class="empty-state"><div class="empty-state-text">No results available</div></td></tr>`;
        };
        if (initialRoundId) renderFor(initialRoundId);
        select.addEventListener('change', () => {
            const val = select.value;
            localStorage.setItem('bpms_selected_round_' + (this.state.activeEvent && this.state.activeEvent.id ? this.state.activeEvent.id : 'default'), val);
            renderFor(val);
        });
    },

    categorizeRounds(rounds) {
        const res = { prelim: null, semis: null, final: null };
        rounds.forEach(r => {
            const name = (r.name || '').toLowerCase();
            if (!res.prelim && name.includes('prelim')) res.prelim = r.id;
            if (!res.semis && name.includes('semi')) res.semis = r.id;
            if (!res.final && name.includes('final')) res.final = r.id;
        });
        return res;
    },

    renderLeaderboard() {
        const tbody = document.getElementById('leaderboardTbody');
        if (!tbody) return;
        const contestants = this.loadContestants();
        if (!contestants || contestants.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><div class="empty-state-text">No contestants found</div></td></tr>`;
            return;
        }
        const rounds = this.loadRounds().sort((a,b) => a.order - b.order);
        const cat = this.categorizeRounds(rounds);
        const prelimObj = rounds.find(r => r && r.id === cat.prelim) || null;
        const semisObj = rounds.find(r => r && r.id === cat.semis) || null;
        const finalObj = rounds.find(r => r && r.id === cat.final) || null;
        const prelimLocked = !!(prelimObj && prelimObj.status === 'Locked');
        const semisLocked = !!(semisObj && semisObj.status === 'Locked');
        const finalLocked = !!(finalObj && finalObj.status === 'Locked');
        const evId = this.state.activeEvent && this.state.activeEvent.id ? this.state.activeEvent.id : 'default';
        const finalWinner = this.loadFinalWinner();
        const getScore = (roundId, contestantId) => {
            if (!roundId) return null;
            const key = this.getScoresKey(evId, roundId);
            const raw = localStorage.getItem(key);
            let list = [];
            try { list = raw ? JSON.parse(raw) : []; } catch(e) { list = []; }
            const s = list.find(x => x.contestantId === contestantId);
            return s && typeof s.totalScore === 'number' ? s.totalScore : (s ? 0 : null);
        };
        const rows = contestants.map(c => {
            const prelim = getScore(cat.prelim, c.id);
            const semis = getScore(cat.semis, c.id);
            const final = getScore(cat.final, c.id);
            const winner = finalWinner && finalWinner.id && c.id === finalWinner.id;
            let statusText = 'Ongoing';
            let statusClass = 'pending';
            if (winner) {
                statusText = 'Winner';
                statusClass = 'approved';
            } else if (finalLocked) {
                if (final !== null) { statusText = 'Finalist'; statusClass = 'approved'; }
                else { statusText = 'Eliminated'; statusClass = 'rejected'; }
            } else if (semisLocked) {
                if (semis !== null) { statusText = 'Ongoing'; statusClass = 'pending'; }
                else { statusText = 'Eliminated'; statusClass = 'rejected'; }
            } else if (prelimLocked) {
                if (prelim !== null) { statusText = 'Ongoing'; statusClass = 'pending'; }
                else { statusText = 'Eliminated'; statusClass = 'rejected'; }
            } else {
                statusText = 'Ongoing';
                statusClass = 'pending';
            }
            const fmt = v => (v === null ? '-' : Number(v).toFixed(2));
            const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
            return `<tr>
                <td>${name}</td>
                <td>${fmt(prelim)}</td>
                <td>${fmt(semis)}</td>
                <td>${fmt(final)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>`;
        }).join('');
        tbody.innerHTML = rows;
    },

    exportToCSV() {
        const contestants = this.loadContestants();
        if (!contestants || contestants.length === 0) {
            alert('No data to export');
            return;
        }
        const rounds = this.loadRounds().sort((a,b) => a.order - b.order);
        const cat = this.categorizeRounds(rounds);
        const evId = this.state.activeEvent && this.state.activeEvent.id ? this.state.activeEvent.id : 'default';
        const finalWinner = this.loadFinalWinner();
        
        const getScore = (roundId, contestantId) => {
            if (!roundId) return null;
            const key = this.getScoresKey(evId, roundId);
            const raw = localStorage.getItem(key);
            let list = [];
            try { list = raw ? JSON.parse(raw) : []; } catch(e) { list = []; }
            const s = list.find(x => x.contestantId === contestantId);
            return s && typeof s.totalScore === 'number' ? s.totalScore : (s ? 0 : null);
        };

        const headers = ['Contestant', 'Prelim', 'Semis', 'Final', 'Status'];
        const rows = contestants.map(c => {
            const prelim = getScore(cat.prelim, c.id);
            const semis = getScore(cat.semis, c.id);
            const final = getScore(cat.final, c.id);
            const winner = finalWinner && finalWinner.id && c.id === finalWinner.id;
            
            let statusText = 'Ongoing';
            if (winner) statusText = 'Winner';
            // Simple status logic for CSV
            
            const fmt = v => (v === null ? '-' : Number(v).toFixed(2));
            const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
            
            return [
                name,
                fmt(prelim),
                fmt(semis),
                fmt(final),
                statusText
            ].map(f => `"${f}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'event_results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
