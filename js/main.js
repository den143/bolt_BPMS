/**
 * BPMS - Beauty Pageant Management System
 * Main JavaScript File
 * Pure Vanilla JavaScript - No frameworks
 */

'use strict';

/**
 * Main Application Object
 * Encapsulates all functionality to avoid global namespace pollution
 */
const BPMS = {
    // Application state
    state: {
        isFormSubmitting: false,
        passwordVisible: false
    },

    // Demo credentials for validation
    demoAccounts: [
        { email: 'eventmanager@gmail.com', password: 'password123', role: 'Event Manager' },
        { email: 'judgecoordinator@gmail.com', password: 'password123', role: 'Judge Coordinator' },
        { email: 'contestantmanager@gmail.com', password: 'password123', role: 'Contestant Manager' },
        { email: 'tabulator@gmail.com', password: 'password123', role: 'Tabulator' },
        { email: 'judge@gmail.com', password: 'password123', role: 'Judge' },
        { email: 'contestant@gmail.com', password: 'password123', role: 'Contestant' },
        { email: 'audience@gmail.com', password: 'password123', role: 'Audience' }
    ],

    // DOM element cache
    elements: {},

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.setupFormValidation();
        console.log('BPMS Application Initialized');
    },

    /**
     * Cache frequently accessed DOM elements
     * Also prints a quick diagnostics log so we can spot missing elements
     */
    cacheElements() {
        this.elements = {
            signinForm: document.getElementById('signinForm'),
            roleInput: document.getElementById('role'),
            emailInput: document.getElementById('email'),
            passwordInput: document.getElementById('password'),
            togglePasswordBtn: document.getElementById('togglePassword'),
            emailError: document.getElementById('emailError'),
            passwordError: document.getElementById('passwordError'),
            roleError: document.getElementById('roleError'),
            ticketCodeInput: document.getElementById('ticketCode'),
            ticketCodeError: document.getElementById('ticketCodeError'),
            submitButton: document.querySelector('.submit-button'),
            eyeIcon: document.querySelector('.eye-icon'),
            eyeOffIcon: document.querySelector('.eye-off-icon'),
            // New modal elements
            signUpLink: document.getElementById('signUpLink'),
            forgotPasswordLink: document.getElementById('forgotPasswordLink'),
            signUpModal: document.getElementById('signUpModal'),
            forgotPasswordModal: document.getElementById('forgotPasswordModal'),
            signUpForm: document.getElementById('signUpForm'),
            forgotPasswordForm: document.getElementById('forgotPasswordForm'),
            closeSignUpModal: document.getElementById('closeSignUpModal'),
            closeForgotPasswordModal: document.getElementById('closeForgotPasswordModal')
        };

        // Diagnostics: log missing elements to console for debugging
        const missing = Object.entries(this.elements).filter(([k, v]) => !v).map(([k]) => k);
        if (missing.length) {
            console.warn('BPMS: Some elements could not be found during cache:', missing.join(', '));
        } else {
            console.log('BPMS: All key elements cached successfully');
        }
    },

    /**
     * Attach event listeners to interactive elements
     */
    attachEventListeners() {
        // Form submission
        if (this.elements.signinForm) {
            this.elements.signinForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Password toggle
        if (this.elements.togglePasswordBtn) {
            this.elements.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Real-time validation
        if (this.elements.emailInput) {
            this.elements.emailInput.addEventListener('blur', () => this.validateEmail());
            this.elements.emailInput.addEventListener('input', () => this.clearError('email'));
        }
        
        if (this.elements.passwordInput) {
            this.elements.passwordInput.addEventListener('blur', () => this.validatePassword());
            this.elements.passwordInput.addEventListener('input', () => this.clearError('password'));
        }
        
        if (this.elements.roleInput) {
            this.elements.roleInput.addEventListener('blur', () => this.validateRole());
            this.elements.roleInput.addEventListener('change', () => this.clearError('role'));
            this.elements.roleInput.addEventListener('change', (e) => this.handleRoleChange(e));
        }

        // Keyboard accessibility for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.signUpModal && !this.elements.signUpModal.classList.contains('hidden')) this.closeSignUpModal();
                if (this.elements.forgotPasswordModal && !this.elements.forgotPasswordModal.classList.contains('hidden')) this.closeForgotPasswordModal();
            }
        });

        // Sign Up and Forgot Password modal links
        if (this.elements.signUpLink) {
            this.elements.signUpLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSignUpModal();
            });
        }

        if (this.elements.forgotPasswordLink) {
            this.elements.forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openForgotPasswordModal();
            });
        }

        // Modal close buttons
        if (this.elements.closeSignUpModal) {
            this.elements.closeSignUpModal.addEventListener('click', () => this.closeSignUpModal());
        }

        if (this.elements.closeForgotPasswordModal) {
            this.elements.closeForgotPasswordModal.addEventListener('click', () => this.closeForgotPasswordModal());
        }

        // Modal overlay clicks
        if (this.elements.signUpModal) {
            this.elements.signUpModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeSignUpModal();
                }
            });
        }

        if (this.elements.forgotPasswordModal) {
            this.elements.forgotPasswordModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeForgotPasswordModal();
                }
            });
        }

        // Form submissions
        if (this.elements.signUpForm) {
            this.elements.signUpForm.addEventListener('submit', (e) => this.handleSignUpSubmit(e));
        }

        if (this.elements.forgotPasswordForm) {
            this.elements.forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPasswordSubmit(e));
        }

        // Demo account quick fill (click on demo emails)
        this.attachDemoAccountListeners();


    },

    /**
     * Setup form validation rules
     */
    setupFormValidation() {
        // Add HTML5 validation attributes programmatically if needed
        if (this.elements.emailInput) {
            this.elements.emailInput.setAttribute('autocomplete', 'email');
        }
        if (this.elements.passwordInput) {
            this.elements.passwordInput.setAttribute('autocomplete', 'current-password');
        }
    },

    /**
     * Shared email validation utility
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    },

    /**
     * Shared password validation utility
     * @param {string} password - Password to validate
     * @param {number} minLength - Minimum length (default: 6)
     * @returns {boolean} - Whether password is valid
     */
    isValidPassword(password, minLength = 6) {
        return password && password.length >= minLength;
    },

    handleRoleChange(e) {
        const role = e.target.value;
        const ticketCodeGroup = document.getElementById('ticketCodeGroup');
        const emailGroup = document.getElementById('emailGroup');
        const passwordGroup = document.getElementById('passwordGroup');

        if (role === 'Audience') {
            ticketCodeGroup.style.display = 'block';
            emailGroup.style.display = 'none';
            passwordGroup.style.display = 'none';
        } else {
            ticketCodeGroup.style.display = 'none';
            emailGroup.style.display = 'block';
            passwordGroup.style.display = 'block';
        }
    },

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    handleFormSubmit(e) {
        e.preventDefault();

        // Prevent double submission
        if (this.state.isFormSubmitting) {
            return;
        }
        const role = this.elements.roleInput ? this.elements.roleInput.value : '';

        if(role === 'Audience'){
            const isTicketCodeValid = this.validateTicketCode();
            if(!isTicketCodeValid){
                return;
            }
        }
        else{
            // Validate all fields
            const isEmailValid = this.validateEmail();
            const isPasswordValid = this.validatePassword();
            const isRoleValid = this.validateRole();

            if (!isEmailValid || !isPasswordValid || !isRoleValid) {
                return;
            }
        }


        // Get form values
        const email = this.elements.emailInput ? this.elements.emailInput.value.trim() : '';
        const password = this.elements.passwordInput ? this.elements.passwordInput.value : '';
        const ticketCode = this.elements.ticketCodeInput ? this.elements.ticketCodeInput.value.trim() : '';
        

        if(role !== 'Audience' && (!email || !password)) {
            console.error('BPMS: Email or password input not found');
            return;
        }

        // Authenticate user
        this.authenticateUser(email, password, role, ticketCode);
    },

    validateTicketCode() {
        if (!this.elements.ticketCodeInput) {
            return false;
        }

        const ticketCode = this.elements.ticketCodeInput.value.trim();

        if (!ticketCode) {
            this.showError('ticketCode', 'Ticket code is required');
            return false;
        }

        this.clearError('ticketCode');
        return true;
    },

    /**
     * Validate email field
     * @returns {boolean} - Whether email is valid
     */
    validateEmail() {
        if (!this.elements.emailInput) {
            return false;
        }

        const email = this.elements.emailInput.value.trim();

        if (!email) {
            this.showError('email', 'Email is required');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearError('email');
        return true;
    },

    /**
     * Validate password field
     * @returns {boolean} - Whether password is valid
     */
    validatePassword() {
        if (!this.elements.passwordInput) {
            return false;
        }

        const password = this.elements.passwordInput.value;

        if (!password) {
            this.showError('password', 'Password is required');
            return false;
        }

        if (!this.isValidPassword(password)) {
            this.showError('password', 'Password must be at least 6 characters');
            return false;
        }

        this.clearError('password');
        return true;
    },

    /**
     * Show validation error
     * @param {string} field - Field name (email, password, or role)
     * @param {string} message - Error message
     */
    showError(field, message) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        if (!input || !errorElement) {
            console.warn(`BPMS: Cannot show error for field "${field}" - element not found`);
            return;
        }

        input.classList.add('error');
        errorElement.textContent = message;

        // Announce error to screen readers
        input.setAttribute('aria-invalid', 'true');
        errorElement.setAttribute('role', 'alert');
    },

    /**
     * Clear validation error
     * @param {string} field - Field name (email, password, or role)
     */
    clearError(field) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        if (!input || !errorElement) {
            return; // Silently return if elements don't exist
        }

        input.classList.remove('error');
        errorElement.textContent = '';

        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'false');
        errorElement.removeAttribute('role');
    },

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        if (!this.elements.passwordInput || !this.elements.togglePasswordBtn) {
            return;
        }

        this.state.passwordVisible = !this.state.passwordVisible;
        const type = this.state.passwordVisible ? 'text' : 'password';

        this.elements.passwordInput.type = type;

        // Toggle icon visibility
        if (this.elements.eyeIcon) {
            this.elements.eyeIcon.classList.toggle('hidden');
        }
        if (this.elements.eyeOffIcon) {
            this.elements.eyeOffIcon.classList.toggle('hidden');
        }

        // Update ARIA label
        const label = this.state.passwordVisible ? 'Hide password' : 'Show password';
        this.elements.togglePasswordBtn.setAttribute('aria-label', label);

        // Keep focus on password field
        this.elements.passwordInput.focus();
    },

    /**
     * Authenticate user with demo accounts
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} role - User role (optional)
     */
    authenticateUser(email, password, role, ticketCode) {
        // Set submitting state
        if (this.elements.submitButton) {
            this.state.isFormSubmitting = true;
            this.elements.submitButton.disabled = true;
            this.elements.submitButton.textContent = 'Signing in...';
        }

        // Simulate API call with setTimeout
        setTimeout(() => {
            if(role === 'Audience'){
                if (ticketCode === 'password123') {
                    this.handleSuccessfulLogin({role: 'Audience'});
                } else {
                    this.handleFailedLogin();
                    this.showError('ticketCode', 'Invalid ticket code');
                }
            }
            else{
                // Check against demo accounts (role is required)
                const account = this.demoAccounts.find(
                    acc => acc.email.toLowerCase() === email.toLowerCase() && 
                           acc.password === password && 
                           acc.role.toLowerCase() === role.toLowerCase()
                );

                if (account) {
                    // Successful login
                    this.handleSuccessfulLogin(account);
                } else {
                    // Failed login
                    this.handleFailedLogin(email);
                }
            }


            // Reset submitting state
            this.state.isFormSubmitting = false;
            if (this.elements.submitButton) {
                this.elements.submitButton.disabled = false;
                this.elements.submitButton.textContent = 'Sign In';
            }
        }, 1000);
    },


    /**
     * Handle successful login
     * @param {Object} account - User account object
     */
    handleSuccessfulLogin(account) {
        if(account.email){
            console.log('Login successful:', account.email, 'Role:', account.role);
            // Store user session in localStorage
            const session = {
                email: account.email,
                role: account.role,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('bpms_session', JSON.stringify(session));
        }
        else{
            console.log('Login successful: Audience');
        }


        // Clear form
        if (this.elements.signinForm) {
            this.elements.signinForm.reset();
        }

        // Redirect to appropriate dashboard based on role
        const roleMap = {
            'Event Manager': 'event-manager',
            'Judge Coordinator': 'judge-coordinator',
            'Contestant Manager': 'contestant-manager',
            'Tabulator': 'tabulator',
            'Judge': 'judge',
            'Contestant': 'contestant',
            'Audience': 'audience'
        };

        const dashboardPath = roleMap[account.role] || 'event-manager';
        // Redirect to appropriate dashboard
        setTimeout(() => {
            window.location.href = `dashboards/${dashboardPath}/${dashboardPath}.html`; 
        }, 1500);
        
        // Show inline success message before redirect
        this.showSuccessMessage('Sign In Successful! Redirecting to dashboard...');
    },

    /**
     * Handle failed login
     * @param {string} email - Attempted email
     */
    handleFailedLogin(email) {
        console.log('Login failed for:', email);

        // Show error message
        this.showError('password', 'Invalid email or password');

        // Add shake animation to form
        if (this.elements.signinForm) {
            this.elements.signinForm.classList.add('shake-animation');
            setTimeout(() => {
                this.elements.signinForm.classList.remove('shake-animation');
            }, 500);
        }
    },

    /**
     * Show inline success message
     * @param {string} message - Success message to display
     */
    showSuccessMessage(message) {
        // Create or get success message element
        let successMsg = document.getElementById('successMessage');
        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.id = 'successMessage';
            successMsg.className = 'success-message';
            if (this.elements.signinForm) {
                this.elements.signinForm.insertBefore(successMsg, this.elements.signinForm.firstChild);
            }
        }

        successMsg.textContent = message;
        successMsg.style.display = 'block';
        successMsg.setAttribute('role', 'alert');

        // Hide after 3 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    },

    /**
     * Validate role field
     * @returns {boolean} - Whether role is valid
     */
    validateRole() {
        if (!this.elements.roleInput) {
            return false;
        }
        
        const role = this.elements.roleInput.value.trim();
        if (!role) {
            this.showError('role', 'Please select a role');
            return false;
        }
        this.clearError('role');
        return true;
    },




    /**
     * Attach click listeners to demo account emails for quick fill
     */
    attachDemoAccountListeners() {
        const demoEmails = document.querySelectorAll('.demo-email');

        demoEmails.forEach((emailElement, index) => {
            emailElement.style.cursor = 'pointer';
            emailElement.style.transition = 'color 0.2s ease';

            emailElement.addEventListener('click', () => {
                const account = this.demoAccounts[index];
                this.fillDemoAccount(account);
            });

            emailElement.addEventListener('mouseenter', () => {
                emailElement.style.color = 'var(--color-primary)';
            });

            emailElement.addEventListener('mouseleave', () => {
                emailElement.style.color = '';
            });
        });
    },

    /**
     * Fill form with demo account credentials
     * @param {Object} account - Demo account object
     */
    fillDemoAccount(account) {
        if (!this.elements.emailInput || !this.elements.passwordInput) {
            console.warn('BPMS: Cannot fill demo account - inputs not found');
            return;
        }

        this.elements.emailInput.value = account.email;
        this.elements.passwordInput.value = account.password;
        if (this.elements.roleInput) {
            this.elements.roleInput.value = account.role;
        }

        // Clear any existing errors
        this.clearError('email');
        this.clearError('password');
        this.clearError('role');

        // Add visual feedback using CSS classes
        this.elements.emailInput.classList.add('demo-fill-highlight');
        this.elements.passwordInput.classList.add('demo-fill-highlight');

        setTimeout(() => {
            this.elements.emailInput.classList.remove('demo-fill-highlight');
            this.elements.passwordInput.classList.remove('demo-fill-highlight');
        }, 500);

        // Focus on submit button
        if (this.elements.submitButton) {
            this.elements.submitButton.focus();
        }

        console.log('Demo account filled:', account.role);
    },

    /**
     * Utility function to check if user is logged in
     * @returns {Object|null} - Session object or null
     */
    getSession() {
        const sessionData = localStorage.getItem('bpms_session');
        return sessionData ? JSON.parse(sessionData) : null;
    },

    /**
     * Utility function to logout user
     */
    logout() {
        localStorage.removeItem('bpms_session');
        console.log('User logged out');
    },

    /**
     * Open Sign Up modal
     */
    openSignUpModal() {
        if (this.elements.signUpModal) {
            this.elements.signUpModal.classList.remove('hidden');
            this.elements.signUpModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            const firstInput = this.elements.signUpForm.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },

    /**
     * Close Sign Up modal
     */
    closeSignUpModal() {
        if (this.elements.signUpModal) {
            this.elements.signUpModal.classList.add('hidden');
            this.elements.signUpModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            
            // Reset form
            if (this.elements.signUpForm) {
                this.elements.signUpForm.reset();
            }
        }
    },

    /**
     * Open Forgot Password modal
     */
    openForgotPasswordModal() {
        if (this.elements.forgotPasswordModal) {
            this.elements.forgotPasswordModal.classList.remove('hidden');
            this.elements.forgotPasswordModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            // Focus on email input
            const emailInput = document.getElementById('forgotEmail');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }
        }
    },

    /**
     * Close Forgot Password modal
     */
    closeForgotPasswordModal() {
        if (this.elements.forgotPasswordModal) {
            this.elements.forgotPasswordModal.classList.add('hidden');
            this.elements.forgotPasswordModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            
            // Reset form
            if (this.elements.forgotPasswordForm) {
                this.elements.forgotPasswordForm.reset();
            }
        }
    },

    /**
     * Handle Sign Up form submission
     */
    handleSignUpSubmit(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('signUpEmail');
        const roleInput = document.getElementById('signUpRole');
        const passwordInput = document.getElementById('signUpPassword');
        const emailError = document.getElementById('signUpEmailError');
        const roleError = document.getElementById('signUpRoleError');
        const passwordError = document.getElementById('signUpPasswordError');
        
        // Check if all elements exist
        if (!emailInput || !roleInput || !passwordInput || !emailError || !roleError || !passwordError) {
            console.error('BPMS: Sign up form elements not found');
            return;
        }
        
        // Clear previous errors
        emailError.textContent = '';
        roleError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('error');
        roleInput.classList.remove('error');
        passwordInput.classList.remove('error');
        
        let isValid = true;
        
        // Validate email
        if (!emailInput.value.trim()) {
            emailError.textContent = 'Email is required';
            emailInput.classList.add('error');
            isValid = false;
        } else if (!BPMS.isValidEmail(emailInput.value.trim())) {
            emailError.textContent = 'Please enter a valid email address';
            emailInput.classList.add('error');
            isValid = false;
        }
        
        // Validate role
        const allowedRoles = ['Event Manager', 'Contestant', 'Audience'];
        const selectedRole = roleInput.value.trim();
        if (!selectedRole) {
            roleError.textContent = 'Please select a role';
            roleInput.classList.add('error');
            isValid = false;
        } else if (!allowedRoles.includes(selectedRole)) {
            roleError.textContent = 'This role cannot be self-registered. Please contact Event Manager.';
            roleInput.classList.add('error');
            isValid = false;
        }
        
        // Validate password
        if (!passwordInput.value) {
            passwordError.textContent = 'Password is required';
            passwordInput.classList.add('error');
            isValid = false;
        } else if (!BPMS.isValidPassword(passwordInput.value)) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordInput.classList.add('error');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Simulate account creation
        console.log('Sign up submitted:', {
            email: emailInput.value.trim(),
            role: selectedRole
        });
        
        // Show success message
        alert(`Account created successfully! You can now sign in as ${selectedRole}.`);
        
        // Close modal and reset form
        this.closeSignUpModal();
    },

    /**
     * Handle Forgot Password form submission
     */
    handleForgotPasswordSubmit(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('forgotEmail');
        const emailError = document.getElementById('forgotEmailError');
        
        // Check if elements exist
        if (!emailInput || !emailError) {
            console.error('BPMS: Forgot password form elements not found');
            return;
        }
        
        // Clear previous error
        emailError.textContent = '';
        emailInput.classList.remove('error');
        
        // Validate email
        if (!emailInput.value.trim()) {
            emailError.textContent = 'Email is required';
            emailInput.classList.add('error');
            return;
        }
        
        if (!BPMS.isValidEmail(emailInput.value.trim())) {
            emailError.textContent = 'Please enter a valid email address';
            emailInput.classList.add('error');
            return;
        }
        
        // Simulate sending reset link
        console.log('Password reset requested for:', emailInput.value.trim());
        
        // Show success message
        alert('Password reset link has been sent to your email!');
        
        // Close modal and reset form
        this.closeForgotPasswordModal();
    }
};

/**
 * Feature Card Animation on Scroll
 */
const AnimationController = {
    init() {
        this.setupIntersectionObserver();
    },

    setupIntersectionObserver() {
        // Check if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, skipping animation');
            return;
        }

        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    
                    // Use requestAnimationFrame for smoother animation
                    requestAnimationFrame(() => {
                        card.classList.add('fade-in-up');
                    });

                    // Unobserve after animation starts
                    observer.unobserve(card);
                }
            });
        }, options);

        const featureCards = document.querySelectorAll('.feature-card');
        if (featureCards.length === 0) {
            return; // No cards to animate
        }

        featureCards.forEach((card, index) => {
            // Set initial state and delay via CSS custom property
            card.style.setProperty('--animation-delay', `${index * 0.1}s`);
            observer.observe(card);
        });
    }
};

/**
 * Performance Monitoring (Development Only)
 */
const PerformanceMonitor = {
    init() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = window.performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    console.log(`Page Load Time: ${loadTime}ms`);
                }, 0);
            });
        }
    }
};

/**
 * Add shake animation to CSS dynamically (now handled in CSS file, but kept for backwards compatibility)
 * @deprecated - Animation is now in CSS file, this function does nothing
 */
const addShakeAnimation = () => {
    // Animation is now in CSS file, no need to add dynamically
    // Keeping function for backwards compatibility
};

/**
 * Initialize application when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        BPMS.init();
        AnimationController.init();
        PerformanceMonitor.init();
        addShakeAnimation();
    });
} else {
    BPMS.init();
    AnimationController.init();
    PerformanceMonitor.init();
    addShakeAnimation();
}

/**
 * Export BPMS object for potential use in other scripts
 * (Only works with module systems, included for future extensibility)
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BPMS;
}
