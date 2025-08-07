// Popup JavaScript - moved out of HTML to fix CSP violations
document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const loading = document.getElementById('loading');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const statusCard = document.getElementById('statusCard');
  const infoText = document.getElementById('infoText');
  const autoOverlayInfo = document.getElementById('autoOverlayInfo');

  // Check if we're on a target page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    const isTargetPage = currentUrl.includes('securemypass.com/tickets/1/') && currentUrl.includes('.html');
    
    if (isTargetPage) {
      statusIcon.textContent = '🎫';
      statusText.innerHTML = '<span class="success-text">Ticket page detected!</span><br>Auto-overlay should be visible on the page.';
      extractBtn.textContent = 'Force Manual Extraction';
      if (autoOverlayInfo) autoOverlayInfo.style.display = 'block';
    } else {
      statusIcon.textContent = '⚠️';
      statusText.innerHTML = '<span class="error-text">Not a ticket page</span><br>Navigate to a securemypass.com ticket link to use this extension.';
      extractBtn.disabled = true;
      extractBtn.textContent = 'Not Available';
      if (autoOverlayInfo) autoOverlayInfo.style.display = 'none';
      if (infoText) {
        infoText.innerHTML = '<strong>Not on a ticket page:</strong><br>Please navigate to a securemypass.com ticket URL to use this extension.';
      }
    }
  });

  function showLoading() {
    loading.style.display = 'block';
    statusCard.style.display = 'none';
    extractBtn.disabled = true;
  }

  function hideLoading() {
    loading.style.display = 'none';
    statusCard.style.display = 'block';
    extractBtn.disabled = false;
  }

  function showResult(success, message) {
    hideLoading();
    if (success) {
      statusIcon.textContent = '✅';
      statusText.innerHTML = `<span class="success-text">${message}</span>`;
    } else {
      statusIcon.textContent = '❌';
      statusText.innerHTML = `<span class="error-text">${message}</span>`;
    }
  }

  // Extract button click handler
  if (extractBtn) {
    extractBtn.addEventListener('click', function() {
      showLoading();
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // First try to show/create overlay
        chrome.tabs.sendMessage(tabs[0].id, {action: "showOverlay"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            showResult(false, 'Cannot access this page. Try refreshing and ensure you are on a ticket page.');
            return;
          }

          if (response && response.success) {
            showResult(true, response.message || 'Overlay is now visible on the page.');
          } else {
            // Fallback to ticket extraction
            chrome.tabs.sendMessage(tabs[0].id, {action: "getTicketInfo"}, function(response2) {
              if (chrome.runtime.lastError) {
                console.error('Fallback runtime error:', chrome.runtime.lastError);
                showResult(false, 'Extension cannot communicate with the page. Try refreshing.');
                return;
              }
              
              if (response2 && response2.success) {
                showResult(true, 'Ticket data found! The overlay should appear on the page.');
              } else {
                showResult(false, response2?.error || response?.error || 'No ticket data found on this page.');
              }
            });
          }
        });
      });
    });
  }
});