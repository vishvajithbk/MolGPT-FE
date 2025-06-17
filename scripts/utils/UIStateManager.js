/**
 * ================================================
 * UIStateManager Utility
 * ================================================
 * 
 * Manages global UI state and provides centralized control
 * over visual feedback, loading states, and user interactions.
 * 
 * Features:
 * - Loading state management
 * - Error state handling
 * - Visual feedback coordination
 * - Accessibility state management
 * 
 * @author MolGPT Team
 * ================================================
 */

export class UIStateManager {
    /**
     * Initialize the UIStateManager
     */
    constructor() {
        // Current UI state
        this.state = {
            loading: false,
            error: null,
            mode: 'Select Mode',
            formValid: false,
            formErrors: [],
            previousMode: null
        };
        
        // State change listeners
        this.listeners = new Set();
        
        // CSS classes for state management
        this.stateClasses = {
            loading: 'ui-state--loading',
            error: 'ui-state--error',
            success: 'ui-state--success',
            disabled: 'ui-state--disabled'
        };
        
        console.log('🎮 UIStateManager initialized');
    }

    /**
     * Update the UI state
     * @param {Object} updates - State updates to apply
     */
    updateState(updates) {
        if (typeof updates !== 'object' || updates === null) {
            console.warn('⚠️ UIStateManager: Invalid state updates');
            return;
        }
        
        const previousState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Log state changes for debugging
        const changedKeys = Object.keys(updates);
        console.log(`🔄 UI state updated:`, changedKeys.map(key => `${key}: ${updates[key]}`).join(', '));
        
        // Apply visual changes
        this.applyStateToUI();
        
        // Notify listeners
        this.notifyListeners(this.state, previousState);
    }

    /**
     * Apply current state to UI elements
     */
    applyStateToUI() {
        const body = document.body;
        
        // Apply loading state
        this.toggleUIClass(body, this.stateClasses.loading, this.state.loading);
        
        // Apply error state
        this.toggleUIClass(body, this.stateClasses.error, !!this.state.error);
        
        // Apply form validation state
        this.toggleUIClass(body, 'form-invalid', !this.state.formValid);
        
        // Update aria-busy for accessibility
        this.updateAriaStates();
        
        // Update page title based on state
        this.updatePageTitle();
    }

    /**
     * Toggle CSS class on element based on condition
     * @param {HTMLElement} element - Element to toggle class on
     * @param {string} className - CSS class name
     * @param {boolean} condition - Whether to add or remove class
     */
    toggleUIClass(element, className, condition) {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }

    /**
     * Update ARIA states for accessibility
     */
    updateAriaStates() {
        // Update main application container
        const mainApp = document.querySelector('.app');
        if (mainApp) {
            mainApp.setAttribute('aria-busy', this.state.loading.toString());
        }
        
        // Update form validation announcements
        this.updateFormAriaStates();
    }

    /**
     * Update form-related ARIA states
     */
    updateFormAriaStates() {
        // Create or update form errors announcement
        let errorElement = document.getElementById('form-errors-announcement');
        
        if (this.state.formErrors.length > 0) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = 'form-errors-announcement';
                errorElement.className = 'sr-only';
                errorElement.setAttribute('aria-live', 'polite');
                errorElement.setAttribute('aria-atomic', 'true');
                document.body.appendChild(errorElement);
            }
            
            errorElement.textContent = `Form validation errors: ${this.state.formErrors.join('; ')}`;
        } else if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Update page title based on current state
     */
    updatePageTitle() {
        const baseTitle = 'MolGPT - Molecular Generation Platform';
        let title = baseTitle;
        
        if (this.state.loading) {
            title = `⏳ Generating... - ${baseTitle}`;
        } else if (this.state.error) {
            title = `❌ Error - ${baseTitle}`;
        } else if (this.state.mode !== 'Select Mode') {
            title = `${this.state.mode} - ${baseTitle}`;
        }
        
        document.title = title;
    }

    /**
     * Show loading state with optional message
     * @param {string} message - Optional loading message
     */
    showLoading(message = 'Loading...') {
        this.updateState({
            loading: true,
            error: null
        });
        
        console.log(`⏳ Loading state activated: ${message}`);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.updateState({
            loading: false
        });
        
        console.log('✅ Loading state cleared');
    }

    /**
     * Show error state
     * @param {string|Error} error - Error message or Error object
     */
    showError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.updateState({
            loading: false,
            error: errorMessage
        });
        
        console.log(`❌ Error state activated: ${errorMessage}`);
    }

    /**
     * Clear error state
     */
    clearError() {
        this.updateState({
            error: null
        });
        
        console.log('✅ Error state cleared');
    }

    /**
     * Set form validation state
     * @param {boolean} isValid - Whether form is valid
     * @param {Array<string>} errors - Array of validation errors
     */
    setFormValidation(isValid, errors = []) {
        this.updateState({
            formValid: isValid,
            formErrors: errors
        });
        
        console.log(`📝 Form validation: ${isValid ? 'valid' : 'invalid'}${errors.length ? ` (${errors.length} errors)` : ''}`);
    }

    /**
     * Add a state change listener
     * @param {Function} listener - Function to call on state changes
     * @returns {Function} Function to remove the listener
     */
    addListener(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }
        
        this.listeners.add(listener);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of state changes
     * @param {Object} newState - New state
     * @param {Object} previousState - Previous state
     */
    notifyListeners(newState, previousState) {
        this.listeners.forEach(listener => {
            try {
                listener(newState, previousState);
            } catch (error) {
                console.error('❌ Error in UI state listener:', error);
            }
        });
    }

    /**
     * Get current UI state
     * @returns {Object} Current state object
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Check if UI is in loading state
     * @returns {boolean} Whether UI is loading
     */
    isLoading() {
        return this.state.loading;
    }

    /**
     * Check if UI has error
     * @returns {boolean} Whether UI has error
     */
    hasError() {
        return !!this.state.error;
    }

    /**
     * Get current error message
     * @returns {string|null} Current error message
     */
    getError() {
        return this.state.error;
    }

    /**
     * Check if form is valid
     * @returns {boolean} Whether form is valid
     */
    isFormValid() {
        return this.state.formValid;
    }

    /**
     * Get form validation errors
     * @returns {Array<string>} Array of form errors
     */
    getFormErrors() {
        return [...this.state.formErrors];
    }

    /**
     * Reset UI state to initial values
     */
    reset() {
        this.updateState({
            loading: false,
            error: null,
            mode: 'Select Mode',
            formValid: false,
            formErrors: [],
            previousMode: null
        });
        
        console.log('🔄 UI state reset to initial values');
    }

    /**
     * Show success feedback temporarily
     * @param {string} message - Success message
     * @param {number} duration - Duration in milliseconds
     */
    showSuccessFeedback(message, duration = 3000) {
        const body = document.body;
        body.classList.add(this.stateClasses.success);
        
        // Create success message element
        const successElement = document.createElement('div');
        successElement.className = 'ui-success-message';
        successElement.textContent = message;
        successElement.setAttribute('aria-live', 'polite');
        successElement.setAttribute('role', 'status');
        
        document.body.appendChild(successElement);
        
        console.log(`✨ Success feedback: ${message}`);
        
        // Remove after duration
        setTimeout(() => {
            body.classList.remove(this.stateClasses.success);
            if (successElement.parentNode) {
                successElement.parentNode.removeChild(successElement);
            }
        }, duration);
    }

    /**
     * Create a state watcher for specific properties
     * @param {string|Array<string>} properties - Property or properties to watch
     * @param {Function} callback - Callback to call when properties change
     * @returns {Function} Function to stop watching
     */
    watch(properties, callback) {
        const propsToWatch = Array.isArray(properties) ? properties : [properties];
        
        const listener = (newState, previousState) => {
            const hasChanges = propsToWatch.some(prop => newState[prop] !== previousState[prop]);
            
            if (hasChanges) {
                const watchedValues = {};
                propsToWatch.forEach(prop => {
                    watchedValues[prop] = newState[prop];
                });
                
                callback(watchedValues, newState, previousState);
            }
        };
        
        return this.addListener(listener);
    }

    /**
     * Clean up UI state manager
     */
    destroy() {
        // Remove all state classes from body
        const body = document.body;
        Object.values(this.stateClasses).forEach(className => {
            body.classList.remove(className);
        });
        
        // Remove form error announcements
        const errorElement = document.getElementById('form-errors-announcement');
        if (errorElement) {
            errorElement.remove();
        }
        
        // Clear listeners
        this.listeners.clear();
        
        // Reset page title
        document.title = 'MolGPT - Molecular Generation Platform';
        
        console.log('🧹 UIStateManager destroyed');
    }
} 