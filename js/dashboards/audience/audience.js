document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('profileModal');

    // --- MODAL LOGIC ---
    // Expose functions to window for onclick attributes in HTML
    window.openProfile = function(name, city, imgUrl) {
        const nameEl = document.getElementById('m-name');
        const cityEl = document.getElementById('m-city');
        const imgEl = document.getElementById('m-img');

        if(nameEl) nameEl.innerText = name;
        if(cityEl) cityEl.innerText = city;
        if(imgEl) imgEl.src = imgUrl;
        
        if(modal) modal.classList.add('active');
    };

    window.closeModal = function() {
        if(modal) modal.classList.remove('active');
    };

    // Close on background click
    if(modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeModal();
        });
    }

    // --- LOGOUT LOGIC ---
    const logoutModal = document.getElementById('logoutModal');

    window.openLogoutModal = function() {
        if(logoutModal) logoutModal.classList.add('active');
    };

    window.closeLogoutModal = function() {
        if(logoutModal) logoutModal.classList.remove('active');
    };

    window.confirmLogout = function() {
        // Redirect to login/index page
        window.location.href = '../../index.html';
    };

    // Close logout modal on background click
    if(logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) window.closeLogoutModal();
        });
    }

    // --- VOTE LOGIC ---
    window.castVote = function(event, btnElement, contestantName) {
        // Stop the click from propagating to the card (which would open the profile)
        if (event) event.stopPropagation();

        if (btnElement.classList.contains('voted')) {
            return; // Do nothing if already voted
        }

        // Change Button Appearance
        btnElement.classList.add('voted');
        btnElement.innerHTML = '<i class="fas fa-check-circle"></i> VOTED';
        
        // Placeholder for actual vote logic (e.g., API call)
        console.log(`Vote cast for: ${contestantName}`);
    };
});
