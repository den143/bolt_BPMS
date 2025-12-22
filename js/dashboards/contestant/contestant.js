;(function() {
  function openInboxModal() {
    var overlay = document.getElementById('inboxModal');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeInboxModal() {
    var overlay = document.getElementById('inboxModal');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function handleContestantLogout() {
    try {
      localStorage.removeItem('bpms_session');
      localStorage.removeItem('bpms_active_event');
    } catch (e) {}
    window.location.href = '../../index.html';
  }

  window.openInboxModal = openInboxModal;
  window.closeInboxModal = closeInboxModal;
  window.handleContestantLogout = handleContestantLogout;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindModalGuards);
  } else {
    bindModalGuards();
  }

  function bindModalGuards() {
    var overlay = document.getElementById('inboxModal');
    if (!overlay) return;
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        e.stopPropagation();
      }
    });
    var content = overlay.querySelector('.modal-content');
    if (content) {
      content.addEventListener('click', function(e) {});
    }
  }
})();
