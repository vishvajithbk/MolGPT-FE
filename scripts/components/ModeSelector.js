/**
 * ================================================
 * ModeSelector Component
 * ================================================
 * 
 * Manages the mode selection dropdown functionality.
 * Handles user interactions, accessibility, and mode switching.
 * 
 * Features:
 * - Accessible dropdown with ARIA attributes
 * - Keyboard navigation support
 * - Click-outside-to-close functionality
 * - Clean event handling
 * 
 * @author MolGPT Team
 * ================================================
 */

export class ModeSelector {
    /**
     * Initialize the ModeSelector component
     * @param {HTMLElement} element - The mode selector container element
     * @param {Object} options - Component options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.eventBus = options.eventBus;
        
        // Component state
        this.state = {
            isOpen: false,
            currentMode: 'Select Mode',
            availableModes: [
                'De Novo Generation',
                'Scaffold Decoration', 
                'Fragment Linking',
                'Molecular Transformation',
                'Peptide Design'
            ]
        };
        
        // DOM element references
        this.elements = {
            trigger: null,
            menu: null,
            currentText: null,
            options: null,
            arrow: null
        };
        
        // Bind methods to preserve context
        this.handleTriggerClick = this.handleTriggerClick.bind(this);
        this.handleOptionClick = this.handleOptionClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupAccessibility();
            console.log('✅ ModeSelector component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize ModeSelector:', error);
            throw error;
        }
    }

    /**
     * Cache DOM element references for performance
     */
    cacheElements() {
        this.elements.trigger = this.element.querySelector('.mode-selector__trigger');
        this.elements.menu = this.element.querySelector('.mode-selector__menu');
        this.elements.currentText = this.element.querySelector('.mode-selector__current-text');
        this.elements.options = this.element.querySelectorAll('.mode-selector__option');
        this.elements.arrow = this.element.querySelector('.mode-selector__arrow');
        
        // Validate required elements
        const requiredElements = ['trigger', 'menu', 'currentText'];
        requiredElements.forEach(key => {
            if (!this.elements[key]) {
                throw new Error(`Required element not found: .mode-selector__${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            }
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Trigger click event
        this.elements.trigger.addEventListener('click', this.handleTriggerClick);
        
        // Option click events
        this.elements.options.forEach(option => {
            option.addEventListener('click', this.handleOptionClick);
        });
        
        // Keyboard navigation
        this.element.addEventListener('keydown', this.handleKeyDown);
        
        // Click outside to close
        document.addEventListener('click', this.handleClickOutside);
        
        // Escape key to close
        document.addEventListener('keydown', this.handleEscapeKey);
        
        // Listen for external mode changes
        if (this.eventBus) {
            this.eventBus.on('mode:setInitial', (mode) => {
                this.setCurrentMode(mode, false); // Don't emit event for initial set
            });
        }
    }

    /**
     * Set up accessibility attributes
     */
    setupAccessibility() {
        // Set initial ARIA attributes
        this.elements.trigger.setAttribute('aria-expanded', 'false');
        this.elements.trigger.setAttribute('aria-haspopup', 'true');
        this.elements.menu.setAttribute('role', 'menu');
        
        // Set option roles
        this.elements.options.forEach((option, index) => {
            option.setAttribute('role', 'menuitem');
            option.setAttribute('tabindex', '-1');
            option.id = `mode-option-${index}`;
        });
        
        // Set up menu labeling
        const menuId = 'mode-selector-menu';
        this.elements.menu.id = menuId;
        this.elements.trigger.setAttribute('aria-controls', menuId);
    }

    /**
     * Handle trigger button click
     * @param {Event} event - Click event
     */
    handleTriggerClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.toggle();
    }

    /**
     * Handle mode option click
     * @param {Event} event - Click event
     */
    handleOptionClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const selectedMode = event.currentTarget.getAttribute('data-mode');
        
        if (selectedMode && selectedMode !== this.state.currentMode) {
            this.setCurrentMode(selectedMode);
            this.close();
        }
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        if (!this.state.isOpen) {
            // Open dropdown on Enter or Space
            if (event.key === 'Enter' || event.key === ' ') {
                if (event.target === this.elements.trigger) {
                    event.preventDefault();
                    this.open();
                }
            }
            return;
        }

        // Handle navigation when dropdown is open
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navigateOptions(1);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.navigateOptions(-1);
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (document.activeElement && document.activeElement.classList.contains('mode-selector__option')) {
                    document.activeElement.click();
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.close();
                this.elements.trigger.focus();
                break;
                
            case 'Home':
                event.preventDefault();
                this.focusOption(0);
                break;
                
            case 'End':
                event.preventDefault();
                this.focusOption(this.elements.options.length - 1);
                break;
        }
    }

    /**
     * Handle click outside dropdown to close
     * @param {Event} event - Click event
     */
    handleClickOutside(event) {
        if (this.state.isOpen && !this.element.contains(event.target)) {
            this.close();
        }
    }

    /**
     * Handle escape key to close dropdown
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.state.isOpen) {
            this.close();
            this.elements.trigger.focus();
        }
    }

    /**
     * Navigate through options with arrow keys
     * @param {number} direction - Direction to navigate (1 for down, -1 for up)
     */
    navigateOptions(direction) {
        const options = Array.from(this.elements.options);
        const currentIndex = options.findIndex(option => option === document.activeElement);
        
        let nextIndex;
        if (currentIndex === -1) {
            // No option focused, focus first or last based on direction
            nextIndex = direction > 0 ? 0 : options.length - 1;
        } else {
            // Move to next/previous option with wrapping
            nextIndex = (currentIndex + direction + options.length) % options.length;
        }
        
        this.focusOption(nextIndex);
    }

    /**
     * Focus a specific option by index
     * @param {number} index - Index of option to focus
     */
    focusOption(index) {
        if (index >= 0 && index < this.elements.options.length) {
            this.elements.options[index].focus();
        }
    }

    /**
     * Open the dropdown menu
     */
    open() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        
        // Update UI
        this.elements.trigger.setAttribute('aria-expanded', 'true');
        this.elements.menu.setAttribute('aria-expanded', 'true');
        
        // Add visual feedback
        this.element.classList.add('mode-selector--open');
        
        // Focus first option for keyboard navigation
        this.focusOption(0);
        
        console.log('📖 Mode selector opened');
    }

    /**
     * Close the dropdown menu
     */
    close() {
        if (!this.state.isOpen) return;
        
        this.state.isOpen = false;
        
        // Update UI
        this.elements.trigger.setAttribute('aria-expanded', 'false');
        this.elements.menu.setAttribute('aria-expanded', 'false');
        
        // Remove visual feedback
        this.element.classList.remove('mode-selector--open');
        
        console.log('📕 Mode selector closed');
    }

    /**
     * Toggle dropdown open/closed state
     */
    toggle() {
        if (this.state.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Set the current selected mode
     * @param {string} mode - The mode to set as current
     * @param {boolean} emitEvent - Whether to emit the mode change event
     */
    setCurrentMode(mode, emitEvent = true) {
        if (!this.state.availableModes.includes(mode) && mode !== 'Select Mode') {
            console.warn(`⚠️ Invalid mode: ${mode}`);
            return;
        }
        
        const previousMode = this.state.currentMode;
        this.state.currentMode = mode;
        
        // Update UI
        this.elements.currentText.textContent = mode;
        
        // Update option states
        this.elements.options.forEach(option => {
            const optionMode = option.getAttribute('data-mode');
            option.setAttribute('aria-selected', optionMode === mode ? 'true' : 'false');
        });
        
        console.log(`🔄 Mode changed: ${previousMode} → ${mode}`);
        
        // Emit event if requested
        if (emitEvent && this.eventBus) {
            this.eventBus.emit('mode:changed', mode);
        }
    }

    /**
     * Get the current selected mode
     * @returns {string} Current mode
     */
    getCurrentMode() {
        return this.state.currentMode;
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.close();
        this.setCurrentMode('Select Mode');
    }

    /**
     * Clean up component resources
     */
    destroy() {
        // Remove event listeners
        this.elements.trigger?.removeEventListener('click', this.handleTriggerClick);
        
        this.elements.options.forEach(option => {
            option.removeEventListener('click', this.handleOptionClick);
        });
        
        this.element.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Clean up references
        this.elements = {};
        this.eventBus = null;
        
        console.log('🧹 ModeSelector component destroyed');
    }
} 