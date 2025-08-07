// Enhanced content script with auto-overlay functionality
class TicketExtractor {
  constructor() {
    this.ticketData = null;
    this.overlay = null;
    this.currentTicketIndex = 0;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isDarkMode = false;
    this.navigationSelector = null;
    
    // Only run on the specific URL pattern
    if (this.isTargetPage()) {
      this.init();
    }
  }

  isTargetPage() {
    const url = window.location.href;
    return url.includes('securemypass.com/tickets/1/') && url.includes('.html');
  }

  async init() {
    console.log('Ticket Extractor: Initializing on target page');
    
    // Initialize dark mode from localStorage or system preference
    this.initializeDarkMode();
    
    // Wait for page to fully load and Vue app to initialize
    await this.waitForTicketData();
    
    if (this.ticketData) {
      this.detectCurrentTicket();
      
      // Give page extra time to load navigation elements
      setTimeout(() => {
        this.detectNavigationElements();
      }, 1000);
      
      this.createOverlay();
      this.setupTicketChangeListener();
    }
  }

  initializeDarkMode() {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('ticket-extractor-theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
      console.log(`Loaded saved theme: ${savedTheme}`);
    } else {
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log(`Using system theme: ${this.isDarkMode ? 'dark' : 'light'}`);
    }
  }

  toggleDarkMode() {
    console.log(`Toggle dark mode called. Current state: ${this.isDarkMode}`);
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('ticket-extractor-theme', this.isDarkMode ? 'dark' : 'light');
    console.log(`Dark mode toggled to: ${this.isDarkMode}`);
    
    if (this.overlay) {
      if (this.isDarkMode) {
        this.overlay.classList.add('dark-mode');
        console.log('Added dark-mode class to overlay');
      } else {
        this.overlay.classList.remove('dark-mode');
        console.log('Removed dark-mode class from overlay');
      }
      
      // Update theme toggle icon
      const themeToggle = this.overlay.querySelector('.theme-toggle');
      if (themeToggle) {
        themeToggle.textContent = this.isDarkMode ? '☀️' : '🌙';
        console.log(`Updated toggle icon to: ${themeToggle.textContent}`);
      } else {
        console.log('Could not find theme toggle button');
      }
    } else {
      console.log('No overlay found when toggling theme');
    }
  }

  detectNavigationElements() {
    // Based on Python script logic
    const isBarcodeless = this.ticketData?.barcodelessLink !== false; // Default to true if undefined
    
    console.log(`Detecting navigation elements (barcodeless: ${isBarcodeless})`);
    
    if (isBarcodeless) {
      // Look for barcodeless navigation elements
      const selectors = [
        ".right-left .sc-hizQCF.kNbQc",
        ".right-left .sc-cgHJcJ", 
        "div.sc-hizQCF.kNbQc",
        ".sc-cgHJcJ"
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length >= 2) { // Need at least 2 for left/right navigation
          this.navigationSelector = selector;
          console.log(`Found barcodeless navigation: ${selector} (${elements.length} elements)`);
          break;
        }
      }
    } else {
      // Look for barcoded navigation elements  
      const selectors = [
        "footer div.arrow",
        "div.arrow",
        ".arrow"
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length >= 1) {
          this.navigationSelector = selector;
          console.log(`Found barcoded navigation: ${selector} (${elements.length} elements)`);
          break;
        }
      }
    }
    
    // Also check for position text to confirm multi-ticket
    if (this.navigationSelector && !this.checkForPositionText()) {
      console.log('Navigation elements found but no position text - might be single ticket');
      // Don't clear navigationSelector - might still be useful
    }
    
    // Final verification - check if we have actual position data
    const position = this.extractPositionText();
    if (position && position.total > 1) {
      console.log(`Multi-ticket confirmed: ${position.current} of ${position.total}`);
    } else if (position && position.total === 1) {
      console.log('Single ticket confirmed');
      this.navigationSelector = null; // No navigation needed for single ticket
    }
  }

  checkForPositionText() {
    const xpathSelectors = [
      "//span[contains(text(), ' of ')]",
      "//span[contains(text(), ' OF ')]", 
      "//div[contains(@class, 'right-left')]//span",
      "//footer//span[contains(text(), 'of')]"
    ];
    
    for (const xpath of xpathSelectors) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        const text = result.singleNodeValue.textContent;
        if (/\d+\s*of\s*\d+/i.test(text)) {
          console.log(`Found position text: ${text}`);
          return true;
        }
      }
    }
    
    return false;
  }

  extractPositionText() {
    const xpathSelectors = [
      "//span[contains(text(), ' of ')]",
      "//span[contains(text(), ' OF ')]",
      "//div[contains(@class, 'right-left')]//span", 
      "//footer//span[contains(text(), 'of')]"
    ];
    
    for (const xpath of xpathSelectors) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        const text = result.singleNodeValue.textContent.trim();
        const match = text.match(/(\d+)\s*of\s*(\d+)/i);
        if (match) {
          return {
            current: parseInt(match[1]),
            total: parseInt(match[2]),
            text: text,
            isLast: parseInt(match[1]) === parseInt(match[2])
          };
        }
      }
    }
    
    return null;
  }

  async waitForTicketData(maxAttempts = 15) {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkForData = () => {
        attempts++;
        const result = this.extractTicketInfo();
        
        if (result.success) {
          this.ticketData = result.data;
          console.log('Ticket data found:', this.ticketData);
          resolve(true);
        } else if (attempts < maxAttempts) {
          setTimeout(checkForData, 500);
        } else {
          console.log('No ticket data found after maximum attempts');
          resolve(false);
        }
      };
      
      // Start checking immediately, then after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForData);
      } else {
        checkForData();
      }
    });
  }

  extractTicketInfo() {
    try {
      let ticketsData = null;
      
      // Method 1: Check window.ticketsData
      if (typeof window.ticketsData !== 'undefined') {
        ticketsData = window.ticketsData;
      }
      
      // Method 2: Extract from script tags
      if (!ticketsData) {
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          const content = script.textContent || script.innerText;
          if (content.includes('var ticketsData = ')) {
            const match = content.match(/var ticketsData = ({.*?});/s);
            if (match) {
              try {
                ticketsData = JSON.parse(match[1]);
                break;
              } catch (e) {
                console.log('Failed to parse ticketsData from script');
              }
            }
          }
        }
      }

      if (ticketsData && ticketsData.tickets && ticketsData.tickets.length > 0) {
        const tickets = ticketsData.tickets;
        const result = {
          eventName: ticketsData.eventName || 'Unknown Event',
          venueName: ticketsData.venueName || 'Unknown Venue',
          eventDate: ticketsData.eventDateString || 'Unknown Date',
          tickets: []
        };

        tickets.forEach((ticket, index) => {
          result.tickets.push({
            number: index + 1,
            section: ticket.section || 'N/A',
            row: ticket.row || 'N/A',
            seat: ticket.seat || 'N/A',
            type: ticket.ticketType || 'Standard',
            comment: ticket.comment || '',
            isGeneralAdmission: ticket.generalAdmission || false
          });
        });

        return { success: true, data: result };
      }

      return { success: false, error: 'No ticket data found' };
    } catch (error) {
      console.error('Error extracting ticket info:', error);
      return { success: false, error: error.message };
    }
  }

  detectCurrentTicket() {
    // Use the new position text extraction method
    const position = this.extractPositionText();
    if (position) {
      this.currentTicketIndex = position.current - 1; // Convert to 0-based index
      console.log(`Detected current ticket: ${position.current} of ${position.total}`);
      return;
    }
    
    // Fallback: check if Vue app exists and has index
    if (window.app && typeof window.app.index !== 'undefined') {
      this.currentTicketIndex = window.app.index;
      return;
    }
    
    // Default to first ticket
    this.currentTicketIndex = 0;
    console.log('Could not detect current ticket, defaulting to first');
  }

  setupTicketChangeListener() {
    // More comprehensive mutation observer for content changes
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        // Check for changes in text content that might indicate navigation
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Look for changes in pagination text
          const target = mutation.target;
          if (target.textContent && /\d+\s*of\s*\d+/i.test(target.textContent)) {
            shouldUpdate = true;
          }
          
          // Check if any added/removed nodes contain position text
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
              if (node.textContent && /\d+\s*of\s*\d+/i.test(node.textContent)) {
                shouldUpdate = true;
              }
            });
          }
        }
        
        // Check for attribute changes that might affect ticket display
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.classList && (target.classList.contains('sc-cgHJcJ') || target.classList.contains('ticket'))) {
            shouldUpdate = true;
          }
        }
      });
      
      if (shouldUpdate) {
        const oldIndex = this.currentTicketIndex;
        this.detectCurrentTicket();
        
        if (oldIndex !== this.currentTicketIndex && this.overlay) {
          console.log(`Ticket changed from ${oldIndex + 1} to ${this.currentTicketIndex + 1}`);
          this.updateOverlayContent();
        }
      }
    });

    // Observe multiple areas that might change
    const observeOptions = { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    };

    // Observe pagination area
    const pagination = document.querySelector('.right-left');
    if (pagination) {
      observer.observe(pagination, observeOptions);
    }

    // Observe footer for barcoded tickets
    const footer = document.querySelector('footer');
    if (footer) {
      observer.observe(footer, observeOptions);
    }

    // Observe main content area
    const mainContent = document.querySelector('.tickets-list, .ticket, #app');
    if (mainContent) {
      observer.observe(mainContent, observeOptions);
    }

    // Also set up a periodic check as backup
    this.positionCheckInterval = setInterval(() => {
      const position = this.extractPositionText();
      if (position && position.current - 1 !== this.currentTicketIndex) {
        console.log(`Periodic check: position changed to ${position.current}`);
        this.currentTicketIndex = position.current - 1;
        if (this.overlay) {
          this.updateOverlayContent();
        }
      }
    }, 2000);

    // Listen for Vue app changes if accessible
    if (window.EventBus) {
      try {
        window.EventBus.$on('ticketChange', (index) => {
          console.log(`Vue EventBus: ticket changed to ${index}`);
          this.currentTicketIndex = index;
          this.updateOverlayContent();
        });
      } catch (e) {
        // EventBus not accessible, that's fine
      }
    }
  }

  navigateToTicket(targetIndex) {
    if (!this.navigationSelector || targetIndex === this.currentTicketIndex) {
      return;
    }
    
    const position = this.extractPositionText();
    if (!position) return;
    
    const isBarcodeless = this.ticketData?.barcodelessLink !== false; // Default to barcodeless if undefined
    const targetTicketNumber = targetIndex + 1; // Convert to 1-based
    
    console.log(`Attempting to navigate from ticket ${position.current} to ticket ${targetTicketNumber}`);
    
    // Calculate how many clicks needed
    const clicksNeeded = targetTicketNumber - position.current;
    
    if (clicksNeeded === 0) return;
    
    // Navigate step by step
    const clickDirection = clicksNeeded > 0; // true = forward, false = backward
    const totalClicks = Math.abs(clicksNeeded);
    
    let clickCount = 0;
    const doClick = () => {
      if (clickCount >= totalClicks) return;
      
      this.clickNavigationArrow(clickDirection);
      clickCount++;
      
      // Wait and verify navigation
      setTimeout(() => {
        const newPosition = this.extractPositionText();
        if (newPosition && newPosition.current !== position.current) {
          console.log(`Navigation successful: now at ticket ${newPosition.current}`);
          // Update our internal state
          this.currentTicketIndex = newPosition.current - 1;
          this.updateOverlayContent();
          
          // Continue clicking if needed
          if (clickCount < totalClicks && newPosition.current !== targetTicketNumber) {
            doClick();
          }
        } else if (clickCount < totalClicks) {
          console.log(`Navigation may have failed, retrying click ${clickCount + 1}`);
          doClick();
        }
      }, 800); // Increased wait time for page updates
    };
    
    doClick();
  }

  clickNavigationArrow(isForward = true) {
    const isBarcodeless = this.ticketData?.barcodelessLink !== false;
    
    console.log(`Clicking ${isForward ? 'forward' : 'backward'} arrow (barcodeless: ${isBarcodeless})`);
    
    if (isBarcodeless) {
      // For barcodeless tickets, find the navigation arrows
      const rightLeftContainer = document.querySelector('.right-left');
      if (rightLeftContainer) {
        const arrows = rightLeftContainer.querySelectorAll('.sc-hizQCF.kNbQc, .sc-cgHJcJ');
        console.log(`Found ${arrows.length} navigation elements`);
        
        if (arrows.length >= 2) {
          const targetArrow = isForward ? arrows[1] : arrows[0]; // Right : Left
          
          // Try multiple click methods
          try {
            targetArrow.click();
            console.log(`Clicked ${isForward ? 'right' : 'left'} arrow with .click()`);
          } catch (e) {
            try {
              targetArrow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              console.log(`Clicked ${isForward ? 'right' : 'left'} arrow with dispatchEvent`);
            } catch (e2) {
              console.log(`Failed to click arrow: ${e2}`);
            }
          }
        } else {
          console.log('Could not find enough navigation arrows');
        }
      } else {
        console.log('Could not find .right-left container');
      }
    } else {
      // For barcoded tickets, find enabled arrow in footer
      const footer = document.querySelector('footer');
      if (footer) {
        const arrows = footer.querySelectorAll('div.arrow');
        console.log(`Found ${arrows.length} arrow elements in footer`);
        
        // Find the correct arrow (usually second for right, first for left)
        const targetArrow = isForward ? arrows[1] : arrows[0];
        
        if (targetArrow) {
          try {
            targetArrow.click();
            console.log(`Clicked ${isForward ? 'right' : 'left'} footer arrow`);
          } catch (e) {
            try {
              targetArrow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              console.log(`Clicked ${isForward ? 'right' : 'left'} footer arrow with dispatchEvent`);
            } catch (e2) {
              console.log(`Failed to click footer arrow: ${e2}`);
            }
          }
        } else {
          console.log('Could not find target arrow in footer');
        }
      } else {
        console.log('Could not find footer element');
      }
    }
  }

  createOverlay() {
    if (this.overlay) {
      this.overlay.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'ticket-extractor-overlay';
    this.overlay.innerHTML = this.generateOverlayHTML();
    
    document.body.appendChild(this.overlay);
    
    // Add event listeners
    this.setupOverlayEvents();
    
    // Trigger slide-up animation
    setTimeout(() => {
      this.overlay.classList.add('visible');
    }, 100);
  }

  generateOverlayHTML() {
    const currentTicket = this.ticketData.tickets[this.currentTicketIndex];
    const hasMultipleTickets = this.ticketData.tickets.length > 1;
    const position = this.extractPositionText();
    const canNavigate = this.navigationSelector && position && position.total > 1;
    
    return `
      <div class="overlay-header">
        <div class="drag-handle">
          <span class="overlay-title">🎫 Ticket Info</span>
          ${position ? `<span class="ticket-counter">${position.current} of ${position.total}</span>` : ''}
        </div>
        <div class="header-controls">
          <button class="theme-toggle" id="theme-toggle" title="Toggle Dark Mode">
            ${this.isDarkMode ? '☀️' : '🌙'}
          </button>
          <button class="close-btn" id="close-overlay" title="Close">×</button>
        </div>
      </div>
      
      <div class="overlay-content">
        <div class="event-info">
          <div class="event-name">${this.ticketData.eventName}</div>
          <div class="event-details">
            ${this.ticketData.eventDate}<br>
            ${this.ticketData.venueName}
          </div>
        </div>
        
        <div class="current-ticket">
          <div class="ticket-type">
            ${currentTicket.type}
            ${currentTicket.isGeneralAdmission ? '<span class="ga-tag">GA</span>' : ''}
          </div>
          <div class="seat-info">
            <div class="seat-item">
              <div class="seat-label">Section</div>
              <div class="seat-value">${currentTicket.section}</div>
            </div>
            <div class="seat-item">
              <div class="seat-label">Row</div>
              <div class="seat-value">${currentTicket.row}</div>
            </div>
            <div class="seat-item">
              <div class="seat-label">Seat</div>
              <div class="seat-value">${currentTicket.seat}</div>
            </div>
          </div>
          ${currentTicket.comment ? `<div class="ticket-comment">${currentTicket.comment}</div>` : ''}
        </div>
        
        ${hasMultipleTickets ? this.generateAllTicketsHTML(canNavigate) : ''}
        
        <button class="copy-btn" id="copy-ticket-info">Copy Info</button>
        ${canNavigate ? '<div class="navigation-hint">Click tickets above to navigate</div>' : ''}
      </div>
    `;
  }

  generateAllTicketsHTML(canNavigate = false) {
    if (this.ticketData.tickets.length <= 1) return '';
    
    let html = '<div class="all-tickets"><div class="section-title">All Tickets</div>';
    
    this.ticketData.tickets.forEach((ticket, index) => {
      const isActive = index === this.currentTicketIndex;
      const clickable = canNavigate ? 'data-ticket-index="' + index + '"' : '';
      html += `
        <div class="ticket-summary ${isActive ? 'active' : ''}" ${clickable}>
          <span class="ticket-number">#${ticket.number}</span>
          <span class="ticket-location">${ticket.section} • ${ticket.row} • ${ticket.seat}</span>
          <span class="ticket-type-small">${ticket.type}</span>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  updateOverlayContent() {
    if (!this.overlay) return;
    
    const content = this.overlay.querySelector('.overlay-content');
    if (content) {
      // Re-generate content with new current ticket
      const newHTML = this.generateOverlayHTML();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newHTML;
      
      content.innerHTML = tempDiv.querySelector('.overlay-content').innerHTML;
      this.setupOverlayEvents(); // Re-setup events
    }
  }

  setupOverlayEvents() {
    // Close button
    const closeBtn = this.overlay.querySelector('#close-overlay');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeOverlay();
      });
    }

    // Copy button
    const copyBtn = this.overlay.querySelector('#copy-ticket-info');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyToClipboard();
      });
    }

    // Drag functionality
    const dragHandle = this.overlay.querySelector('.drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
    }

    // Global drag events
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }

  startDrag(e) {
    this.isDragging = true;
    const rect = this.overlay.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.overlay.style.transition = 'none';
    e.preventDefault();
  }

  drag(e) {
    if (!this.isDragging) return;
    
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - this.overlay.offsetWidth;
    const maxY = window.innerHeight - this.overlay.offsetHeight;
    
    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));
    
    this.overlay.style.left = clampedX + 'px';
    this.overlay.style.top = clampedY + 'px';
    this.overlay.style.bottom = 'auto';
    this.overlay.style.right = 'auto';
  }

  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.overlay.style.transition = '';
    }
  }

  closeOverlay() {
    if (this.overlay) {
      this.overlay.classList.add('closing');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.remove();
          this.overlay = null;
        }
      }, 250);
    }
  }

  copyToClipboard() {
    let text = `${this.ticketData.eventName}\n`;
    text += `${this.ticketData.eventDate}\n`;
    text += `${this.ticketData.venueName}\n\n`;

    this.ticketData.tickets.forEach((ticket, index) => {
      if (this.ticketData.tickets.length > 1) {
        text += `Ticket ${index + 1}:\n`;
      }
      text += `Type: ${ticket.type}\n`;
      text += `Section: ${ticket.section}\n`;
      text += `Row: ${ticket.row}\n`;
      text += `Seat: ${ticket.seat}\n`;
      if (ticket.comment) {
        text += `Note: ${ticket.comment}\n`;
      }
      text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      const copyBtn = this.overlay.querySelector('#copy-ticket-info');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#218838';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '';
        }, 1500);
      }
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    globalExtractor = new TicketExtractor();
  });
} else {
  globalExtractor = new TicketExtractor();
}

// Global extractor instance for message handling
let globalExtractor = null;

// Also listen for messages from popup (backward compatibility)
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

if (browserAPI && browserAPI.runtime && browserAPI.runtime.onMessage) {
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTicketInfo") {
      if (!globalExtractor) {
        globalExtractor = new TicketExtractor();
      }
      const result = globalExtractor.extractTicketInfo();
      sendResponse(result);
      return true;
    }
    
    if (request.action === "showOverlay") {
      if (!globalExtractor) {
        globalExtractor = new TicketExtractor();
        globalExtractor.init();
      } else if (!globalExtractor.overlay) {
        globalExtractor.createOverlay();
      }
      sendResponse({success: true});
      return true;
    }
    
    if (request.action === "debug") {
      const debug = {
        hasTicketsData: typeof window.ticketsData !== 'undefined',
        windowKeys: Object.keys(window).filter(key => key.toLowerCase().includes('ticket')),
        url: window.location.href,
        scripts: Array.from(document.querySelectorAll('script')).length,
        overlayActive: globalExtractor && globalExtractor.overlay ? true : false
      };
      sendResponse(debug);
      return true;
    }
  });
}