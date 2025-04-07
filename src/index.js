import 'external-svg-loader';

// Global state to track event handlers and state
let stateData = new Map();
let isInitialized = false;
let currentBreakpoint = window.innerWidth < 768; // Initialize immediately with current value

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Main function to initialize or update hover effects
function initializeHoverEffects() {
  const isMobile = window.innerWidth < 768;

  // Skip if breakpoint hasn't changed
  if (currentBreakpoint === isMobile && isInitialized) return;

  // Update the current breakpoint
  currentBreakpoint = isMobile;

  // Get all state components
  const stateComponents = document.querySelectorAll('.state_component');

  // First, clean up any existing event listeners
  cleanupEventListeners();

  // Then set up the appropriate behavior based on screen size
  if (isMobile) {
    stateComponents.forEach((state) => {
      state.style.display = 'flex';
      state.style.opacity = 1;
    });
  } else {
    // First, hide all components
    stateComponents.forEach((state) => {
      state.style.display = 'none';
      state.style.opacity = 0;
    });

    // Then set up hover behavior
    setupDesktopHoverBehavior(stateComponents);
  }

  isInitialized = true;
}

// Function to set up desktop hover behavior
function setupDesktopHoverBehavior(stateComponents) {
  // Create a path ID to stateId mapping for faster lookups
  const pathMap = new Map();
  document.querySelectorAll('#svg-loader path[id]').forEach((path) => {
    if (path.id && path.id.length >= 5) {
      const prefix = path.id.substring(0, 5);
      pathMap.set(prefix, path);
    }
  });

  stateComponents.forEach((state) => {
    const stateId = state.getAttribute('state');
    if (!stateId) return; // Skip if no state attribute

    const mapState = pathMap.get(stateId);
    if (!mapState) return; // Skip if no matching path

    // Create data object for this state
    stateData.set(stateId, {
      isHovering: false,
      timeouts: [],
    });

    const data = stateData.get(stateId);
    mapState.setAttribute('active', '');

    // Create handler functions
    const stateEnterHandler = () => {
      data.isHovering = true;
      clearTimeouts(data);

      state.style.display = 'flex';
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        if (data.isHovering) {
          state.style.opacity = 1;
        }
      });
    };

    const stateLeaveHandler = () => {
      data.isHovering = false;

      const timeout1 = setTimeout(() => {
        if (!data.isHovering) {
          state.style.opacity = 0;

          const timeout2 = setTimeout(() => {
            if (!data.isHovering) {
              state.style.display = 'none';
            }
          }, 200);

          data.timeouts.push(timeout2);
        }
      }, 50);

      data.timeouts.push(timeout1);
    };

    const modalEnterHandler = () => {
      data.isHovering = true;
      clearTimeouts(data);

      if (state.style.display !== 'flex') {
        state.style.display = 'flex';
        setTimeout(() => {
          requestAnimationFrame(() => {
            state.style.opacity = 1;
          });
        }, 5);
      } else {
        state.style.opacity = 1;
      }
    };

    const modalLeaveHandler = () => {
      data.isHovering = false;

      const timeout = setTimeout(() => {
        if (!data.isHovering) {
          state.style.opacity = 0;

          const hideTimeout = setTimeout(() => {
            if (!data.isHovering) {
              state.style.display = 'none';
            }
          }, 200);

          data.timeouts.push(hideTimeout);
        }
      }, 50);

      data.timeouts.push(timeout);
    };

    // Store handlers for later cleanup
    data.handlers = {
      stateEnter: stateEnterHandler,
      stateLeave: stateLeaveHandler,
      modalEnter: modalEnterHandler,
      modalLeave: modalLeaveHandler,
    };

    // Add event listeners
    mapState.addEventListener('mouseenter', stateEnterHandler);
    mapState.addEventListener('mouseleave', stateLeaveHandler);
    state.addEventListener('mouseenter', modalEnterHandler);
    state.addEventListener('mouseleave', modalLeaveHandler);
  });
}

// Helper to clear all timeouts for a state
function clearTimeouts(data) {
  if (data.timeouts && data.timeouts.length > 0) {
    data.timeouts.forEach((id) => clearTimeout(id));
    data.timeouts = [];
  }
}

// Function to clean up all event listeners
function cleanupEventListeners() {
  // Only attempt cleanup if we've previously initialized
  if (!isInitialized) return;

  // For each tracked state
  stateData.forEach((data, stateId) => {
    if (data.handlers) {
      // Clear any pending timeouts
      if (data.timeouts) {
        data.timeouts.forEach((id) => clearTimeout(id));
      }

      // Find the map state and component elements more efficiently
      const state = document.querySelector(`.state_component[state="${stateId}"]`);
      const mapState = document.querySelector(`#svg-loader path[id^="${stateId}"]`);

      // Remove event listeners if elements exist
      if (mapState) {
        mapState.removeEventListener('mouseenter', data.handlers.stateEnter);
        mapState.removeEventListener('mouseleave', data.handlers.stateLeave);
      }

      if (state) {
        state.removeEventListener('mouseenter', data.handlers.modalEnter);
        state.removeEventListener('mouseleave', data.handlers.modalLeave);
      }
    }
  });

  // Clear all tracked data
  stateData.clear();
}

// Initialize when SVG is loaded - use the load event once
let hasInitialized = false;
window.addEventListener('iconload', () => {
  if (hasInitialized) return;
  hasInitialized = true;

  initializeHoverEffects();

  // Handle window resize with proper debounce - 100ms is responsive enough
  const debouncedInit = debounce(initializeHoverEffects, 100);
  window.addEventListener('resize', debouncedInit, { passive: true });
});
