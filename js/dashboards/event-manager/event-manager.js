'use strict';

/**
 * Event Manager Dashboard Object
 * Handles event creation and dashboard display
 */
const EventManagerDashboard = {
    // Application state
    state: {
        isFormSubmitting: false,
        activeEvent: null,
        dashboardData: {
            stats: null,
            activities: [],
            recentRegistrations: [],
            judges: [],
            tasks: []
        },
        refreshInterval: null,
        isLoading: false
    },

    // DOM element cache
    elements: {},

    /**
     * Initialize the dashboard
     */
    init() {
        this.cacheElements();
        this.checkForActiveEvent();
        this.attachEventListeners();
        this.setupDataRefresh();
        console.log('Event Manager Dashboard Initialized');
    },

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        this.elements = {
            // Modal elements
            eventCreationModal: document.getElementById('eventCreationModal'),
            eventCreationForm: document.getElementById('eventCreationForm'),
            eventCreationSuccess: document.getElementById('eventCreationSuccess'),
            createEventButton: document.getElementById('createEventButton'),
            
            // Form inputs
            eventNameInput: document.getElementById('eventName'),
            eventDateInput: document.getElementById('eventDate'),
            eventVenueInput: document.getElementById('eventVenue'),
            
            // Error messages
            eventNameError: document.getElementById('eventNameError'),
            eventDateError: document.getElementById('eventDateError'),
            eventVenueError: document.getElementById('eventVenueError'),
            
            // Dashboard elements
            mainDashboard: document.getElementById('mainDashboard'),
            dashboardEventName: document.getElementById('dashboardEventName'),
            dashboardEventDate: document.getElementById('dashboardEventDate'),
            dashboardEventVenue: document.getElementById('dashboardEventVenue'),
            statStatus: document.getElementById('statStatus'),
            statContestants: document.getElementById('statContestants'),
            statJudges: document.getElementById('statJudges'),
            
            // Sidebar and navigation
            sidebar: document.getElementById('sidebar'),
            navItems: document.querySelectorAll('.nav-item[data-nav]'),
            logoutButton: document.getElementById('logoutButton'),
            settingsButton: document.querySelector('.nav-item[data-nav="settings"]'),
            
            // Header elements
            notificationIcon: document.getElementById('notificationIcon'),
            profileIcon: document.getElementById('profileIcon'),
            
            // Dashboard views
            dashboardView: document.getElementById('dashboardView'),
            otherViews: document.getElementById('otherViews'),
            statActiveJudges: document.getElementById('statActiveJudges'),
            statRegisteredJudges: document.getElementById('statRegisteredJudges'),
            
            // Enhanced dashboard elements
            daysUntilEvent: document.getElementById('daysUntilEvent'),
            daysCount: document.getElementById('daysCount'),
            eventStatusBadge: document.getElementById('eventStatusBadge'),
            statRounds: document.getElementById('statRounds'),
            statSegments: document.getElementById('statSegments'),
            statAwards: document.getElementById('statAwards'),
            statOrganizers: document.getElementById('statOrganizers'),
            statCompletionRate: document.getElementById('statCompletionRate'),
            
            // Progress checklist
            progressPercentage: document.getElementById('progressPercentage'),
            progressBarFill: document.getElementById('progressBarFill'),
            checkEventDetails: document.getElementById('checkEventDetails'),
            checkOrganizers: document.getElementById('checkOrganizers'),
            checkRounds: document.getElementById('checkRounds'),
            checkSegments: document.getElementById('checkSegments'),
            checkAwards: document.getElementById('checkAwards'),
            checkContestants: document.getElementById('checkContestants'),
            checkJudges: document.getElementById('checkJudges'),
            
            // Activity feed
            activityFeedContainer: document.getElementById('activityFeedContainer'),
            refreshActivityBtn: document.getElementById('refreshActivityBtn'),
            
            // Recent registrations
            recentRegistrationsBody: document.getElementById('recentRegistrationsBody'),
            
            // Judge status
            judgeStatusContainer: document.getElementById('judgeStatusContainer'),
            
            // Upcoming tasks
            upcomingTasksContainer: document.getElementById('upcomingTasksContainer'),
            
            // Quick actions
            quickActionButtons: document.querySelectorAll('.quick-action-btn')
        };

        // Diagnostics: log missing elements to console for debugging
        const missing = Object.entries(this.elements).filter(([k, v]) => !v).map(([k]) => k);
        if (missing.length) {
            console.warn('Event Manager Dashboard: Some elements could not be found during cache:', missing.join(', '));
        } else {
            console.log('Event Manager Dashboard: All key elements cached successfully');
        }
    },

    /**
     * Check for active event on page load
     */
    checkForActiveEvent() {
        const activeEventData = localStorage.getItem('bpms_active_event');
        
        if (activeEventData) {
            try {
                this.state.activeEvent = JSON.parse(activeEventData);
                this.showDashboard();
            } catch (error) {
                console.error('Error parsing active event data:', error);
                this.showEventCreationModal();
            }
        } else {
            this.showEventCreationModal();
        }
    },

    /**
     * Show event creation modal
     */
    showEventCreationModal() {
        if (this.elements.eventCreationModal) {
            this.elements.eventCreationModal.classList.remove('hidden');
            this.elements.eventCreationModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            if (this.elements.eventNameInput) {
                setTimeout(() => this.elements.eventNameInput.focus(), 100);
            }
        }
    },

    /**
     * Hide event creation modal
     */
    hideEventCreationModal() {
        if (this.elements.eventCreationModal) {
            this.elements.eventCreationModal.classList.add('hidden');
            this.elements.eventCreationModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    },

    /**
     * Show main dashboard
     */
    showDashboard() {
        if (this.elements.mainDashboard && this.state.activeEvent) {
            // Hide modal if visible
            this.hideEventCreationModal();
            
            // Show dashboard
            this.elements.mainDashboard.classList.remove('hidden');
            
            // Populate dashboard with event data
            this.populateDashboard();
        }
    },

    /**
     * Populate dashboard with event information
     */
    populateDashboard() {
        if (!this.state.activeEvent) return;

        const event = this.state.activeEvent;
        
        // Format date for display
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update dashboard elements
        if (this.elements.dashboardEventName) {
            this.elements.dashboardEventName.textContent = event.name;
        }
        
        if (this.elements.dashboardEventDate) {
            this.elements.dashboardEventDate.textContent = formattedDate;
        }
        
        if (this.elements.dashboardEventVenue) {
            this.elements.dashboardEventVenue.textContent = event.venue;
        }
        
        if (this.elements.statStatus) {
            this.elements.statStatus.textContent = event.status.charAt(0).toUpperCase() + event.status.slice(1);
        }

        // Update event status badge
        if (this.elements.eventStatusBadge) {
            this.elements.eventStatusBadge.textContent = event.status.charAt(0).toUpperCase() + event.status.slice(1);
            this.elements.eventStatusBadge.className = 'event-status-badge ' + event.status.toLowerCase();
        }

        // Set dashboard as default view
        this.showDashboardView();

        // Calculate days until event
        this.calculateDaysUntilEvent();

        // Load dashboard data
        this.loadDashboardData();
    },

    /**
     * Calculate days until event
     */
    calculateDaysUntilEvent() {
        if (!this.state.activeEvent || !this.elements.daysCount) return;

        const eventDate = new Date(this.state.activeEvent.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (this.elements.daysCount) {
            if (diffDays < 0) {
                this.elements.daysCount.textContent = Math.abs(diffDays);
                if (this.elements.daysUntilEvent) {
                    this.elements.daysUntilEvent.innerHTML = '<strong>' + Math.abs(diffDays) + '</strong> days since event';
                }
            } else if (diffDays === 0) {
                this.elements.daysCount.textContent = '0';
                if (this.elements.daysUntilEvent) {
                    this.elements.daysUntilEvent.innerHTML = '<strong>Today</strong> is the event day!';
                }
            } else {
                this.elements.daysCount.textContent = diffDays;
                if (this.elements.daysUntilEvent) {
                    this.elements.daysUntilEvent.innerHTML = '<strong>' + diffDays + '</strong> days until event';
                }
            }
        }
    },

    /**
     * Load dashboard data
     */
    loadDashboardData() {
        this.state.isLoading = true;
        
        // For now, use mock data since backend is not ready
        // This will be replaced with API calls later
        this.loadMockDashboardData();
        
        // Update UI with data
        this.updateDashboardUI();
        
        this.state.isLoading = false;
    },

    /**
     * Load mock dashboard data (temporary until backend is ready)
     */
    loadMockDashboardData() {
        // Mock statistics
        this.state.dashboardData.stats = {
            totalContestants: 0,
            totalJudges: 0,
            activeJudges: 0,
            registeredJudges: 0,
            totalRounds: 0,
            totalSegments: 0,
            totalAwards: 0,
            totalOrganizers: 0,
            completionRate: 0
        };

        // Mock activities
        this.state.dashboardData.activities = [];

        // Mock recent registrations
        this.state.dashboardData.recentRegistrations = [];

        // Mock judges
        this.state.dashboardData.judges = [];

        // Mock tasks
        this.state.dashboardData.tasks = [];
    },

    /**
     * Update dashboard UI with loaded data
     */
    updateDashboardUI() {
        // Update statistics
        this.updateStatistics();
        
        // Update progress checklist
        this.updateProgressChecklist();
        
        // Update activity feed
        this.updateActivityFeed();
        
        // Update recent registrations
        this.updateRecentRegistrations();
        
        // Update judge status
        this.updateJudgeStatus();
        
        // Update upcoming tasks
        this.updateUpcomingTasks();
    },

    /**
     * Update statistics display
     */
    updateStatistics() {
        const stats = this.state.dashboardData.stats;
        
        if (this.elements.statContestants) {
            this.elements.statContestants.textContent = stats.totalContestants || 0;
        }
        if (this.elements.statJudges) {
            this.elements.statJudges.textContent = stats.totalJudges || 0;
        }
        if (this.elements.statActiveJudges) {
            this.elements.statActiveJudges.textContent = stats.activeJudges || 0;
        }
        if (this.elements.statRegisteredJudges) {
            this.elements.statRegisteredJudges.textContent = stats.registeredJudges || 0;
        }
        if (this.elements.statRounds) {
            this.elements.statRounds.textContent = stats.totalRounds || 0;
        }
        if (this.elements.statSegments) {
            this.elements.statSegments.textContent = stats.totalSegments || 0;
        }
        if (this.elements.statAwards) {
            this.elements.statAwards.textContent = stats.totalAwards || 0;
        }
        if (this.elements.statOrganizers) {
            this.elements.statOrganizers.textContent = stats.totalOrganizers || 0;
        }
        if (this.elements.statCompletionRate) {
            this.elements.statCompletionRate.textContent = (stats.completionRate || 0) + '%';
        }
    },

    /**
     * Update progress checklist
     */
    updateProgressChecklist() {
        const stats = this.state.dashboardData.stats;
        const event = this.state.activeEvent;
        
        // Check each item
        const checks = {
            eventDetails: !!event,
            organizers: (stats.totalOrganizers || 0) > 0,
            rounds: (stats.totalRounds || 0) > 0,
            segments: (stats.totalSegments || 0) > 0,
            awards: (stats.totalAwards || 0) > 0,
            contestants: (stats.totalContestants || 0) > 0,
            judges: (stats.totalJudges || 0) > 0
        };

        // Update checkmarks
        this.updateCheckmark('checkEventDetails', checks.eventDetails);
        this.updateCheckmark('checkOrganizers', checks.organizers);
        this.updateCheckmark('checkRounds', checks.rounds);
        this.updateCheckmark('checkSegments', checks.segments);
        this.updateCheckmark('checkAwards', checks.awards);
        this.updateCheckmark('checkContestants', checks.contestants);
        this.updateCheckmark('checkJudges', checks.judges);

        // Calculate completion percentage
        const totalChecks = Object.keys(checks).length;
        const completedChecks = Object.values(checks).filter(Boolean).length;
        const percentage = Math.round((completedChecks / totalChecks) * 100);

        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = percentage + '%';
        }
        if (this.elements.progressBarFill) {
            this.elements.progressBarFill.style.width = percentage + '%';
        }
    },

    /**
     * Update checkmark status
     */
    updateCheckmark(elementId, isComplete) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isComplete) {
                element.textContent = '✓';
                element.classList.remove('incomplete');
                element.classList.add('complete');
            } else {
                element.textContent = '✗';
                element.classList.remove('complete');
                element.classList.add('incomplete');
            }
        }
    },

    /**
     * Update activity feed
     */
    updateActivityFeed() {
        if (!this.elements.activityFeedContainer) return;

        const activities = this.state.dashboardData.activities;

        if (activities.length === 0) {
            this.elements.activityFeedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No recent activity</div>
                </div>
            `;
            return;
        }

        let html = '';
        activities.forEach(activity => {
            const iconClass = activity.type === 'contestant' ? 'contestant' : 
                            activity.type === 'judge' ? 'judge' : 'system';
            const iconSvg = this.getActivityIcon(activity.type);
            
            html += `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        ${iconSvg}
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.message}</div>
                        <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
                    </div>
                </div>
            `;
        });

        this.elements.activityFeedContainer.innerHTML = html;
    },

    /**
     * Get activity icon SVG
     */
    getActivityIcon(type) {
        const icons = {
            contestant: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
            judge: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            system: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
        };
        return icons[type] || icons.system;
    },

    /**
     * Format time ago
     */
    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return time.toLocaleDateString();
    },

    /**
     * Update recent registrations table
     */
    updateRecentRegistrations() {
        if (!this.elements.recentRegistrationsBody) return;

        const registrations = this.state.dashboardData.recentRegistrations;

        if (registrations.length === 0) {
            this.elements.recentRegistrationsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-state-text">No recent registrations</div>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        registrations.forEach(reg => {
            const statusClass = reg.status.toLowerCase();
            html += `
                <tr>
                    <td>${reg.name}</td>
                    <td>${new Date(reg.registrationDate).toLocaleDateString()}</td>
                    <td><span class="status-badge ${statusClass}">${reg.status}</span></td>
                    <td>
                        <button class="table-action-btn view" onclick="EventManagerDashboard.viewContestant('${reg.id}')">View</button>
                    </td>
                </tr>
            `;
        });

        this.elements.recentRegistrationsBody.innerHTML = html;
    },

    /**
     * Update judge status
     */
    updateJudgeStatus() {
        if (!this.elements.judgeStatusContainer) return;

        const judges = this.state.dashboardData.judges;

        if (judges.length === 0) {
            this.elements.judgeStatusContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No judges assigned yet</div>
                </div>
            `;
            return;
        }

        let html = '';
        judges.forEach(judge => {
            const initials = judge.name.split(' ').map(n => n[0]).join('').toUpperCase();
            html += `
                <div class="judge-status-item">
                    <div class="judge-info">
                        <div class="judge-avatar">${initials}</div>
                        <div class="judge-details">
                            <div class="judge-name">${judge.name}</div>
                            <div class="judge-meta">${judge.status} • Last active: ${this.formatTimeAgo(judge.lastActivity)}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        this.elements.judgeStatusContainer.innerHTML = html;
    },

    /**
     * Update upcoming tasks
     */
    updateUpcomingTasks() {
        if (!this.elements.upcomingTasksContainer) return;

        const tasks = this.state.dashboardData.tasks;

        if (tasks.length === 0) {
            this.elements.upcomingTasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No upcoming tasks</div>
                </div>
            `;
            return;
        }

        let html = '';
        tasks.forEach(task => {
            html += `
                <div class="task-item">
                    <div class="task-priority ${task.priority}"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-due-date">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        });

        this.elements.upcomingTasksContainer.innerHTML = html;
    },

    /**
     * Handle quick action
     */
    handleQuickAction(action) {
        // Navigate to appropriate section
        const navItem = document.querySelector(`[data-nav="${action}"]`);
        if (navItem) {
            navItem.click();
        } else {
            console.log('Quick action:', action);
            // TODO: Implement action handlers
        }
    },

    /**
     * Refresh dashboard data
     */
    refreshDashboardData() {
        if (this.elements.refreshActivityBtn) {
            this.elements.refreshActivityBtn.classList.add('refreshing');
        }
        
        this.loadDashboardData();
        
        setTimeout(() => {
            if (this.elements.refreshActivityBtn) {
                this.elements.refreshActivityBtn.classList.remove('refreshing');
            }
        }, 1000);
    },

    /**
     * Setup auto-refresh
     */
    setupDataRefresh() {
        // Auto-refresh every 60 seconds
        this.state.refreshInterval = setInterval(() => {
            this.refreshDashboardData();
        }, 60000);
    },

    /**
     * View contestant (placeholder)
     */
    viewContestant(id) {
        console.log('View contestant:', id);
        // TODO: Implement view contestant functionality
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Form submission
        if (this.elements.eventCreationForm) {
            this.elements.eventCreationForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Real-time validation
        if (this.elements.eventNameInput) {
            this.elements.eventNameInput.addEventListener('blur', () => this.validateEventName());
            this.elements.eventNameInput.addEventListener('input', () => this.clearError('eventName'));
        }
        
        if (this.elements.eventDateInput) {
            this.elements.eventDateInput.addEventListener('blur', () => this.validateEventDate());
            this.elements.eventDateInput.addEventListener('change', () => this.clearError('eventDate'));
        }
        
        if (this.elements.eventVenueInput) {
            this.elements.eventVenueInput.addEventListener('blur', () => this.validateEventVenue());
            this.elements.eventVenueInput.addEventListener('input', () => this.clearError('eventVenue'));
        }

        // Navigation items
        if (this.elements.navItems && this.elements.navItems.length > 0) {
            this.elements.navItems.forEach(navItem => {
                navItem.addEventListener('click', (e) => this.handleNavigationClick(e, navItem));
            });
        }

        // Logout button
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Settings button
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', (e) => this.handleSettings(e));
        }

        // Notification icon
        if (this.elements.notificationIcon) {
            this.elements.notificationIcon.addEventListener('click', () => this.handleNotificationClick());
        }

        // Profile icon
        if (this.elements.profileIcon) {
            this.elements.profileIcon.addEventListener('click', () => this.handleProfileClick());
        }

        // Refresh activity button
        if (this.elements.refreshActivityBtn) {
            this.elements.refreshActivityBtn.addEventListener('click', () => {
                this.refreshDashboardData();
            });
        }

        // Quick action buttons
        if (this.elements.quickActionButtons && this.elements.quickActionButtons.length > 0) {
            this.elements.quickActionButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = btn.getAttribute('data-action');
                    this.handleQuickAction(action);
                });
            });
        }

        // Prevent Escape key from closing non-dismissible modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.eventCreationModal && 
                !this.elements.eventCreationModal.classList.contains('hidden')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    },

    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();

        // Validate all fields
        const isNameValid = this.validateEventName();
        const isDateValid = this.validateEventDate();
        const isVenueValid = this.validateEventVenue();

        if (!isNameValid || !isDateValid || !isVenueValid) {
            // Shake animation on form
            if (this.elements.eventCreationForm) {
                this.elements.eventCreationForm.classList.add('shake-animation');
                setTimeout(() => {
                    this.elements.eventCreationForm.classList.remove('shake-animation');
                }, 500);
            }
            return;
        }

        // Prevent double submission
        if (this.state.isFormSubmitting) {
            return;
        }

        this.createEvent();
    },

    /**
     * Create event and save to localStorage
     */
    createEvent() {
        this.state.isFormSubmitting = true;
        
        if (this.elements.createEventButton) {
            this.elements.createEventButton.disabled = true;
            this.elements.createEventButton.textContent = 'Creating...';
        }

        // Get form values
        const eventName = this.elements.eventNameInput.value.trim();
        const eventDate = this.elements.eventDateInput.value;
        const eventVenue = this.elements.eventVenueInput.value.trim();

        // Generate unique event ID
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create event object
        const newEvent = {
            id: eventId,
            name: eventName,
            date: eventDate,
            venue: eventVenue,
            created_at: new Date().toISOString(),
            status: 'active'
        };

        // Handle previous active event
        const previousActiveEvent = localStorage.getItem('bpms_active_event');
        if (previousActiveEvent) {
            try {
                const previousEvent = JSON.parse(previousActiveEvent);
                previousEvent.status = 'completed';
                this.updateEventInHistory(previousEvent);
            } catch (error) {
                console.error('Error updating previous event:', error);
            }
        }

        // Save active event
        localStorage.setItem('bpms_active_event', JSON.stringify(newEvent));

        // Save to event history
        this.addEventToHistory(newEvent);

        // Update state
        this.state.activeEvent = newEvent;

        // Show success message
        if (this.elements.eventCreationSuccess) {
            this.elements.eventCreationSuccess.classList.add('show');
        }

        // Reset form state after delay
        setTimeout(() => {
            this.state.isFormSubmitting = false;
            
            if (this.elements.createEventButton) {
                this.elements.createEventButton.disabled = false;
                this.elements.createEventButton.textContent = 'Create Event';
            }

            // Hide success message and show dashboard
            if (this.elements.eventCreationSuccess) {
                this.elements.eventCreationSuccess.classList.remove('show');
            }

            // Clear form
            if (this.elements.eventCreationForm) {
                this.elements.eventCreationForm.reset();
            }

            // Show dashboard
            this.showDashboard();
        }, 2500);
    },

    /**
     * Add event to history
     */
    addEventToHistory(event) {
        let events = [];
        const eventsData = localStorage.getItem('bpms_events');
        
        if (eventsData) {
            try {
                events = JSON.parse(eventsData);
            } catch (error) {
                console.error('Error parsing events history:', error);
                events = [];
            }
        }

        // Check if event already exists (by ID) and update it, otherwise add it
        const existingIndex = events.findIndex(e => e.id === event.id);
        if (existingIndex >= 0) {
            events[existingIndex] = event;
        } else {
            events.push(event);
        }

        localStorage.setItem('bpms_events', JSON.stringify(events));
    },

    /**
     * Update event in history
     */
    updateEventInHistory(event) {
        let events = [];
        const eventsData = localStorage.getItem('bpms_events');
        
        if (eventsData) {
            try {
                events = JSON.parse(eventsData);
            } catch (error) {
                console.error('Error parsing events history:', error);
                events = [];
            }
        }

        const index = events.findIndex(e => e.id === event.id);
        if (index >= 0) {
            events[index] = event;
        } else {
            events.push(event);
        }

        localStorage.setItem('bpms_events', JSON.stringify(events));
    },

    /**
     * Validate event name
     */
    validateEventName() {
        const input = this.elements.eventNameInput;
        const errorElement = this.elements.eventNameError;
        const value = input.value.trim();

        if (!value) {
            this.showError('eventName', 'Event name is required');
            return false;
        }

        if (value.length < 3) {
            this.showError('eventName', 'Event name must be at least 3 characters');
            return false;
        }

        if (value.length > 100) {
            this.showError('eventName', 'Event name must not exceed 100 characters');
            return false;
        }

        this.clearError('eventName');
        return true;
    },

    /**
     * Validate event date
     */
    validateEventDate() {
        const input = this.elements.eventDateInput;
        const errorElement = this.elements.eventDateError;
        const value = input.value;

        if (!value) {
            this.showError('eventDate', 'Event date is required');
            return false;
        }

        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime())) {
            this.showError('eventDate', 'Please enter a valid date');
            return false;
        }

        // Optional: Prevent past dates (commented out for flexibility)
        // if (selectedDate < today) {
        //     this.showError('eventDate', 'Event date cannot be in the past');
        //     return false;
        // }

        this.clearError('eventDate');
        return true;
    },

    /**
     * Validate event venue
     */
    validateEventVenue() {
        const input = this.elements.eventVenueInput;
        const errorElement = this.elements.eventVenueError;
        const value = input.value.trim();

        if (!value) {
            this.showError('eventVenue', 'Venue/Location is required');
            return false;
        }

        if (value.length < 5) {
            this.showError('eventVenue', 'Venue/Location must be at least 5 characters');
            return false;
        }

        if (value.length > 200) {
            this.showError('eventVenue', 'Venue/Location must not exceed 200 characters');
            return false;
        }

        this.clearError('eventVenue');
        return true;
    },

    /**
     * Show error message for a field
     */
    showError(field, message) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        if (!input || !errorElement) {
            return;
        }

        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');

        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'true');
    },

    /**
     * Clear error message for a field
     */
    clearError(field) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        if (!input || !errorElement) {
            return;
        }

        input.classList.remove('error');
        errorElement.textContent = '';
        errorElement.removeAttribute('role');

        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'false');
    },

    /**
     * Handle navigation item click
     */
    handleNavigationClick(e, navItem) {
        e.preventDefault();
        
        const navTarget = navItem.getAttribute('data-nav');
        
        // Remove active class from all nav items
        if (this.elements.navItems && this.elements.navItems.length > 0) {
            this.elements.navItems.forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Add active class to clicked item
        navItem.classList.add('active');
        
        // Handle navigation based on target
        console.log('Navigation clicked:', navTarget);
        
        // Show dashboard view or other views
        if (navTarget === 'dashboard') {
            this.showDashboardView();
        } else {
            this.showOtherView(navTarget);
        }
        
        // Placeholder for future navigation functionality
        // This will be replaced with actual page routing/content loading
        switch(navTarget) {
            case 'dashboard':
                // Dashboard view is already shown above
                break;
            case 'manage-organizers':
                this.renderManageOrganizersView();
                break;
            case 'manage-activities':
                this.renderManageActivitiesView();
                break;
            case 'manage-rounds':
                this.renderManageRoundsView();
                break;
            case 'manage-segments':
                this.renderManageSegmentsView();
                break;
            case 'manage-awards':
                this.renderSectionView('Manage Awards', 'Create and manage awards');
                break;
            case 'register-contestant':
                this.renderRegisterContestantView();
                break;
            case 'register-judge':
                this.renderRegisterJudgeView();
                break;
            case 'result-panel':
                this.renderSectionView('Result Panel', 'View results and rankings');
                break;
            default:
                console.log('Unknown navigation target:', navTarget);
        }
    },

    /**
     * Show dashboard view
     */
    showDashboardView() {
        if (this.elements.dashboardView) {
            this.elements.dashboardView.classList.remove('hidden');
        }
        if (this.elements.otherViews) {
            this.elements.otherViews.classList.add('hidden');
        }
    },

    /**
     * Show other view (non-dashboard)
     */
    showOtherView(viewName) {
        if (this.elements.dashboardView) {
            this.elements.dashboardView.classList.add('hidden');
        }
        if (this.elements.otherViews) {
            this.elements.otherViews.classList.remove('hidden');
        }
    },

    renderSectionView(title, subtitle) {
        if (!this.elements.otherViews) return;
        this.showOtherView(title);
        const html = `
            <section class="dashboard-view">
              <div class="page-header">
                <div>
                  <h1 class="event-title">${title}</h1>
                  <p class="page-subtitle">${subtitle}</p>
                </div>
              </div>
              <div class="recent-registrations-card">
                <h2 class="section-title">${title}</h2>
                <div class="empty-state">
                  <div class="empty-state-text">Content will be available soon</div>
                </div>
              </div>
            </section>`;
        this.elements.otherViews.innerHTML = html;
    },

    renderRegisterContestantView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('register-contestant');
        fetch('./register-contestant.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                // Pass the container element because the modal is a sibling of the main view
                if (window.ContestantModule && typeof window.ContestantModule.init === 'function') {
                    window.ContestantModule.init(this.elements.otherViews);
                }
            });
    },

    renderManageActivitiesView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('manage-activities');
        fetch('./manage-activities.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                this.attachManageActivitiesHandlers();
                this.loadAndRenderActivities();
            });
    },

    renderManageRoundsView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('manage-rounds');
        fetch('./manage-rounds.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                this.attachManageRoundsHandlers();
                this.renderRoundsList();
            });
    },

    renderManageSegmentsView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('manage-segments');
        fetch('./manage-segments-and-criteria.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                if (window.CompetitionModule && typeof window.CompetitionModule.initSegmentsView === 'function') {
                    window.CompetitionModule.initSegmentsView(this.state.activeEvent);
                }
            });
    },

    renderManageAwardsView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('manage-awards');
        fetch('./manage-awards.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                if (window.AwardsModule && typeof window.AwardsModule.initAwardsView === 'function') {
                    window.AwardsModule.initAwardsView(this.state.activeEvent);
                }
            });
    },

    renderRegisterJudgeView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('register-judge');
        fetch('./register-judge.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                if (window.UserManagementModule && typeof window.UserManagementModule.initJudgeView === 'function') {
                    window.UserManagementModule.initJudgeView(this.state.activeEvent);
                }
            });
    },

    attachManageRoundsHandlers() {
        const btn = document.getElementById('createRoundBtn');
        const modal = document.getElementById('roundModal');
        const overlay = modal ? modal.querySelector('.modal-overlay') : null;
        const cancelBtn = document.getElementById('cancelRound');
        const form = document.getElementById('roundForm');
        const ruleSel = document.getElementById('advRule');
        if (btn) btn.addEventListener('click', () => this.openRoundModal());
        if (overlay) overlay.addEventListener('click', () => this.closeRoundModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeRoundModal());
        if (form) form.addEventListener('submit', (e) => this.handleRoundSubmit(e));
        if (ruleSel) ruleSel.addEventListener('change', () => this.toggleTopN());
        const container = document.getElementById('roundsContainer');
        if (container) container.addEventListener('click', (e) => this.handleRoundsTableClick(e));
    },

    openRoundModal() {
        const modal = document.getElementById('roundModal');
        if (!modal) return;
        this.setRoundModalAdd();
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        const nameEl = document.getElementById('roundName');
        if (nameEl) nameEl.focus();
    },

    closeRoundModal() {
        const modal = document.getElementById('roundModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        const form = document.getElementById('roundForm');
        if (form) form.reset();
        const err = document.getElementById('roundError');
        if (err) { err.style.display = 'none'; err.textContent = ''; }
        const topN = document.getElementById('topNWrapper');
        if (topN) topN.style.display = 'none';
        ['roundName','roundOrder','advRule','topNCount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) this.setFieldInvalid(el, false);
        });
    },

    setRoundModalAdd() {
        const title = document.getElementById('roundModalTitle');
        const form = document.getElementById('roundForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        if (title) title.textContent = 'Create Round';
        if (form) form.setAttribute('data-mode', 'add');
        if (submitBtn) submitBtn.textContent = 'Create Round';
        const f = {
            name: document.getElementById('roundName'),
            desc: document.getElementById('roundDescription'),
            order: document.getElementById('roundOrder'),
            rule: document.getElementById('advRule'),
            topN: document.getElementById('topNCount'),
            topNWrapper: document.getElementById('topNWrapper'),
            aud: document.getElementById('audienceVoting')
        };
        if (f.name) f.name.value = '';
        if (f.desc) f.desc.value = '';
        if (f.order) f.order.value = '';
        if (f.rule) f.rule.value = '';
        if (f.topN) f.topN.value = '';
        if (f.topNWrapper) f.topNWrapper.style.display = 'none';
        if (f.aud) f.aud.checked = false;
    },

    setRoundModalEdit(obj) {
        const title = document.getElementById('roundModalTitle');
        const form = document.getElementById('roundForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        if (title) title.textContent = 'Edit Round';
        if (form) form.setAttribute('data-mode', 'edit');
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        const f = {
            name: document.getElementById('roundName'),
            desc: document.getElementById('roundDescription'),
            order: document.getElementById('roundOrder'),
            rule: document.getElementById('advRule'),
            topN: document.getElementById('topNCount'),
            topNWrapper: document.getElementById('topNWrapper'),
            aud: document.getElementById('audienceVoting')
        };
        if (f.name) f.name.value = obj.name || '';
        if (f.desc) f.desc.value = obj.description || '';
        if (f.order) f.order.value = obj.order || '';
        if (f.rule) f.rule.value = obj.advancement_rule || '';
        const isTopN = obj.advancement_rule === 'TopN';
        if (f.topNWrapper) f.topNWrapper.style.display = isTopN ? '' : 'none';
        if (f.topN) f.topN.value = isTopN ? (obj.top_n || 1) : '';
        if (f.aud) f.aud.checked = !!obj.audience_voting;
    },

    openRoundEditModal(id) {
        const event = this.state.activeEvent;
        const key = this.getRoundsKey(event && event.id ? event.id : 'default');
        const list = this.loadRoundsRaw(key);
        const obj = list.find(r => r.id === id);
        if (!obj) return;
        const modal = document.getElementById('roundModal');
        if (!modal) return;
        this.setRoundModalEdit(obj);
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        const nameEl = document.getElementById('roundName');
        if (nameEl) nameEl.focus();
    },

    handleRoundsTableClick(e) {
        const btn = e.target.closest('button');
        const row = e.target.closest('tr');
        if (!row || !btn) return;
        const id = row.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') this.openRoundEditModal(id);
        else if (action === 'toggle-lock') this.toggleRoundLock(id);
        else if (action === 'toggle-active') this.toggleRoundActive(id);
    },

    toggleRoundLock(id) {
        const event = this.state.activeEvent;
        const key = this.getRoundsKey(event && event.id ? event.id : 'default');
        const list = this.loadRoundsRaw(key);
        const r = list.find(x => x.id === id);
        if (!r) return;
        r.status = (r.status === 'Locked') ? 'Draft' : 'Locked';
        r.updated_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(list));
        this.renderRoundsList();
    },

    toggleRoundActive(id) {
        const event = this.state.activeEvent;
        const key = this.getRoundsKey(event && event.id ? event.id : 'default');
        const list = this.loadRoundsRaw(key);
        const r = list.find(x => x.id === id);
        if (!r) return;
        r.active = r.active === false ? true : false;
        r.updated_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(list));
        this.renderRoundsList();
    },

    toggleTopN() {
        const ruleSel = document.getElementById('advRule');
        const wrapper = document.getElementById('topNWrapper');
        if (!ruleSel || !wrapper) return;
        wrapper.style.display = ruleSel.value === 'TopN' ? '' : 'none';
        const input = document.getElementById('topNCount');
        if (input) this.setFieldInvalid(input, false);
    },

    handleRoundSubmit(e) {
        e.preventDefault();
        const nameEl = document.getElementById('roundName');
        const descEl = document.getElementById('roundDescription');
        const orderEl = document.getElementById('roundOrder');
        const ruleSel = document.getElementById('advRule');
        const topNEl = document.getElementById('topNCount');
        const audienceEl = document.getElementById('audienceVoting');
        const err = document.getElementById('roundError');
        if (!nameEl || !orderEl || !ruleSel) return;
        const fields = [
            { el: nameEl, valid: !!nameEl.value.trim() },
            { el: orderEl, valid: !!orderEl.value && parseInt(orderEl.value,10) > 0 },
            { el: ruleSel, valid: !!ruleSel.value },
            { el: topNEl, valid: ruleSel.value !== 'TopN' ? true : !!(topNEl && parseInt(topNEl.value,10) > 0) }
        ];
        let firstInvalid = null;
        fields.forEach(f => {
            if (!f.el) return;
            const invalid = !f.valid;
            this.setFieldInvalid(f.el, invalid);
            if (invalid && !firstInvalid) firstInvalid = f.el;
        });
        if (firstInvalid) {
            if (err) { err.textContent = 'Please complete all required fields.'; err.style.display = ''; }
            firstInvalid.focus();
            return;
        }
        const event = this.state.activeEvent;
        const key = this.getRoundsKey(event && event.id ? event.id : 'default');
        const list = this.loadRoundsRaw(key);
        const obj = {
            id: 'round_' + Date.now(),
            name: nameEl.value.trim(),
            description: descEl ? descEl.value.trim() : '',
            order: parseInt(orderEl.value,10),
            advancement_rule: ruleSel.value,
            top_n: ruleSel.value === 'TopN' ? parseInt(topNEl.value,10) : 1,
            audience_voting: !!(audienceEl && audienceEl.checked),
            weights: !!(audienceEl && audienceEl.checked) ? { judge: 0.8, audience: 0.2 } : { judge: 1, audience: 0 },
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            event_id: event && event.id ? event.id : 'event_default'
        };
        list.push(obj);
        localStorage.setItem(key, JSON.stringify(list));
        this.closeRoundModal();
        this.renderRoundsList();
    },

    getRoundsKey(eventId) {
        return 'bpms_rounds_' + eventId;
    },

    renderRoundsList() {
        const event = this.state.activeEvent;
        const key = this.getRoundsKey(event && event.id ? event.id : 'default');
        const list = this.loadRoundsRaw(key);
        const container = document.getElementById('roundsContainer');
        if (!container) return;
        if (!list || list.length === 0) {
                const isActive = r.active !== false;
            container.innerHTML = `<div class="empty-state"><div class="empty-state-text">No rounds yet</div></div>`;
            return;
        }
        const rows = list
            .sort((a,b) => a.order - b.order)
            .map(r => {
                const adv = r.advancement_rule === 'TopN' ? `Top ${r.top_n}` : 'Final (1)';
                const aud = r.audience_voting ? 'Enabled' : 'Disabled';
                const isActive = r.active !== false;
                const statusText = isActive ? (r.status || 'Draft') : 'Deactivated';
                const statusClass = !isActive ? 'rejected' : (r.status === 'Locked' ? 'approved' : (r.status === 'Draft' ? 'pending' : 'approved'));
                const statusBadge = `<span class="status-badge ${statusClass}">${statusText}</span>`;
                const lockLabel = r.status === 'Locked' ? 'Unlock' : 'Lock';
                const toggleLabel = isActive ? 'Deactivate' : 'Activate';
                return `<tr data-id="${r.id}">
                  <td>${r.name}</td>
                  <td>${r.order}</td>
                  <td>${adv}</td>
                  <td>${aud}</td>
                  <td>${statusBadge}</td>
                  <td>
                    <div class="row-actions">
                      <button class="table-action-btn view" data-action="edit">Edit</button>
                      <button class="table-action-btn view" data-action="toggle-lock">${lockLabel}</button>
                      <button class="table-action-btn view" data-action="toggle-active">${toggleLabel}</button>
                    </div>
                  </td>
                </tr>`;
            }).join('');
        container.innerHTML = `
          <table class="data-table" id="roundsTable">
            <thead>
              <tr>
                <th>Round name</th>
                <th>Round Order</th>
                <th>Advancement Rule</th>
                <th>Audience Voting</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`;
    },

    loadRoundsRaw(key) {
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },

    loadAndRenderRounds() {
        const event = this.state.activeEvent;
        const key = this.getRoundsKey(event && event.id ? event.id : 'default');
        const list = this.loadRoundsRaw(key);
        const container = document.getElementById('roundsContainer');
        if (!container) return;
        if (!list || list.length === 0) {
            container.innerHTML = `<div class=\"empty-state\"><div class=\"empty-state-text\">No rounds yet</div></div>`;
            return;
        }
        const rows = list
            .sort((a,b) => a.order - b.order)
            .map(r => {
                const adv = r.advancement_rule === 'TopN' ? `Top ${r.top_n}` : 'Final (1)';
                const aud = r.audience_voting ? 'Enabled' : 'Disabled';
                return `<tr>
                  <td>${r.name}</td>
                  <td>${r.order}</td>
                  <td>${adv}</td>
                  <td>${aud}</td>
                </tr>`;
            }).join('');
        container.innerHTML = `
          <table class=\"data-table\" id=\"roundsTable\">
            <thead>
              <tr>
                <th>Name</th>
                <th>Order</th>
                <th>Advancement</th>
                <th>Audience Voting</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`;
    },

    attachManageActivitiesHandlers() {
        const addBtn = document.getElementById('addActivityBtn');
        const modal = document.getElementById('activityModal');
        const overlay = modal ? modal.querySelector('.modal-overlay') : null;
        const cancelBtn = document.getElementById('cancelActivity');
        const form = document.getElementById('activityForm');
        const search = document.getElementById('activitySearch');
        const filterType = document.getElementById('filterActivityType');
        const filterStatus = document.getElementById('filterActivityStatus');
        const sortBy = document.getElementById('sortActivityBy');
        const typeSel = document.getElementById('activityType');
        if (addBtn) addBtn.addEventListener('click', () => this.openActivityModal());
        if (overlay) overlay.addEventListener('click', () => this.closeActivityModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeActivityModal());
        if (form) form.addEventListener('submit', (e) => this.handleActivitySubmit(e));
        if (search) search.addEventListener('input', () => this.loadAndRenderActivities());
        if (filterType) filterType.addEventListener('change', () => this.loadAndRenderActivities());
        if (filterStatus) filterStatus.addEventListener('change', () => this.loadAndRenderActivities());
        if (sortBy) sortBy.addEventListener('change', () => this.loadAndRenderActivities());
        if (typeSel) typeSel.addEventListener('change', () => this.toggleCustomType());
        const sd = document.getElementById('activityStartDate');
        const st = document.getElementById('activityStartTime');
        const ed = document.getElementById('activityEndDate');
        const et = document.getElementById('activityEndTime');
        const addrEl = document.getElementById('activityAddress');
        const typeCustomEl = document.getElementById('activityTypeCustom');
        const statusEl = document.getElementById('activityStatus');
        [sd, st, ed, et].forEach(el => {
            if (el) {
                el.addEventListener('input', () => this.updateConflictWarning());
                el.addEventListener('change', () => this.updateConflictWarning());
                el.addEventListener('input', () => this.setFieldInvalid(el, false));
                el.addEventListener('change', () => this.setFieldInvalid(el, false));
            }
        });
        [addrEl, statusEl].forEach(el => {
            if (el) {
                el.addEventListener('input', () => this.setFieldInvalid(el, false));
                el.addEventListener('change', () => this.setFieldInvalid(el, false));
            }
        });
        if (typeSel) {
            typeSel.addEventListener('change', () => {
                this.setFieldInvalid(typeSel, false);
                const custom = document.getElementById('activityTypeCustom');
                if (custom) this.setFieldInvalid(custom, false);
            });
        }
        const tbody = document.getElementById('activitiesTbody');
        if (tbody) tbody.addEventListener('click', (e) => this.handleActivitiesTableClick(e));
    },

    openActivityModal() {
        const modal = document.getElementById('activityModal');
        if (!modal) return;
        this.setActivityModalAdd();
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        const typeSel = document.getElementById('activityType');
        if (typeSel) typeSel.focus();
        this.updateConflictWarning();
    },

    closeActivityModal() {
        const modal = document.getElementById('activityModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        const form = document.getElementById('activityForm');
        if (form) form.reset();
        const warn = document.getElementById('activityConflictWarning');
        if (warn) { warn.style.display = 'none'; warn.textContent = ''; }
    },

    getActivitiesKey(eventId) {
        return 'bpms_activities_' + eventId;
    },

    loadActivitiesRaw(key) {
        const raw = localStorage.getItem(key);
        try { return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
    },

    loadAndRenderActivities() {
        const event = this.state.activeEvent;
        const key = this.getActivitiesKey(event && event.id ? event.id : 'default');
        const list = this.loadActivitiesRaw(key);
        const filtered = this.applyActivityFilters(list);
        this.renderActivitiesTable(filtered);
    },

    applyActivityFilters(list) {
        const search = document.getElementById('activitySearch');
        const typeSel = document.getElementById('filterActivityType');
        const statusSel = document.getElementById('filterActivityStatus');
        const sortSel = document.getElementById('sortActivityBy');
        let res = list.slice();
        const s = search && search.value ? search.value.toLowerCase() : '';
        if (s) res = res.filter(a => (a.title||'').toLowerCase().includes(s) || (a.address||'').toLowerCase().includes(s));
        const t = typeSel && typeSel.value ? typeSel.value : '';
        if (t) res = res.filter(a => a.type === t);
        const st = statusSel && statusSel.value ? statusSel.value : '';
        if (st) res = res.filter(a => a.status === st);
        const sort = sortSel ? sortSel.value : 'start_asc';
        res.sort((a,b) => {
            const as = a.start ? new Date(a.start).getTime() : 0;
            const bs = b.start ? new Date(b.start).getTime() : 0;
            return sort === 'start_desc' ? bs - as : as - bs;
        });
        return res;
    },

    renderActivitiesTable(list) {
        const tbody = document.getElementById('activitiesTbody');
        if (!tbody) return;
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><div class="empty-state-text">No activities yet</div></td></tr>`;
            return;
        }
        const rows = list.map(a => {
            const statusClass = a.status === 'Confirmed' || a.status === 'Completed' ? 'approved' : (a.status === 'Rescheduled' ? 'pending' : (a.status === 'Cancelled' ? 'rejected' : ''));
            const statusBadge = `<span class=\"status-badge ${statusClass}\">${a.status}</span>`;
            const startStr = a.start ? new Date(a.start).toLocaleString() : '-';
            const endStr = a.end ? new Date(a.end).toLocaleString() : '-';
            const aud = `${a.audience && a.audience.contestants ? 'Contestants' : ''}${a.audience && a.audience.judges ? (a.audience && a.audience.contestants ? ', ' : '') + 'Judges' : ''}` || 'Event Manager';
            return `
              <tr data-id=\"${a.id}\">
                <td>${a.title||'-'}</td>
                <td>${a.type||'-'}</td>
                <td>${statusBadge}</td>
                <td>${startStr}</td>
                <td>${endStr}</td>
                <td>${a.venue||'-'}</td>
                <td>${aud}</td>
                <td>
                  <div class=\"row-actions\">
                    <button class=\"table-action-btn view\" data-action=\"edit\">Edit</button>
                    <button class=\"table-action-btn view\" data-action=\"complete\">Mark Completed</button>
                    <button class=\"table-action-btn view\" data-action=\"cancel\">Cancel</button>
                  </div>
                </td>
              </tr>`;
        }).join('');
        tbody.innerHTML = rows;
    },

    handleActivitiesTableClick(e) {
        const btn = e.target.closest('button');
        const row = e.target.closest('tr');
        if (!row || !btn) return;
        const id = row.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') this.openEditActivity(id);
        else if (action === 'complete') this.updateActivityStatus(id, 'Completed');
        else if (action === 'cancel') this.updateActivityStatus(id, 'Cancelled');
    },

    updateActivityStatus(id, status) {
        const event = this.state.activeEvent;
        const key = this.getActivitiesKey(event && event.id ? event.id : 'default');
        const list = this.loadActivitiesRaw(key);
        const a = list.find(x => x.id === id);
        if (!a) return;
        a.status = status;
        a.updated_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(list));
        this.loadAndRenderActivities();
    },

    handleActivitySubmit(e) {
        e.preventDefault();
        const form = document.getElementById('activityForm');
        const mode = form ? form.getAttribute('data-mode') : 'add';
        const typeEl = document.getElementById('activityType');
        const typeCustomEl = document.getElementById('activityTypeCustom');
        const descEl = document.getElementById('activityDescription');
        const sdEl = document.getElementById('activityStartDate');
        const stEl = document.getElementById('activityStartTime');
        const edEl = document.getElementById('activityEndDate');
        const etEl = document.getElementById('activityEndTime');
        const addrEl = document.getElementById('activityAddress');
        const statusEl = document.getElementById('activityStatus');
        const audC = document.getElementById('audContestants');
        const audJ = document.getElementById('audJudges');
        if (!typeEl || !sdEl || !stEl || !edEl || !etEl || !statusEl || !addrEl) return;
        const typeVal = (typeEl.value === 'Custom' ? (typeCustomEl ? typeCustomEl.value.trim() : '') : typeEl.value);
        const warn = document.getElementById('activityConflictWarning');
        const fieldsToCheck = [
            { el: typeEl, valid: !!typeEl.value },
            { el: typeCustomEl, valid: typeEl.value !== 'Custom' ? true : !!(typeCustomEl && typeCustomEl.value.trim()) },
            { el: sdEl, valid: !!sdEl.value },
            { el: stEl, valid: !!stEl.value },
            { el: edEl, valid: !!edEl.value },
            { el: etEl, valid: !!etEl.value },
            { el: addrEl, valid: !!addrEl.value.trim() },
            { el: statusEl, valid: !!statusEl.value }
        ];
        let firstInvalid = null;
        fieldsToCheck.forEach(f => {
            if (!f.el) return;
            const invalid = !f.valid;
            this.setFieldInvalid(f.el, invalid);
            if (invalid && !firstInvalid) firstInvalid = f.el;
        });
        if (firstInvalid) {
            if (warn) { warn.textContent = 'Please complete all fields highlighted in red.'; warn.style.display = ''; }
            firstInvalid.focus();
            return;
        }
        const start = new Date(`${sdEl.value}T${stEl.value}`);
        const end = new Date(`${edEl.value}T${etEl.value}`);
        if (end.getTime() <= start.getTime()) {
            this.setFieldInvalid(etEl, true);
            if (warn) { warn.textContent = 'End time must be after start time.'; warn.style.display = ''; }
            return;
        }
        if (!(sdEl.value && stEl.value && edEl.value && etEl.value)) return;
        const event = this.state.activeEvent;
        const key = this.getActivitiesKey(event && event.id ? event.id : 'default');
        const list = this.loadActivitiesRaw(key);
        const sameDay = (a, b) => {
            const da = new Date(a);
            const db = new Date(b);
            return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
        };
        const conflicts = list.filter(x => {
            if (!x.start || !x.end) return false;
            if (x.type !== typeVal) return false;
            if (!sameDay(x.start, start)) return false;
            const xs = new Date(x.start).getTime();
            const xe = new Date(x.end).getTime();
            const ns = start.getTime();
            const ne = end.getTime();
            return ns < xe && ne > xs;
        });
        if (conflicts.length > 0) {
            const names = conflicts.slice(0,3).map(o => o.title).join(', ');
            const extra = conflicts.length > 3 ? ', ...' : '';
            const msg = `Scheduling conflict detected with ${names}${extra}. Proceed anyway?`;
            const proceed = window.confirm(msg);
            if (!proceed) {
                if (warn) { warn.textContent = 'Scheduling conflict detected. Please edit the schedule.'; warn.style.display = ''; }
                return;
            }
        }
        if (warn) { warn.textContent = ''; warn.style.display = 'none'; }
        if (mode === 'add') {
            const id = 'activity_' + Date.now();
            const obj = {
                id,
                title: typeVal,
                type: typeVal,
                description: descEl ? descEl.value.trim() : '',
                start: start.toISOString(),
                end: end.toISOString(),
                venue: '',
                address: addrEl ? addrEl.value.trim() : '',
                status: statusEl.value,
                audience: { contestants: !!(audC && audC.checked), judges: !!(audJ && audJ.checked) },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                event_id: event && event.id ? event.id : 'event_default'
            };
            if (typeEl.value === 'Custom' && !obj.type) return;
            list.push(obj);
        } else {
            const editId = this.state.editActivityId;
            const obj = list.find(a => a.id === editId);
            if (!obj) return;
            obj.title = typeVal;
            obj.type = typeVal;
            if (typeEl.value === 'Custom' && !obj.type) return;
            obj.description = descEl ? descEl.value.trim() : '';
            obj.start = start.toISOString();
            obj.end = end.toISOString();
            obj.venue = '';
            obj.address = addrEl ? addrEl.value.trim() : '';
            obj.status = statusEl.value;
            obj.audience = { contestants: !!(audC && audC.checked), judges: !!(audJ && audJ.checked) };
            obj.updated_at = new Date().toISOString();
        }
        localStorage.setItem(key, JSON.stringify(list));
        this.closeActivityModal();
        this.loadAndRenderActivities();
    },

    setFieldInvalid(el, invalid) {
        if (!el) return;
        if (invalid) {
            el.classList.add('invalid');
            el.setAttribute('aria-invalid', 'true');
        } else {
            el.classList.remove('invalid');
            el.removeAttribute('aria-invalid');
        }
    },

    updateConflictWarning() {
        const sdEl = document.getElementById('activityStartDate');
        const stEl = document.getElementById('activityStartTime');
        const edEl = document.getElementById('activityEndDate');
        const etEl = document.getElementById('activityEndTime');
        const venueEl = document.getElementById('activityVenue');
        const warn = document.getElementById('activityConflictWarning');
        if (!sdEl || !stEl || !edEl || !etEl || !warn) return;
        if (!(sdEl.value && stEl.value && edEl.value && etEl.value)) {
            warn.textContent = '';
            warn.style.display = 'none';
            return;
        }
        const start = new Date(`${sdEl.value}T${stEl.value}`);
        const end = new Date(`${edEl.value}T${etEl.value}`);
        const event = this.state.activeEvent;
        const key = this.getActivitiesKey(event && event.id ? event.id : 'default');
        const list = this.loadActivitiesRaw(key);
        const currentId = this.state.editActivityId || null;
        const overlaps = list.filter(x => {
            if (currentId && x.id === currentId) return false;
            if (!x.start || !x.end) return false;
            const xs = new Date(x.start).getTime();
            const xe = new Date(x.end).getTime();
            const ns = start.getTime();
            const ne = end.getTime();
            return ns < xe && ne > xs;
        });
        if (overlaps.length === 0) {
            warn.textContent = '';
            warn.style.display = 'none';
            return;
        }
        const sameVenue = venueEl && venueEl.value ? overlaps.filter(o => (o.venue||'').trim().toLowerCase() === venueEl.value.trim().toLowerCase()) : [];
        const names = overlaps.slice(0,3).map(o => o.title).join(', ');
        const extra = overlaps.length > 3 ? ', ...' : '';
        const venueMsg = sameVenue.length > 0 ? ` Same venue: ${sameVenue.slice(0,3).map(o=>o.title).join(', ')}${sameVenue.length>3? ', ...':''}.` : '';
        warn.textContent = `Potential conflict: overlaps with ${names}${extra}.${venueMsg}`;
        warn.style.display = '';
    },

    toggleCustomType() {
        const typeSel = document.getElementById('activityType');
        const wrapper = document.getElementById('activityTypeCustomWrapper');
        if (!typeSel || !wrapper) return;
        wrapper.style.display = typeSel.value === 'Custom' ? '' : 'none';
    },

    openEditActivity(id) {
        const event = this.state.activeEvent;
        const key = this.getActivitiesKey(event && event.id ? event.id : 'default');
        const list = this.loadActivitiesRaw(key);
        const obj = list.find(a => a.id === id);
        if (!obj) return;
        this.setActivityModalEdit(obj);
        const modal = document.getElementById('activityModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        const typeSel = document.getElementById('activityType');
        if (typeSel) typeSel.focus();
        this.updateConflictWarning();
    },

    setActivityModalAdd() {
        this.state.editActivityId = null;
        const title = document.getElementById('activityModalTitle');
        const form = document.getElementById('activityForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        if (title) title.textContent = 'Add Activity';
        if (form) form.setAttribute('data-mode', 'add');
        if (submitBtn) submitBtn.textContent = 'Save Activity';
        const f = {
            type: document.getElementById('activityType'),
            typeCustom: document.getElementById('activityTypeCustom'),
            typeCustomWrapper: document.getElementById('activityTypeCustomWrapper'),
            desc: document.getElementById('activityDescription'),
            sd: document.getElementById('activityStartDate'),
            st: document.getElementById('activityStartTime'),
            ed: document.getElementById('activityEndDate'),
            et: document.getElementById('activityEndTime'),
            addr: document.getElementById('activityAddress'),
            status: document.getElementById('activityStatus'),
            audC: document.getElementById('audContestants'),
            audJ: document.getElementById('audJudges')
        };
        if (f.type) f.type.value = '';
        if (f.typeCustom) f.typeCustom.value = '';
        if (f.typeCustomWrapper) f.typeCustomWrapper.style.display = 'none';
        if (f.desc) f.desc.value = '';
        if (f.sd) f.sd.value = '';
        if (f.st) f.st.value = '';
        if (f.ed) f.ed.value = '';
        if (f.et) f.et.value = '';
        if (f.addr) f.addr.value = '';
        if (f.status) f.status.value = 'Planned';
        if (f.audC) f.audC.checked = false;
        if (f.audJ) f.audJ.checked = false;
    },

    setActivityModalEdit(obj) {
        this.state.editActivityId = obj.id;
        const title = document.getElementById('activityModalTitle');
        const form = document.getElementById('activityForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        if (title) title.textContent = 'Edit Activity';
        if (form) form.setAttribute('data-mode', 'edit');
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        const f = {
            type: document.getElementById('activityType'),
            typeCustom: document.getElementById('activityTypeCustom'),
            typeCustomWrapper: document.getElementById('activityTypeCustomWrapper'),
            desc: document.getElementById('activityDescription'),
            sd: document.getElementById('activityStartDate'),
            st: document.getElementById('activityStartTime'),
            ed: document.getElementById('activityEndDate'),
            et: document.getElementById('activityEndTime'),
            addr: document.getElementById('activityAddress'),
            status: document.getElementById('activityStatus'),
            audC: document.getElementById('audContestants'),
            audJ: document.getElementById('audJudges')
        };
        const predefined = ['Photoshoot','Rehearsal','Briefing','Dinner','Main Event','Custom'];
        if (f.type) {
            if (predefined.includes(obj.type)) {
                f.type.value = obj.type;
                if (f.typeCustomWrapper) f.typeCustomWrapper.style.display = obj.type === 'Custom' ? '' : 'none';
                if (f.typeCustom) f.typeCustom.value = '';
            } else {
                f.type.value = 'Custom';
                if (f.typeCustomWrapper) f.typeCustomWrapper.style.display = '';
                if (f.typeCustom) f.typeCustom.value = obj.type || '';
            }
        }
        if (f.desc) f.desc.value = obj.description || '';
        const s = obj.start ? new Date(obj.start) : null;
        const e = obj.end ? new Date(obj.end) : null;
        const pad2 = (n) => (n<10?('0'+n):''+n);
        if (s && f.sd) f.sd.value = `${s.getFullYear()}-${pad2(s.getMonth()+1)}-${pad2(s.getDate())}`;
        if (s && f.st) f.st.value = `${pad2(s.getHours())}:${pad2(s.getMinutes())}`;
        if (e && f.ed) f.ed.value = `${e.getFullYear()}-${pad2(e.getMonth()+1)}-${pad2(e.getDate())}`;
        if (e && f.et) f.et.value = `${pad2(e.getHours())}:${pad2(e.getMinutes())}`;
        if (f.addr) f.addr.value = obj.address || '';
        if (f.status) f.status.value = obj.status || 'Planned';
        if (f.audC) f.audC.checked = !!(obj.audience && obj.audience.contestants);
        if (f.audJ) f.audJ.checked = !!(obj.audience && obj.audience.judges);
    },

    renderManageOrganizersView() {
        if (!this.elements.otherViews) return;
        this.showOtherView('manage-organizers');
        fetch('./manage-organizers.html')
            .then(r => r.text())
            .then(html => {
                this.elements.otherViews.innerHTML = html;
                this.attachManageOrganizersHandlers();
                this.loadAndRenderOrganizers();
            });
    },

    attachManageOrganizersHandlers() {
        const addBtn = document.getElementById('addOrganizerBtn');
        const modal = document.getElementById('organizerModal');
        const overlay = modal ? modal.querySelector('.modal-overlay') : null;
        const cancelBtn = document.getElementById('cancelOrganizer');
        const toggleBtn = document.getElementById('togglePassword');
        const generateBtn = document.getElementById('generatePassword');
        const form = document.getElementById('organizerForm');
        const search = document.getElementById('organizerSearch');
        const filterRole = document.getElementById('filterRole');
        const filterStatus = document.getElementById('filterStatus');
        const sortBy = document.getElementById('sortBy');
        const selectAll = document.getElementById('selectAllOrganizers');
        const bulkActivate = document.getElementById('bulkActivate');
        const bulkDeactivate = document.getElementById('bulkDeactivate');
        const bulkDelete = document.getElementById('bulkDelete');

        if (addBtn) addBtn.addEventListener('click', () => this.openOrganizerModal());
        if (overlay) overlay.addEventListener('click', () => this.closeOrganizerModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeOrganizerModal());
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.togglePasswordVisibility());
        if (generateBtn) generateBtn.addEventListener('click', () => this.fillGeneratedPassword());
        if (form) form.addEventListener('submit', (e) => this.handleOrganizerSubmit(e));
        if (search) search.addEventListener('input', () => this.loadAndRenderOrganizers());
        if (filterRole) filterRole.addEventListener('change', () => this.loadAndRenderOrganizers());
        if (filterStatus) filterStatus.addEventListener('change', () => this.loadAndRenderOrganizers());
        if (sortBy) sortBy.addEventListener('change', () => this.loadAndRenderOrganizers());
        if (selectAll) selectAll.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        if (bulkActivate) bulkActivate.addEventListener('click', () => this.bulkUpdateStatus('active'));
        if (bulkDeactivate) bulkDeactivate.addEventListener('click', () => this.bulkUpdateStatus('inactive'));
        if (bulkDelete) bulkDelete.addEventListener('click', () => this.bulkDelete());
        const tbody = document.getElementById('organizersTbody');
        if (tbody) tbody.addEventListener('click', (e) => this.handleTableClick(e));
    },

    openOrganizerModal() {
        const modal = document.getElementById('organizerModal');
        if (!modal) return;
        this.setModalForAdd();
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        const email = document.getElementById('organizerEmail');
        if (email) email.focus();
    },

    closeOrganizerModal() {
        const modal = document.getElementById('organizerModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        const form = document.getElementById('organizerForm');
        if (form) form.reset();
        const strength = document.getElementById('passwordStrength');
        if (strength) strength.textContent = '';
    },

    togglePasswordVisibility() {
        const input = document.getElementById('organizerPassword');
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    fillGeneratedPassword() {
        const input = document.getElementById('organizerPassword');
        if (!input) return;
        const pwd = this.generateStrongPassword();
        input.value = pwd;
        this.updateStrengthIndicator(pwd);
    },

    updateStrengthIndicator(value) {
        const el = document.getElementById('passwordStrength');
        if (!el) return;
        let score = 0;
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        el.textContent = score >= 4 ? 'Strong' : score >= 3 ? 'Medium' : 'Weak';
    },

    generateStrongPassword() {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        const syms = '!@#$%^&*()_+{}[]<>?';
        const all = upper + lower + nums + syms;
        let r = '';
        for (let i = 0; i < 12; i++) r += all[Math.floor(Math.random() * all.length)];
        return r;
    },

    handleOrganizerSubmit(e) {
        e.preventDefault();
        const role = document.getElementById('organizerRole');
        const email = document.getElementById('organizerEmail');
        const password = document.getElementById('organizerPassword');
        const emailErr = document.getElementById('organizerEmailError');
        if (!role || !email || !password) return;
        const roleVal = role.value.trim();
        const emailVal = email.value.trim();
        const pwdVal = password.value;
        emailErr.textContent = '';
        if (!roleVal) return;
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
        if (!emailValid) {
            emailErr.textContent = 'Invalid email';
            return;
        }
        const event = this.state.activeEvent;
        const key = this.getOrganizersKey(event && event.id ? event.id : 'default');
        const list = this.loadOrganizersRaw(key);
        const form = document.getElementById('organizerForm');
        const mode = form ? form.getAttribute('data-mode') : 'add';
        if (mode === 'add') {
            if (pwdVal.length < 8) return;
            if (list.some(o => o.email.toLowerCase() === emailVal.toLowerCase())) {
                emailErr.textContent = 'Email already exists';
                return;
            }
            const id = 'organizer_' + Date.now();
            const obj = {
                id,
                email: emailVal,
                password: 'hashed_password',
                role: roleVal,
                status: 'active',
                created_at: new Date().toISOString(),
                created_by: 'event_manager',
                last_login: null,
                password_changed: false,
                event_id: event && event.id ? event.id : 'event_default'
            };
            list.push(obj);
        } else {
            const editId = this.state.editOrganizerId;
            if (!editId) return;
            if (list.some(o => o.email.toLowerCase() === emailVal.toLowerCase() && o.id !== editId)) {
                emailErr.textContent = 'Email already exists';
                return;
            }
            const obj = list.find(o => o.id === editId);
            if (!obj) return;
            obj.email = emailVal;
            obj.role = roleVal;
        }
        localStorage.setItem(key, JSON.stringify(list));
        this.closeOrganizerModal();
        this.loadAndRenderOrganizers();
    },

    getOrganizersKey(eventId) {
        return 'bpms_organizers_' + eventId;
    },

    loadOrganizersRaw(key) {
        const raw = localStorage.getItem(key);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    },

    loadAndRenderOrganizers() {
        const event = this.state.activeEvent;
        const key = this.getOrganizersKey(event && event.id ? event.id : 'default');
        const list = this.loadOrganizersRaw(key);
        const filtered = this.applyOrganizersFilters(list);
        this.renderOrganizersTable(filtered);
    },

    applyOrganizersFilters(list) {
        const search = document.getElementById('organizerSearch');
        const status = document.getElementById('filterStatus');
        const roleSel = document.getElementById('filterRole');
        const sortBy = document.getElementById('sortBy');
        let res = list.slice();
        const s = search && search.value ? search.value.toLowerCase() : '';
        if (s) {
            res = res.filter(o => (o.email && o.email.toLowerCase().includes(s)));
        }
        const role = roleSel && roleSel.value ? roleSel.value : '';
        if (role) res = res.filter(o => o.role === role);
        const st = status && status.value ? status.value : '';
        if (st) res = res.filter(o => o.status === st);
        const sort = sortBy ? sortBy.value : 'date_desc';
        res.sort((a,b) => {
            if (sort === 'name_asc') return (a.email||'').localeCompare(b.email||'');
            if (sort === 'role_asc') return (a.role||'').localeCompare(b.role||'');
            if (sort === 'status_asc') return (a.status||'').localeCompare(b.status||'');
            const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bd - ad;
        });
        return res;
    },

    renderOrganizersTable(list) {
        const tbody = document.getElementById('organizersTbody');
        if (!tbody) return;
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><div class="empty-state-text">No organizers yet</div></td></tr>`;
            return;
        }
        const rows = list.map(o => {
            const initials = (o.email||'').slice(0,2).toUpperCase();
            const roleBadge = `<span class="status-badge">${o.role}</span>`;
            const statusClass = o.status === 'active' ? 'approved' : (o.status === 'pending' ? 'pending' : '');
            const statusBadge = `<span class="status-badge ${statusClass}">${o.status.charAt(0).toUpperCase()+o.status.slice(1)}</span>`;
            const dateAdded = o.created_at ? new Date(o.created_at).toLocaleDateString() : '-';
            const lastLogin = o.last_login ? new Date(o.last_login).toLocaleDateString() : '-';
            return `
                <tr data-id="${o.id}">
                  <td><input type="checkbox" class="row-select"></td>
                  <td><div class="avatar">${initials}</div></td>
                  <td>${o.email}</td>
                  <td>${roleBadge}</td>
                  <td>${statusBadge}</td>
                  <td>${dateAdded}</td>
                  <td>${lastLogin}</td>
                  <td>
                    <div class="row-actions">
                      <button class="table-action-btn view" data-action="edit">Edit</button>
                      <button class="table-action-btn view" data-action="toggle">${o.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                    </div>
                  </td>
                </tr>`;
        }).join('');
        tbody.innerHTML = rows;
        Array.from(tbody.querySelectorAll('.row-select')).forEach(cb => cb.addEventListener('change', () => this.updateBulkActionsVisibility()));
    },

    handleTableClick(e) {
        const btn = e.target.closest('button');
        const row = e.target.closest('tr');
        if (!row) return;
        const id = row.getAttribute('data-id');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'toggle') this.toggleOrganizerStatus(id);
        else if (action === 'edit') this.editOrganizer(id);
    },

    toggleSelectAll(checked) {
        const boxes = Array.from(document.querySelectorAll('#organizersTbody .row-select'));
        boxes.forEach(b => b.checked = checked);
        this.updateBulkActionsVisibility();
    },

    selectedOrganizerIds() {
        const rows = Array.from(document.querySelectorAll('#organizersTbody tr'));
        return rows.filter(r => {
            const cb = r.querySelector('.row-select');
            return cb && cb.checked;
        }).map(r => r.getAttribute('data-id'));
    },

    updateBulkActionsVisibility() {
        const bar = document.getElementById('bulkActionsBar');
        if (!bar) return;
        const any = this.selectedOrganizerIds().length > 0;
        bar.classList.toggle('hidden', !any);
    },

    bulkUpdateStatus(next) {
        const ids = this.selectedOrganizerIds();
        if (ids.length === 0) return;
        const event = this.state.activeEvent;
        const key = this.getOrganizersKey(event && event.id ? event.id : 'default');
        const list = this.loadOrganizersRaw(key);
        ids.forEach(id => {
            const o = list.find(x => x.id === id);
            if (o) o.status = next;
        });
        localStorage.setItem(key, JSON.stringify(list));
        this.loadAndRenderOrganizers();
    },

    bulkDelete() {
        const ids = this.selectedOrganizerIds();
        if (ids.length === 0) return;
        if (!confirm('Delete selected organizers?')) return;
        const event = this.state.activeEvent;
        const key = this.getOrganizersKey(event && event.id ? event.id : 'default');
        let list = this.loadOrganizersRaw(key);
        list = list.filter(o => !ids.includes(o.id));
        localStorage.setItem(key, JSON.stringify(list));
        this.loadAndRenderOrganizers();
    },

    toggleOrganizerStatus(id) {
        const event = this.state.activeEvent;
        const key = this.getOrganizersKey(event && event.id ? event.id : 'default');
        const list = this.loadOrganizersRaw(key);
        const o = list.find(x => x.id === id);
        if (!o) return;
        if (o.status === 'active') {
            if (!confirm('Deactivate this organizer?')) return;
            o.status = 'inactive';
        } else {
            o.status = 'active';
        }
        localStorage.setItem(key, JSON.stringify(list));
        this.loadAndRenderOrganizers();
    },


    editOrganizer(id) {
        this.openEditOrganizer(id);
    },

    openEditOrganizer(id) {
        const event = this.state.activeEvent;
        const key = this.getOrganizersKey(event && event.id ? event.id : 'default');
        const list = this.loadOrganizersRaw(key);
        const obj = list.find(o => o.id === id);
        if (!obj) return;
        this.setModalForEdit(obj);
        const modal = document.getElementById('organizerModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        const email = document.getElementById('organizerEmail');
        if (email) email.focus();
    },

    setModalForAdd() {
        this.state.editOrganizerId = null;
        const title = document.getElementById('organizerModalTitle');
        const form = document.getElementById('organizerForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        const pwdInput = document.getElementById('organizerPassword');
        const pwdGroup = pwdInput ? pwdInput.closest('.form-group') : null;
        const genBtn = document.getElementById('generatePassword');
        const toggleBtn = document.getElementById('togglePassword');
        const strength = document.getElementById('passwordStrength');
        const sendCreds = document.getElementById('sendCredentials');
        const sendGroup = sendCreds ? sendCreds.closest('.form-group') : null;
        if (title) title.textContent = 'Add Organizer';
        if (form) form.setAttribute('data-mode', 'add');
        if (submitBtn) submitBtn.textContent = 'Add Organizer';
        if (pwdGroup) pwdGroup.style.display = '';
        if (genBtn) genBtn.style.display = '';
        if (toggleBtn) toggleBtn.style.display = '';
        if (strength) strength.style.display = '';
        if (sendGroup) sendGroup.style.display = '';
        const role = document.getElementById('organizerRole');
        const email = document.getElementById('organizerEmail');
        if (role) role.value = '';
        if (email) email.value = '';
        if (pwdInput) pwdInput.value = '';
    },

    setModalForEdit(obj) {
        this.state.editOrganizerId = obj.id;
        const title = document.getElementById('organizerModalTitle');
        const form = document.getElementById('organizerForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        const pwdInput = document.getElementById('organizerPassword');
        const pwdGroup = pwdInput ? pwdInput.closest('.form-group') : null;
        const genBtn = document.getElementById('generatePassword');
        const toggleBtn = document.getElementById('togglePassword');
        const strength = document.getElementById('passwordStrength');
        const sendCreds = document.getElementById('sendCredentials');
        const sendGroup = sendCreds ? sendCreds.closest('.form-group') : null;
        if (title) title.textContent = 'Edit Organizer';
        if (form) form.setAttribute('data-mode', 'edit');
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        if (pwdGroup) pwdGroup.style.display = 'none';
        if (genBtn) genBtn.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'none';
        if (strength) strength.style.display = 'none';
        if (sendGroup) sendGroup.style.display = 'none';
        const role = document.getElementById('organizerRole');
        const email = document.getElementById('organizerEmail');
        if (role) role.value = obj.role || '';
        if (email) email.value = obj.email || '';
        if (pwdInput) pwdInput.value = '';
    },

    /**
     * Handle logout
     */
    handleLogout(e) {
        e.preventDefault();
        
        // Confirm logout
        if (confirm('Are you sure you want to logout?')) {
            // Clear session data
            localStorage.removeItem('bpms_session');
            localStorage.removeItem('bpms_active_event');
            
            // Redirect to login page
            window.location.href = '../../index.html';
        }
    },

    /**
     * Handle settings click
     */
    handleSettings(e) {
        e.preventDefault();
        
        // Remove active class from all nav items
        if (this.elements.navItems && this.elements.navItems.length > 0) {
            this.elements.navItems.forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Add active class to settings
        if (this.elements.settingsButton) {
            this.elements.settingsButton.classList.add('active');
        }
        
        this.renderSectionView('Settings', 'Manage application settings');
    },

    /**
     * Handle notification icon click
     */
    handleNotificationClick() {
        console.log('Notification icon clicked');
        // TODO: Show notification dropdown/panel
        // This will be implemented when notification system is ready
    },

    /**
     * Handle profile icon click
     */
    handleProfileClick() {
        console.log('Profile icon clicked');
        // TODO: Show profile dropdown menu
        // This will be implemented when user profile system is ready
    },

};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EventManagerDashboard.init());
} else {
    EventManagerDashboard.init();
}

