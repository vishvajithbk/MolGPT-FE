/**
 * ================================================
 * MolGPT - Main Application Entry Point
 * ================================================
 * 
 * This module serves as the main coordinator for the MolGPT application.
 * It initializes all components and manages their interactions.
 * 
 * Architecture:
 * - Component-based structure with clear separation of concerns
 * - Event-driven communication between modules
 * - Centralized state management for application data
 * - Clean error handling and user feedback
 * 
 * @author MolGPT Team
 * @version 2.0.0
 * ================================================
 */

// Import all application modules
import { ModeSelector } from './components/ModeSelector.js';
import { ModeManager } from './components/ModeManager.js';
import { PropertyForm } from './components/PropertyForm.js';
import { GenerationController } from './components/GenerationController.js';
import { ResultsDisplay } from './components/ResultsDisplay.js';
import { UIStateManager } from './utils/UIStateManager.js';
import { EventBus } from './utils/EventBus.js';

/**
 * Main Application Class
 * Coordinates all components and manages application lifecycle
 */
class MolGPTApp {
    constructor() {
        // Initialize application state
        this.state = {
            currentMode: 'Select Mode',
            isGenerating: false,
            formData: {
                samples: 0,
                temperature: 1.0,
                scaffold: '',
                fragment1: '',
                fragment2: '',
                scaffoldFile: null,
                fragmentFile: null
            }
        };

        // Initialize event bus for component communication
        this.eventBus = new EventBus();
        
        // Initialize UI state manager
        this.uiStateManager = new UIStateManager();
        
        // Component instances
        this.components = {};
        
        // Bind methods to preserve context
        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleFormDataChange = this.handleFormDataChange.bind(this);
        this.handleGeneration = this.handleGeneration.bind(this);
        this.handleGenerationComplete = this.handleGenerationComplete.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * Initialize the application
     * Sets up all components and event listeners
     */
    async init() {
        try {
            console.log('🚀 Initializing MolGPT Application...');
            
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize components in dependency order
            await this.initializeComponents();
            
            // Set up inter-component communication
            this.setupEventListeners();
            
            // Set initial UI state
            this.setInitialState();
            
            console.log('✅ MolGPT Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize MolGPT Application:', error);
            this.handleError(error);
        }
    }

    /**
     * Initialize all application components
     */
    async initializeComponents() {
        // Initialize components with their DOM selectors and options
        const componentConfigs = [
            {
                name: 'modeSelector',
                Class: ModeSelector,
                selector: '[data-component="mode-selector"]',
                options: { eventBus: this.eventBus }
            },
            {
                name: 'modeManager',
                Class: ModeManager,
                selector: '[data-component="mode-config"]',
                options: { eventBus: this.eventBus }
            },
            {
                name: 'propertyForm',
                Class: PropertyForm,
                selector: '[data-component="property-form"]',
                options: { eventBus: this.eventBus }
            },
            {
                name: 'generationController',
                Class: GenerationController,
                selector: '[data-action="generate"]',
                options: { eventBus: this.eventBus }
            },
            {
                name: 'resultsDisplay',
                Class: ResultsDisplay,
                selector: '[data-component="results"]',
                options: { eventBus: this.eventBus }
            }
        ];

        // Initialize each component
        for (const config of componentConfigs) {
            const element = document.querySelector(config.selector);
            
            if (!element) {
                throw new Error(`Required element not found: ${config.selector}`);
            }

            console.log(`🔧 Initializing ${config.name}...`);
            
            this.components[config.name] = new config.Class(element, config.options);
            
            // Initialize component if it has an init method
            if (typeof this.components[config.name].init === 'function') {
                await this.components[config.name].init();
            }
        }
    }

    /**
     * Set up event listeners for inter-component communication
     */
    setupEventListeners() {
        // Mode selection events
        this.eventBus.on('mode:changed', this.handleModeChange);
        
        // Form data events
        this.eventBus.on('form:dataChanged', this.handleFormDataChange);
        
        // Generation events
        this.eventBus.on('generation:start', this.handleGeneration);
        this.eventBus.on('generation:complete', this.handleGenerationComplete);
        this.eventBus.on('generation:error', this.handleError);
        
        // UI state events
        this.eventBus.on('ui:stateChange', (state) => {
            this.uiStateManager.updateState(state);
        });
        
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }

    /**
     * Set the initial application state
     */
    setInitialState() {
        // Set initial mode
        this.eventBus.emit('mode:setInitial', 'Select Mode');
        
        // Set initial form values
        this.eventBus.emit('form:setInitialValues', this.state.formData);
        
        // Set initial UI state
        this.uiStateManager.updateState({
            loading: false,
            error: null,
            mode: this.state.currentMode
        });
    }

    /**
     * Handle mode change events
     * @param {string} newMode - The newly selected mode
     */
    handleModeChange(newMode) {
        console.log(`🔄 Mode changed: ${this.state.currentMode} → ${newMode}`);
        
        const previousMode = this.state.currentMode;
        this.state.currentMode = newMode;
        
        // Clear form data when switching modes (except temperature and samples)
        const preservedData = {
            samples: this.state.formData.samples,
            temperature: this.state.formData.temperature
        };
        
        this.state.formData = {
            ...this.getDefaultFormData(),
            ...preservedData
        };
        
        // Update UI state
        this.uiStateManager.updateState({
            mode: newMode,
            previousMode: previousMode
        });
        
        // Notify other components of the mode change
        this.eventBus.emit('app:modeChanged', {
            current: newMode,
            previous: previousMode,
            formData: this.state.formData
        });
    }

    /**
     * Handle form data changes
     * @param {Object} changes - The form data changes
     */
    handleFormDataChange(changes) {
        // Update application state
        this.state.formData = {
            ...this.state.formData,
            ...changes
        };
        
        console.log('📝 Form data updated:', changes);
        
        // Validate form data
        const validation = this.validateFormData();
        
        // Update UI state based on validation
        this.uiStateManager.updateState({
            formValid: validation.isValid,
            formErrors: validation.errors
        });
    }

    /**
     * Handle generation start
     */
    async handleGeneration() {
        try {
            console.log('🔬 Starting molecule generation...');
            
            // Validate form data before proceeding
            const validation = this.validateFormData();
            if (!validation.isValid) {
                throw new Error(validation.errors.join('; '));
            }
            
            // Update application state
            this.state.isGenerating = true;
            
            // Update UI state
            this.uiStateManager.updateState({
                loading: true,
                error: null
            });
            
            // Clear previous results
            this.eventBus.emit('results:clear');
            
            // Show generation progress
            this.eventBus.emit('results:showProgress', 'Generating molecules... ⏳');
            
        } catch (error) {
            console.error('❌ Generation start failed:', error);
            this.handleError(error);
        }
    }

    /**
     * Handle generation completion
     * @param {Object} results - The generation results
     */
    handleGenerationComplete(results) {
        console.log('✅ Generation completed:', results);
        
        // Update application state
        this.state.isGenerating = false;
        
        // Update UI state
        this.uiStateManager.updateState({
            loading: false,
            error: null
        });
        
        // Display results
        this.eventBus.emit('results:display', results);
    }

    /**
     * Handle errors throughout the application
     * @param {Error|string} error - The error to handle
     */
    handleError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Application error:', errorMessage);
        
        // Update application state
        this.state.isGenerating = false;
        
        // Update UI state
        this.uiStateManager.updateState({
            loading: false,
            error: errorMessage
        });
        
        // Display error to user
        this.eventBus.emit('results:showError', errorMessage);
    }

    /**
     * Validate form data based on current mode
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validateFormData() {
        const errors = [];
        const { samples, temperature } = this.state.formData;
        
        // Validate samples
        if (!samples || samples < 1) {
            errors.push('Please enter a sample size ≥ 1');
        }
        
        if (samples > 500) {
            errors.push('Sample size cannot exceed 500');
        }
        
        // Validate temperature
        if (temperature < 0 || temperature > 2) {
            errors.push('Temperature must be between 0 and 2');
        }
        
        // Validate mode selection
        if (this.state.currentMode === 'Select Mode') {
            errors.push('Please choose a generator mode');
        }
        
        // Mode-specific validation
        if (this.state.currentMode === 'Scaffold Decoration') {
            const { scaffold, scaffoldFile } = this.state.formData;
            if (!scaffold && !scaffoldFile) {
                errors.push('Please provide a scaffold SMILES or upload a scaffold file');
            }
        }
        
        if (this.state.currentMode === 'Fragment Linking') {
            const { fragment1, fragment2, fragmentFile } = this.state.formData;
            if (!fragmentFile && (!fragment1 || !fragment2)) {
                errors.push('Please provide two fragment SMILES or upload a fragment file');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get default form data structure
     * @returns {Object} Default form data
     */
    getDefaultFormData() {
        return {
            samples: 0,
            temperature: 1.0,
            scaffold: '',
            fragment1: '',
            fragment2: '',
            scaffoldFile: null,
            fragmentFile: null
        };
    }

    /**
     * Get current application state
     * @returns {Object} Current application state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Clean up application resources
     */
    destroy() {
        console.log('🧹 Cleaning up MolGPT Application...');
        
        // Remove event listeners
        this.eventBus.removeAllListeners();
        
        // Destroy components
        Object.values(this.components).forEach(component => {
            if (typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        // Clean up references
        this.components = {};
        this.eventBus = null;
        this.uiStateManager = null;
        
        console.log('✅ MolGPT Application cleanup completed');
    }
}

/**
 * Initialize the application when the script loads
 */
const app = new MolGPTApp();

// Start the application
app.init().catch(error => {
    console.error('❌ Failed to start MolGPT Application:', error);
    
    // Show fallback error message to user
    const fallbackError = document.createElement('div');
    fallbackError.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    fallbackError.textContent = `Application failed to load: ${error.message}`;
    document.body.appendChild(fallbackError);
    
    // Auto-remove error after 10 seconds
    setTimeout(() => {
        if (fallbackError.parentNode) {
            fallbackError.parentNode.removeChild(fallbackError);
        }
    }, 10000);
});

// Export for potential external access or testing
window.MolGPTApp = app;

export default app; 