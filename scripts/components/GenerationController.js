/**
 * ================================================
 * GenerationController Component
 * ================================================
 * 
 * Manages the molecule generation process including API communication.
 * Handles generation button interactions and coordinates with other components.
 * 
 * Features:
 * - Form validation before generation
 * - API communication with error handling
 * - Loading state management
 * - Generation progress feedback
 * 
 * @author MolGPT Team
 * ================================================
 */

export class GenerationController {
    /**
     * Initialize the GenerationController component
     * @param {HTMLElement} element - The generate button element
     * @param {Object} options - Component options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.eventBus = options.eventBus;
        
        // Configuration
        this.config = {
            apiEndpoint: options.apiEndpoint || 'http://127.0.0.1:8000/generate-molecules',
            timeout: options.timeout || 60000, // 60 seconds
            maxRetries: options.maxRetries || 3
        };
        
        // Component state
        this.state = {
            isGenerating: false,
            currentMode: 'Select Mode',
            formData: {},
            abortController: null
        };
        
        // Bind methods to preserve context
        this.handleClick = this.handleClick.bind(this);
        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleFormDataChange = this.handleFormDataChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        try {
            this.setupEventListeners();
            this.updateButtonState();
            console.log('✅ GenerationController component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize GenerationController:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Button click event
        this.element.addEventListener('click', this.handleClick);
        
        // Keyboard event for accessibility
        this.element.addEventListener('keydown', this.handleKeyPress);
        
        // Listen for application state changes
        if (this.eventBus) {
            this.eventBus.on('mode:changed', this.handleModeChange);
            this.eventBus.on('form:dataChanged', this.handleFormDataChange);
        }
    }

    /**
     * Handle generate button click
     * @param {Event} event - Click event
     */
    async handleClick(event) {
        event.preventDefault();
        
        if (this.state.isGenerating) {
            // If already generating, cancel the request
            this.cancelGeneration();
            return;
        }
        
        try {
            await this.startGeneration();
        } catch (error) {
            console.error('❌ Generation failed:', error);
            this.handleGenerationError(error);
        }
    }

    /**
     * Handle keyboard events for accessibility
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyPress(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleClick(event);
        }
    }

    /**
     * Handle mode changes
     * @param {string} newMode - The newly selected mode
     */
    handleModeChange(newMode) {
        this.state.currentMode = newMode;
        this.updateButtonState();
    }

    /**
     * Handle form data changes
     * @param {Object} data - Updated form data
     */
    handleFormDataChange(data) {
        this.state.formData = { ...this.state.formData, ...data };
        this.updateButtonState();
    }

    /**
     * Start the generation process
     */
    async startGeneration() {
        console.log('🔬 Starting molecule generation...');
        
        // Validate form before proceeding
        const validation = this.validateForm();
        if (!validation.isValid) {
            throw new Error(validation.errors.join('; '));
        }
        
        // Update state
        this.state.isGenerating = true;
        this.updateButtonState();
        
        // Emit generation start event
        if (this.eventBus) {
            this.eventBus.emit('generation:start');
        }
        
        try {
            // Prepare request payload
            const payload = this.buildRequestPayload();
            
            // Make API request
            const results = await this.makeApiRequest(payload);
            
            // Handle successful response
            this.handleGenerationSuccess(results);
            
        } catch (error) {
            // Handle error
            this.handleGenerationError(error);
            throw error;
        } finally {
            // Always clean up state
            this.state.isGenerating = false;
            this.state.abortController = null;
            this.updateButtonState();
        }
    }

    /**
     * Cancel ongoing generation
     */
    cancelGeneration() {
        console.log('🛑 Cancelling generation...');
        
        if (this.state.abortController) {
            this.state.abortController.abort();
        }
        
        this.state.isGenerating = false;
        this.updateButtonState();
        
        if (this.eventBus) {
            this.eventBus.emit('generation:cancelled');
        }
    }

    /**
     * Validate form data before generation
     * @returns {Object} Validation result
     */
    validateForm() {
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
     * Build API request payload
     * @returns {Object} Request payload
     */
    buildRequestPayload() {
        const payload = {
            samples: this.state.formData.samples,
            temperature: this.state.formData.temperature,
            mode: this.state.currentMode
        };
        
        // Add mode-specific data
        if (this.state.currentMode === 'Scaffold Decoration') {
            payload.scaffold = this.state.formData.scaffold || '';
            // Note: File content would need to be read separately
        }
        
        if (this.state.currentMode === 'Fragment Linking') {
            payload.fragment1 = this.state.formData.fragment1 || '';
            payload.fragment2 = this.state.formData.fragment2 || '';
            // Note: File content would need to be read separately
        }
        
        return payload;
    }

    /**
     * Make API request to generate molecules
     * @param {Object} payload - Request payload
     * @returns {Promise<Object>} API response
     */
    async makeApiRequest(payload) {
        // Create abort controller for request cancellation
        this.state.abortController = new AbortController();
        
        // Prepare request with file data if needed
        const requestPayload = await this.prepareRequestWithFiles(payload);
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
            signal: this.state.abortController.signal
        };
        
        // Add timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
        });
        
        try {
            const response = await Promise.race([
                fetch(this.config.apiEndpoint, requestOptions),
                timeoutPromise
            ]);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Generation was cancelled');
            }
            throw error;
        }
    }

    /**
     * Prepare request payload with file data
     * @param {Object} payload - Base payload
     * @returns {Promise<Object>} Payload with file data
     */
    async prepareRequestWithFiles(payload) {
        const requestPayload = { ...payload };
        
        // Handle scaffold file
        if (this.state.formData.scaffoldFile) {
            try {
                const fileContent = await this.readFileAsText(this.state.formData.scaffoldFile);
                requestPayload.scaffold_file_text = fileContent;
            } catch (error) {
                console.warn('⚠️ Failed to read scaffold file:', error);
            }
        }
        
        // Handle fragment file
        if (this.state.formData.fragmentFile) {
            try {
                const fileContent = await this.readFileAsText(this.state.formData.fragmentFile);
                requestPayload.fragment_file_text = fileContent;
            } catch (error) {
                console.warn('⚠️ Failed to read fragment file:', error);
            }
        }
        
        return requestPayload;
    }

    /**
     * Read file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * Handle successful generation
     * @param {Object} results - Generation results
     */
    handleGenerationSuccess(results) {
        console.log('✅ Generation completed successfully:', results);
        
        if (this.eventBus) {
            this.eventBus.emit('generation:complete', results);
        }
    }

    /**
     * Handle generation error
     * @param {Error} error - Error that occurred
     */
    handleGenerationError(error) {
        console.error('❌ Generation error:', error);
        
        if (this.eventBus) {
            this.eventBus.emit('generation:error', error);
        }
    }

    /**
     * Update button state based on current conditions
     */
    updateButtonState() {
        const validation = this.validateForm();
        const canGenerate = validation.isValid && !this.state.isGenerating;
        
        // Update button text and appearance
        if (this.state.isGenerating) {
            this.element.textContent = 'Cancel';
            this.element.classList.add('generate-button--generating');
        } else {
            this.element.textContent = 'Generate';
            this.element.classList.remove('generate-button--generating');
        }
        
        // Update disabled state
        this.element.disabled = !canGenerate && !this.state.isGenerating;
        this.element.classList.toggle('generate-button--disabled', this.element.disabled);
        
        // Update ARIA attributes
        this.element.setAttribute('aria-busy', this.state.isGenerating.toString());
        
        if (!validation.isValid) {
            this.element.setAttribute('aria-describedby', 'generation-errors');
            this.element.title = validation.errors.join('; ');
        } else {
            this.element.removeAttribute('aria-describedby');
            this.element.title = '';
        }
    }

    /**
     * Get current state
     * @returns {Object} Current component state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Clean up component resources
     */
    destroy() {
        // Cancel any ongoing generation
        if (this.state.isGenerating) {
            this.cancelGeneration();
        }
        
        // Remove event listeners
        this.element.removeEventListener('click', this.handleClick);
        this.element.removeEventListener('keydown', this.handleKeyPress);
        
        if (this.eventBus) {
            this.eventBus.off('mode:changed', this.handleModeChange);
            this.eventBus.off('form:dataChanged', this.handleFormDataChange);
        }
        
        // Clean up references
        this.eventBus = null;
        this.state.abortController = null;
        
        console.log('🧹 GenerationController component destroyed');
    }
} 