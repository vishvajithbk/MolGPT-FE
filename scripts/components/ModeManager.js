/**
 * ================================================
 * ModeManager Component
 * ================================================
 * 
 * Manages mode-specific content display and form interactions.
 * Ensures fixed container sizing to prevent layout shifts.
 * 
 * Features:
 * - Fixed-size container prevents layout shifts
 * - Dynamic content switching based on selected mode
 * - Mode-specific form handling
 * - File upload management
 * 
 * @author MolGPT Team
 * ================================================
 */

export class ModeManager {
    /**
     * Initialize the ModeManager component
     * @param {HTMLElement} element - The mode configuration container element
     * @param {Object} options - Component options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.eventBus = options.eventBus;
        
        // Component state
        this.state = {
            currentMode: 'Select Mode',
            formData: {}
        };
        
        // DOM element references
        this.elements = {
            instructions: null,
            forms: null,
            scaffoldForm: null,
            fragmentForm: null,
            scaffoldSmilesInput: null,
            scaffoldFileInput: null,
            fragment1Input: null,
            fragment2Input: null,
            fragmentFileInput: null,
            fileLabels: {}
        };
        
        // Mode configuration data
        this.modeConfigs = {
            'Select Mode': {
                title: 'Welcome to MolGPT',
                description: 'Select a mode to start generating molecules with AI-powered molecular design.',
                hasForm: false
            },
            'De Novo Generation': {
                title: 'De Novo Molecular Generation',
                description: 'Generate completely novel molecules from scratch based on desired properties. No structural inputs required - configure property filters below to guide generation.',
                hasForm: false
            },
            'Scaffold Decoration': {
                title: 'Scaffold Decoration',
                description: 'Decorate provided scaffolds with optimal R-groups. Upload a core structure or provide SMILES, then set desired properties below.',
                hasForm: true,
                formType: 'scaffold'
            },
            'Fragment Linking': {
                title: 'Fragment Linking',
                description: 'Link two molecular fragments with novel linkers. Provide fragment SMILES or upload fragment file, then tune filters to guide the linker design.',
                hasForm: true,
                formType: 'fragment'
            },
            'Molecular Transformation': {
                title: 'Molecular Transformation',
                description: 'Suggest structurally similar molecules or modifications. Input your starting molecule and adjust transformation settings below.',
                hasForm: false
            },
            'Peptide Design': {
                title: 'Peptide Design',
                description: 'Generate peptide sequences matching your criteria. No structural input required - adjust sequence and property constraints below.',
                hasForm: false
            }
        };
        
        // Bind methods to preserve context
        this.handleModeChange = this.handleModeChange.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.renderInitialState();
            console.log('✅ ModeManager component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize ModeManager:', error);
            throw error;
        }
    }

    /**
     * Cache DOM element references for performance
     */
    cacheElements() {
        this.elements.instructions = this.element.querySelector('[data-element="mode-instructions"]');
        this.elements.forms = this.element.querySelector('[data-element="mode-forms"]');
        
        // Cache form elements
        this.elements.scaffoldForm = this.element.querySelector('[data-mode-form="Scaffold Decoration"]');
        this.elements.fragmentForm = this.element.querySelector('[data-mode-form="Fragment Linking"]');
        
        // Cache input elements
        this.elements.scaffoldSmilesInput = this.element.querySelector('[data-input="scaffold-smiles"]');
        this.elements.scaffoldFileInput = this.element.querySelector('[data-input="scaffold-file"]');
        this.elements.fragment1Input = this.element.querySelector('[data-input="fragment1-smiles"]');
        this.elements.fragment2Input = this.element.querySelector('[data-input="fragment2-smiles"]');
        this.elements.fragmentFileInput = this.element.querySelector('[data-input="fragment-file"]');
        
        // Cache file upload labels
        this.elements.fileLabels.scaffold = this.elements.scaffoldFileInput?.parentElement.querySelector('.file-upload__filename');
        this.elements.fileLabels.fragment = this.elements.fragmentFileInput?.parentElement.querySelector('.file-upload__filename');
        
        // Validate required elements
        if (!this.elements.instructions || !this.elements.forms) {
            throw new Error('Required mode manager elements not found');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for mode changes
        if (this.eventBus) {
            this.eventBus.on('mode:changed', this.handleModeChange);
            this.eventBus.on('app:modeChanged', this.handleModeChange);
        }
        
        // Input change listeners
        this.setupInputListeners();
        
        // File change listeners
        this.setupFileListeners();
    }

    /**
     * Set up input change listeners
     */
    setupInputListeners() {
        const inputElements = [
            this.elements.scaffoldSmilesInput,
            this.elements.fragment1Input,
            this.elements.fragment2Input
        ].filter(Boolean);
        
        inputElements.forEach(input => {
            input.addEventListener('input', this.handleInputChange);
            input.addEventListener('blur', this.handleInputChange);
        });
    }

    /**
     * Set up file upload listeners
     */
    setupFileListeners() {
        const fileInputs = [
            { input: this.elements.scaffoldFileInput, type: 'scaffold' },
            { input: this.elements.fragmentFileInput, type: 'fragment' }
        ].filter(item => item.input);
        
        fileInputs.forEach(({ input, type }) => {
            input.addEventListener('change', (event) => {
                this.handleFileChange(event, type);
            });
        });
    }

    /**
     * Handle mode change events
     * @param {string} newMode - The newly selected mode
     */
    handleModeChange(newMode) {
        // Handle both direct mode strings and mode change objects
        const mode = typeof newMode === 'string' ? newMode : newMode.current;
        
        if (mode === this.state.currentMode) return;
        
        const previousMode = this.state.currentMode;
        this.state.currentMode = mode;
        
        console.log(`🔄 ModeManager switching: ${previousMode} → ${mode}`);
        
        // Update content with animation
        this.updateModeContent(mode);
        
        // Clear form data when switching modes
        this.clearFormData();
    }

    /**
     * Update mode-specific content
     * @param {string} mode - The mode to display content for
     */
    updateModeContent(mode) {
        const config = this.modeConfigs[mode];
        
        if (!config) {
            console.warn(`⚠️ No configuration found for mode: ${mode}`);
            return;
        }
        
        // Update instructions with smooth transition
        this.updateInstructions(config);
        
        // Update form visibility
        this.updateFormVisibility(config);
    }

    /**
     * Update mode instructions
     * @param {Object} config - Mode configuration
     */
    updateInstructions(config) {
        const instructionsHTML = `
            <h3>${config.title}</h3>
            <p>${config.description}</p>
        `;
        
        // Smooth content transition
        this.elements.instructions.style.opacity = '0.5';
        
        setTimeout(() => {
            this.elements.instructions.innerHTML = instructionsHTML;
            this.elements.instructions.style.opacity = '1';
        }, 150);
    }

    /**
     * Update form visibility based on mode
     * @param {Object} config - Mode configuration
     */
    updateFormVisibility(config) {
        // Hide all forms first
        const allForms = this.elements.forms.querySelectorAll('.mode-form');
        allForms.forEach(form => {
            form.classList.remove('mode-form--active');
        });
        
        // Show relevant form if needed
        if (config.hasForm && config.formType) {
            const targetForm = this.elements.forms.querySelector(`[data-mode-form="${this.getFormModeKey(config.formType)}"]`);
            
            if (targetForm) {
                // Add slight delay for smooth transition
                setTimeout(() => {
                    targetForm.classList.add('mode-form--active');
                }, 100);
            }
        }
    }

    /**
     * Get form mode key based on form type
     * @param {string} formType - Type of form (scaffold, fragment)
     * @returns {string} Mode key for form selector
     */
    getFormModeKey(formType) {
        const typeToMode = {
            'scaffold': 'Scaffold Decoration',
            'fragment': 'Fragment Linking'
        };
        
        return typeToMode[formType] || '';
    }

    /**
     * Handle input field changes
     * @param {Event} event - Input change event
     */
    handleInputChange(event) {
        const input = event.target;
        const inputType = input.getAttribute('data-input');
        const value = input.value.trim();
        
        // Update form data
        this.state.formData[inputType] = value;
        
        console.log(`📝 Input changed: ${inputType} = "${value}"`);
        
        // Emit form data change event
        if (this.eventBus) {
            this.eventBus.emit('form:dataChanged', {
                [inputType]: value
            });
        }
        
        // Add visual feedback for validation
        this.validateInput(input, value);
    }

    /**
     * Handle file upload changes
     * @param {Event} event - File change event
     * @param {string} type - Type of file upload (scaffold, fragment)
     */
    handleFileChange(event, type) {
        const file = event.target.files[0];
        const filename = file ? file.name : 'No file chosen';
        
        // Update filename display
        if (this.elements.fileLabels[type]) {
            this.elements.fileLabels[type].textContent = filename;
        }
        
        // Update form data
        this.state.formData[`${type}File`] = file;
        
        console.log(`📁 File ${type} changed: ${filename}`);
        
        // Emit form data change event
        if (this.eventBus) {
            this.eventBus.emit('form:dataChanged', {
                [`${type}File`]: file
            });
        }
    }

    /**
     * Validate input field and provide visual feedback
     * @param {HTMLInputElement} input - Input element to validate
     * @param {string} value - Input value
     */
    validateInput(input, value) {
        // Remove existing validation classes
        input.classList.remove('input-group__input--valid', 'input-group__input--invalid');
        
        // Basic validation based on input type
        const inputType = input.getAttribute('data-input');
        let isValid = true;
        
        if (inputType && inputType.includes('smiles')) {
            // Basic SMILES validation (non-empty and contains typical SMILES characters)
            isValid = value.length > 0 && /^[A-Za-z0-9\(\)\[\]@=#\-\+\.\\\/:]+$/.test(value);
        }
        
        // Apply validation styling
        if (value.length > 0) {
            input.classList.add(isValid ? 'input-group__input--valid' : 'input-group__input--invalid');
        }
    }

    /**
     * Clear all form data
     */
    clearFormData() {
        // Clear input fields
        const inputs = [
            this.elements.scaffoldSmilesInput,
            this.elements.fragment1Input,
            this.elements.fragment2Input
        ].filter(Boolean);
        
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('input-group__input--valid', 'input-group__input--invalid');
        });
        
        // Clear file inputs
        const fileInputs = [
            this.elements.scaffoldFileInput,
            this.elements.fragmentFileInput
        ].filter(Boolean);
        
        fileInputs.forEach(input => {
            input.value = '';
        });
        
        // Reset file labels
        Object.values(this.elements.fileLabels).forEach(label => {
            if (label) label.textContent = 'No file chosen';
        });
        
        // Clear form data state
        this.state.formData = {};
        
        console.log('🧹 Form data cleared');
    }

    /**
     * Get current form data
     * @returns {Object} Current form data
     */
    getFormData() {
        return { ...this.state.formData };
    }

    /**
     * Set form data programmatically
     * @param {Object} data - Form data to set
     */
    setFormData(data) {
        this.state.formData = { ...this.state.formData, ...data };
        
        // Update UI to reflect new data
        Object.entries(data).forEach(([key, value]) => {
            const input = this.element.querySelector(`[data-input="${key}"]`);
            if (input && typeof value === 'string') {
                input.value = value;
                this.validateInput(input, value);
            }
        });
    }

    /**
     * Render initial state
     */
    renderInitialState() {
        this.updateModeContent(this.state.currentMode);
    }

    /**
     * Reset component to initial state
     */
    reset() {
        this.state.currentMode = 'Select Mode';
        this.clearFormData();
        this.renderInitialState();
    }

    /**
     * Clean up component resources
     */
    destroy() {
        // Remove event listeners
        if (this.eventBus) {
            this.eventBus.off('mode:changed', this.handleModeChange);
            this.eventBus.off('app:modeChanged', this.handleModeChange);
        }
        
        // Remove input listeners
        const allInputs = this.element.querySelectorAll('input');
        allInputs.forEach(input => {
            input.removeEventListener('input', this.handleInputChange);
            input.removeEventListener('blur', this.handleInputChange);
            input.removeEventListener('change', this.handleFileChange);
        });
        
        // Clean up references
        this.elements = {};
        this.eventBus = null;
        
        console.log('🧹 ModeManager component destroyed');
    }
} 