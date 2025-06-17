/**
 * ================================================
 * PropertyForm Component
 * ================================================
 * 
 * Manages the property configuration form including samples and temperature.
 * Provides real-time validation and user feedback.
 * 
 * Features:
 * - Real-time form validation
 * - Live temperature slider updates
 * - Input sanitization and bounds checking  
 * - Accessible form controls
 * 
 * @author MolGPT Team
 * ================================================
 */

export class PropertyForm {
    /**
     * Initialize the PropertyForm component
     * @param {HTMLElement} element - The property form container element
     * @param {Object} options - Component options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.eventBus = options.eventBus;
        
        // Component state
        this.state = {
            samples: 0,
            temperature: 1.0,
            isValid: false,
            errors: []
        };
        
        // Configuration
        this.config = {
            samples: {
                min: 1,
                max: 500,
                default: 1
            },
            temperature: {
                min: 0,
                max: 2,
                step: 0.1,
                default: 1.0
            }
        };
        
        // DOM element references
        this.elements = {
            samplesInput: null,
            temperatureSlider: null,
            temperatureValue: null
        };
        
        // Bind methods to preserve context
        this.handleSamplesChange = this.handleSamplesChange.bind(this);
        this.handleSamplesFocus = this.handleSamplesFocus.bind(this);
        this.handleSamplesBlur = this.handleSamplesBlur.bind(this);
        this.handleTemperatureChange = this.handleTemperatureChange.bind(this);
        this.handleFormDataSet = this.handleFormDataSet.bind(this);
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupInitialValues();
            this.validate();
            console.log('✅ PropertyForm component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize PropertyForm:', error);
            throw error;
        }
    }

    /**
     * Cache DOM element references for performance
     */
    cacheElements() {
        this.elements.samplesInput = this.element.querySelector('[data-input="samples"]');
        this.elements.temperatureSlider = this.element.querySelector('[data-input="temperature"]');
        this.elements.temperatureValue = this.element.querySelector('[data-element="temperature-value"]');
        
        // Validate required elements
        const requiredElements = ['samplesInput', 'temperatureSlider', 'temperatureValue'];
        requiredElements.forEach(key => {
            if (!this.elements[key]) {
                throw new Error(`Required element not found: ${key}`);
            }
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Samples input events
        this.elements.samplesInput.addEventListener('input', this.handleSamplesChange);
        this.elements.samplesInput.addEventListener('focus', this.handleSamplesFocus);
        this.elements.samplesInput.addEventListener('blur', this.handleSamplesBlur);
        
        // Temperature slider events
        this.elements.temperatureSlider.addEventListener('input', this.handleTemperatureChange);
        
        // Listen for external data updates
        if (this.eventBus) {
            this.eventBus.on('form:setInitialValues', this.handleFormDataSet);
        }
    }

    /**
     * Set up initial form values
     */
    setupInitialValues() {
        // Set initial values from current element values or defaults
        this.state.samples = parseInt(this.elements.samplesInput.value) || this.config.samples.default;
        this.state.temperature = parseFloat(this.elements.temperatureSlider.value) || this.config.temperature.default;
        
        // Update UI to reflect state
        this.updateSamplesDisplay();
        this.updateTemperatureDisplay();
    }

    /**
     * Handle samples input changes
     * @param {Event} event - Input change event
     */
    handleSamplesChange(event) {
        const rawValue = event.target.value;
        const numericValue = parseInt(rawValue, 10);
        
        // Validate and sanitize input
        let sanitizedValue = numericValue;
        
        if (isNaN(numericValue) || numericValue < this.config.samples.min) {
            sanitizedValue = this.config.samples.min;
        } else if (numericValue > this.config.samples.max) {
            sanitizedValue = this.config.samples.max;
        }
        
        // Update state and UI if value changed
        if (this.state.samples !== sanitizedValue) {
            this.state.samples = sanitizedValue;
            this.updateSamplesDisplay();
            this.validate();
            this.emitFormChange();
        }
    }

    /**
     * Handle samples input focus
     * @param {Event} event - Focus event
     */
    handleSamplesFocus(event) {
        // Clear field for easy input
        if (event.target.value === '0') {
            event.target.value = '';
        }
        
        // Add focus styling
        event.target.classList.add('form-field__input--focused');
    }

    /**
     * Handle samples input blur
     * @param {Event} event - Blur event
     */
    handleSamplesBlur(event) {
        // Set minimum value if empty
        if (event.target.value === '' || parseInt(event.target.value) < this.config.samples.min) {
            this.state.samples = this.config.samples.min;
            this.updateSamplesDisplay();
            this.validate();
            this.emitFormChange();
        }
        
        // Remove focus styling
        event.target.classList.remove('form-field__input--focused');
    }

    /**
     * Handle temperature slider changes
     * @param {Event} event - Input change event
     */
    handleTemperatureChange(event) {
        const value = parseFloat(event.target.value);
        
        if (this.state.temperature !== value) {
            this.state.temperature = value;
            this.updateTemperatureDisplay();
            this.validate();
            this.emitFormChange();
        }
    }

    /**
     * Handle external form data updates
     * @param {Object} data - Form data to set
     */
    handleFormDataSet(data) {
        let hasChanges = false;
        
        // Update samples if provided
        if (typeof data.samples === 'number' && data.samples !== this.state.samples) {
            this.state.samples = Math.max(this.config.samples.min, Math.min(this.config.samples.max, data.samples));
            hasChanges = true;
        }
        
        // Update temperature if provided
        if (typeof data.temperature === 'number' && data.temperature !== this.state.temperature) {
            this.state.temperature = Math.max(this.config.temperature.min, Math.min(this.config.temperature.max, data.temperature));
            hasChanges = true;
        }
        
        if (hasChanges) {
            this.updateSamplesDisplay();
            this.updateTemperatureDisplay();
            this.validate();
        }
    }

    /**
     * Update samples input display
     */
    updateSamplesDisplay() {
        if (this.elements.samplesInput.value !== this.state.samples.toString()) {
            this.elements.samplesInput.value = this.state.samples;
        }
        
        // Add validation styling
        this.elements.samplesInput.classList.remove('form-field__input--valid', 'form-field__input--invalid');
        
        if (this.state.samples >= this.config.samples.min && this.state.samples <= this.config.samples.max) {
            this.elements.samplesInput.classList.add('form-field__input--valid');
        }
    }

    /**
     * Update temperature slider and display
     */
    updateTemperatureDisplay() {
        // Update slider value
        if (this.elements.temperatureSlider.value != this.state.temperature) {
            this.elements.temperatureSlider.value = this.state.temperature;
        }
        
        // Update display value with proper formatting
        const displayValue = this.state.temperature.toFixed(1);
        if (this.elements.temperatureValue.textContent !== displayValue) {
            this.elements.temperatureValue.textContent = displayValue;
        }
    }

    /**
     * Validate current form state
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];
        
        // Validate samples
        if (!Number.isInteger(this.state.samples) || this.state.samples < this.config.samples.min) {
            errors.push(`Samples must be at least ${this.config.samples.min}`);
        }
        
        if (this.state.samples > this.config.samples.max) {
            errors.push(`Samples cannot exceed ${this.config.samples.max}`);
        }
        
        // Validate temperature
        if (this.state.temperature < this.config.temperature.min || this.state.temperature > this.config.temperature.max) {
            errors.push(`Temperature must be between ${this.config.temperature.min} and ${this.config.temperature.max}`);
        }
        
        // Update state
        const isValid = errors.length === 0;
        this.state.isValid = isValid;
        this.state.errors = errors;
        
        // Update UI classes for validation feedback
        this.updateValidationUI(isValid);
        
        return {
            isValid,
            errors,
            values: this.getFormData()
        };
    }

    /**
     * Update UI based on validation state
     * @param {boolean} isValid - Whether form is valid
     */
    updateValidationUI(isValid) {
        // Update form container classes
        this.element.classList.toggle('property-form--valid', isValid);
        this.element.classList.toggle('property-form--invalid', !isValid);
        
        // Update individual field validation states
        this.updateFieldValidation('samples', this.validateSamples());
        this.updateFieldValidation('temperature', this.validateTemperature());
    }

    /**
     * Update field validation styling
     * @param {string} fieldName - Name of the field
     * @param {boolean} isValid - Whether field is valid
     */
    updateFieldValidation(fieldName, isValid) {
        const element = fieldName === 'samples' ? this.elements.samplesInput : this.elements.temperatureSlider.parentElement;
        
        if (element) {
            element.classList.toggle('form-field--valid', isValid);
            element.classList.toggle('form-field--invalid', !isValid);
        }
    }

    /**
     * Validate samples field specifically
     * @returns {boolean} Whether samples is valid
     */
    validateSamples() {
        return Number.isInteger(this.state.samples) && 
               this.state.samples >= this.config.samples.min && 
               this.state.samples <= this.config.samples.max;
    }

    /**
     * Validate temperature field specifically
     * @returns {boolean} Whether temperature is valid
     */
    validateTemperature() {
        return this.state.temperature >= this.config.temperature.min && 
               this.state.temperature <= this.config.temperature.max;
    }

    /**
     * Emit form change events
     */
    emitFormChange() {
        if (this.eventBus) {
            const formData = this.getFormData();
            this.eventBus.emit('form:dataChanged', formData);
            
            console.log('📝 PropertyForm data changed:', formData);
        }
    }

    /**
     * Get current form data
     * @returns {Object} Current form data
     */
    getFormData() {
        return {
            samples: this.state.samples,
            temperature: this.state.temperature
        };
    }

    /**
     * Set form data programmatically
     * @param {Object} data - Data to set
     */
    setFormData(data) {
        this.handleFormDataSet(data);
    }

    /**
     * Reset form to default values
     */
    reset() {
        this.state.samples = this.config.samples.default;
        this.state.temperature = this.config.temperature.default;
        
        this.updateSamplesDisplay();
        this.updateTemperatureDisplay();
        this.validate();
        this.emitFormChange();
        
        console.log('🔄 PropertyForm reset to defaults');
    }

    /**
     * Get validation state
     * @returns {Object} Current validation state
     */
    getValidationState() {
        return {
            isValid: this.state.isValid,
            errors: [...this.state.errors]
        };
    }

    /**
     * Clean up component resources
     */
    destroy() {
        // Remove event listeners
        this.elements.samplesInput?.removeEventListener('input', this.handleSamplesChange);
        this.elements.samplesInput?.removeEventListener('focus', this.handleSamplesFocus);
        this.elements.samplesInput?.removeEventListener('blur', this.handleSamplesBlur);
        this.elements.temperatureSlider?.removeEventListener('input', this.handleTemperatureChange);
        
        if (this.eventBus) {
            this.eventBus.off('form:setInitialValues', this.handleFormDataSet);
        }
        
        // Clean up references
        this.elements = {};
        this.eventBus = null;
        
        console.log('🧹 PropertyForm component destroyed');
    }
} 