/**
 * ================================================
 * ResultsDisplay Component
 * ================================================
 * 
 * Manages the display of molecule generation results.
 * Handles result formatting, error display, and loading states.
 * 
 * Features:
 * - Formatted molecule display with SMILES strings
 * - Loading state management
 * - Error handling and display
 * - Accessible result presentation
 * - Scrollable results container
 * 
 * @author MolGPT Team
 * ================================================
 */

export class ResultsDisplay {
    /**
     * Initialize the ResultsDisplay component
     * @param {HTMLElement} element - The results container element
     * @param {Object} options - Component options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.eventBus = options.eventBus;
        
        // Component state
        this.state = {
            isLoading: false,
            results: null,
            error: null,
            lastGeneration: null
        };
        
        // DOM element references
        this.elements = {
            content: null
        };
        
        // Bind methods to preserve context
        this.handleResultsDisplay = this.handleResultsDisplay.bind(this);
        this.handleShowProgress = this.handleShowProgress.bind(this);
        this.handleShowError = this.handleShowError.bind(this);
        this.handleClearResults = this.handleClearResults.bind(this);
        
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
            console.log('✅ ResultsDisplay component initialized');
        } catch (error) {
            console.error('❌ Failed to initialize ResultsDisplay:', error);
            throw error;
        }
    }

    /**
     * Cache DOM element references for performance
     */
    cacheElements() {
        this.elements.content = this.element.querySelector('[data-element="results-content"]');
        
        if (!this.elements.content) {
            throw new Error('Results content element not found');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (this.eventBus) {
            this.eventBus.on('results:display', this.handleResultsDisplay);
            this.eventBus.on('results:showProgress', this.handleShowProgress);
            this.eventBus.on('results:showError', this.handleShowError);
            this.eventBus.on('results:clear', this.handleClearResults);
        }
    }

    /**
     * Handle results display
     * @param {Object} results - Generation results to display
     */
    handleResultsDisplay(results) {
        console.log('📊 Displaying results:', results);
        
        this.state.isLoading = false;
        this.state.results = results;
        this.state.error = null;
        this.state.lastGeneration = new Date();
        
        this.renderResults(results);
    }

    /**
     * Handle progress display
     * @param {string} message - Progress message to show
     */
    handleShowProgress(message) {
        this.state.isLoading = true;
        this.state.error = null;
        
        this.renderProgress(message);
    }

    /**
     * Handle error display
     * @param {string|Error} error - Error to display
     */
    handleShowError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.state.isLoading = false;
        this.state.error = errorMessage;
        this.state.results = null;
        
        this.renderError(errorMessage);
    }

    /**
     * Handle clearing results
     */
    handleClearResults() {
        this.state.isLoading = false;
        this.state.results = null;
        this.state.error = null;
        
        this.clearContent();
    }

    /**
     * Render generation results
     * @param {Object} results - Results to render
     */
    renderResults(results) {
        const {
            generated_molecules = [],
            total_generated = 0,
            valid_molecules = 0
        } = results;
        
        // Create results summary
        const summaryHTML = this.createResultsSummary(total_generated, valid_molecules);
        
        // Create molecules list
        const moleculesHTML = this.createMoleculesList(generated_molecules);
        
        // Combine and render
        const resultsHTML = `
            ${summaryHTML}
            ${moleculesHTML}
        `;
        
        this.elements.content.innerHTML = resultsHTML;
        
        // Add accessibility attributes
        this.elements.content.setAttribute('aria-live', 'polite');
        this.elements.content.setAttribute('aria-label', `Generation results: ${total_generated} molecules generated, ${valid_molecules} valid`);
        
        // Scroll to top of results
        this.elements.content.scrollTop = 0;
    }

    /**
     * Create results summary HTML
     * @param {number} total - Total molecules generated
     * @param {number} valid - Valid molecules count
     * @returns {string} Summary HTML
     */
    createResultsSummary(total, valid) {
        const validPercentage = total > 0 ? Math.round((valid / total) * 100) : 0;
        
        return `
            <div class="results__summary">
                <p class="results__status">
                    <strong>Generation Complete!</strong> 
                    Generated ${total} molecules, ${valid} valid (${validPercentage}%).
                </p>
                ${this.createGenerationTimestamp()}
            </div>
        `;
    }

    /**
     * Create generation timestamp
     * @returns {string} Timestamp HTML
     */
    createGenerationTimestamp() {
        if (!this.state.lastGeneration) return '';
        
        const timestamp = this.state.lastGeneration.toLocaleTimeString();
        return `
            <p class="results__timestamp">
                Generated at ${timestamp}
            </p>
        `;
    }

    /**
     * Create molecules list HTML
     * @param {Array} molecules - Array of molecule objects
     * @returns {string} Molecules list HTML
     */
    createMoleculesList(molecules) {
        if (!molecules || molecules.length === 0) {
            return `
                <div class="results__empty">
                    <p>No molecules generated. Please try adjusting your parameters.</p>
                </div>
            `;
        }
        
        const moleculesHTML = molecules
            .map((molecule, index) => this.createMoleculeItem(molecule, index))
            .join('');
        
        return `
            <div class="results__molecule-list" id="mol-list">
                ${moleculesHTML}
            </div>
        `;
    }

    /**
     * Create individual molecule item HTML
     * @param {Object} molecule - Molecule data
     * @param {number} index - Molecule index
     * @returns {string} Molecule item HTML
     */
    createMoleculeItem(molecule, index) {
        const { smiles, valid = true } = molecule;
        const validityClass = valid ? 'results__molecule-item--valid' : 'results__molecule-item--invalid';
        const validityLabel = valid ? '' : '<span class="results__validity-indicator">(invalid)</span>';
        
        return `
            <div class="results__molecule-item ${validityClass}">
                <span class="results__molecule-index">${index + 1}:</span>
                <code class="results__molecule-code">${this.escapeHtml(smiles)}</code>
                ${validityLabel}
            </div>
        `;
    }

    /**
     * Render progress/loading state
     * @param {string} message - Progress message
     */
    renderProgress(message) {
        const progressHTML = `
            <div class="results__loading">
                <div class="results__loading-indicator">
                    <div class="results__spinner"></div>
                    <p class="results__loading-text">${this.escapeHtml(message)}</p>
                </div>
            </div>
        `;
        
        this.elements.content.innerHTML = progressHTML;
        this.elements.content.setAttribute('aria-live', 'polite');
        this.elements.content.setAttribute('aria-label', message);
    }

    /**
     * Render error state
     * @param {string} errorMessage - Error message to display
     */
    renderError(errorMessage) {
        const errorHTML = `
            <div class="results__error">
                <div class="results__error-icon">⚠️</div>
                <div class="results__error-content">
                    <h3 class="results__error-title">Generation Error</h3>
                    <p class="results__error-message">${this.escapeHtml(errorMessage)}</p>
                    <p class="results__error-suggestion">
                        Please check your inputs and try again. If the problem persists, 
                        ensure the API server is running and accessible.
                    </p>
                </div>
            </div>
        `;
        
        this.elements.content.innerHTML = errorHTML;
        this.elements.content.setAttribute('aria-live', 'assertive');
        this.elements.content.setAttribute('aria-label', `Error: ${errorMessage}`);
    }

    /**
     * Clear content
     */
    clearContent() {
        this.elements.content.innerHTML = '';
        this.elements.content.removeAttribute('aria-live');
        this.elements.content.removeAttribute('aria-label');
    }

    /**
     * Render initial state
     */
    renderInitialState() {
        const initialHTML = `
            <div class="results__welcome">
                <div class="results__welcome-content">
                    <h2 class="results__welcome-title">Ready to Generate Molecules</h2>
                    <p class="results__welcome-text">
                        Configure your generation parameters and click "Generate" to create molecules.
                    </p>
                    <div class="results__welcome-features">
                        <ul class="results__feature-list">
                            <li>🧪 Multiple generation modes</li>
                            <li>📊 Real-time results display</li>
                            <li>✨ AI-powered molecular design</li>
                            <li>📁 File upload support</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.content.innerHTML = initialHTML;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} unsafe - Unsafe HTML string
     * @returns {string} Escaped HTML string
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Export results as text
     * @returns {string} Results as formatted text
     */
    exportResultsAsText() {
        if (!this.state.results) return '';
        
        const { generated_molecules = [], total_generated = 0, valid_molecules = 0 } = this.state.results;
        
        let text = `MolGPT Generation Results\n`;
        text += `Generated: ${this.state.lastGeneration?.toLocaleString() || 'Unknown'}\n`;
        text += `Total molecules: ${total_generated}\n`;
        text += `Valid molecules: ${valid_molecules}\n\n`;
        
        text += `SMILES:\n`;
        generated_molecules.forEach((molecule, index) => {
            const validity = molecule.valid ? '' : ' (invalid)';
            text += `${index + 1}. ${molecule.smiles}${validity}\n`;
        });
        
        return text;
    }

    /**
     * Get current state
     * @returns {Object} Current component state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get current results
     * @returns {Object|null} Current results or null
     */
    getResults() {
        return this.state.results;
    }

    /**
     * Check if component is loading
     * @returns {boolean} Whether component is in loading state
     */
    isLoading() {
        return this.state.isLoading;
    }

    /**
     * Check if component has error
     * @returns {boolean} Whether component has error
     */
    hasError() {
        return this.state.error !== null;
    }

    /**
     * Get current error
     * @returns {string|null} Current error message or null
     */
    getError() {
        return this.state.error;
    }

    /**
     * Clean up component resources
     */
    destroy() {
        // Remove event listeners
        if (this.eventBus) {
            this.eventBus.off('results:display', this.handleResultsDisplay);
            this.eventBus.off('results:showProgress', this.handleShowProgress);
            this.eventBus.off('results:showError', this.handleShowError);
            this.eventBus.off('results:clear', this.handleClearResults);
        }
        
        // Clear content
        this.clearContent();
        
        // Clean up references
        this.elements = {};
        this.eventBus = null;
        
        console.log('🧹 ResultsDisplay component destroyed');
    }
} 