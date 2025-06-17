/**
 * ================================================
 * EventBus Utility
 * ================================================
 * 
 * Provides a centralized event system for component communication.
 * Implements the publish-subscribe pattern for loose coupling.
 * 
 * Features:
 * - Event registration and emission
 * - Namespace support for event organization
 * - Error handling and debugging
 * - Memory leak prevention
 * 
 * @author MolGPT Team
 * ================================================
 */

export class EventBus {
    /**
     * Initialize the EventBus
     */
    constructor() {
        // Store event listeners
        this.events = new Map();
        
        // Debug flag for development
        this.debug = false;
        
        // Statistics for monitoring
        this.stats = {
            eventsEmitted: 0,
            eventsListened: 0,
            errors: 0
        };
        
        this.log('📡 EventBus initialized');
    }

    /**
     * Register an event listener
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @param {Object} options - Optional configuration
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, options = {}) {
        if (typeof eventName !== 'string' || !eventName) {
            throw new Error('Event name must be a non-empty string');
        }
        
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        // Initialize event array if it doesn't exist
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        // Create listener object
        const listener = {
            callback,
            once: options.once || false,
            context: options.context || null,
            id: this.generateListenerId()
        };
        
        // Add listener to event array
        this.events.get(eventName).push(listener);
        
        this.stats.eventsListened++;
        this.log(`📝 Registered listener for '${eventName}' (ID: ${listener.id})`);
        
        // Return unsubscribe function
        return () => this.off(eventName, listener.id);
    }

    /**
     * Register a one-time event listener
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @param {Object} options - Optional configuration
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback, options = {}) {
        return this.on(eventName, callback, { ...options, once: true });
    }

    /**
     * Remove event listener(s)
     * @param {string} eventName - Name of the event
     * @param {string|Function} callbackOrId - Callback function or listener ID to remove
     */
    off(eventName, callbackOrId) {
        if (!this.events.has(eventName)) {
            this.log(`⚠️ No listeners found for event '${eventName}'`);
            return;
        }
        
        const listeners = this.events.get(eventName);
        
        if (callbackOrId === undefined) {
            // Remove all listeners for this event
            this.events.delete(eventName);
            this.log(`🗑️ Removed all listeners for '${eventName}'`);
            return;
        }
        
        // Find and remove specific listener
        const isFunction = typeof callbackOrId === 'function';
        const initialLength = listeners.length;
        
        const filteredListeners = listeners.filter(listener => {
            if (isFunction) {
                return listener.callback !== callbackOrId;
            } else {
                return listener.id !== callbackOrId;
            }
        });
        
        if (filteredListeners.length === initialLength) {
            this.log(`⚠️ Listener not found for event '${eventName}'`);
            return;
        }
        
        if (filteredListeners.length === 0) {
            this.events.delete(eventName);
        } else {
            this.events.set(eventName, filteredListeners);
        }
        
        this.log(`🗑️ Removed listener for '${eventName}'`);
    }

    /**
     * Emit an event to all registered listeners
     * @param {string} eventName - Name of the event to emit
     * @param {...any} args - Arguments to pass to listeners
     * @returns {boolean} Whether any listeners were called
     */
    emit(eventName, ...args) {
        if (typeof eventName !== 'string' || !eventName) {
            throw new Error('Event name must be a non-empty string');
        }
        
        if (!this.events.has(eventName)) {
            this.log(`📢 No listeners for event '${eventName}'`);
            return false;
        }
        
        const listeners = [...this.events.get(eventName)]; // Copy to prevent modification during iteration
        let listenersTriggered = 0;
        
        this.log(`📢 Emitting '${eventName}' to ${listeners.length} listener(s)`, args);
        
        // Process each listener
        listeners.forEach(listener => {
            try {
                // Call listener with proper context
                if (listener.context) {
                    listener.callback.call(listener.context, ...args);
                } else {
                    listener.callback(...args);
                }
                
                listenersTriggered++;
                
                // Remove one-time listeners
                if (listener.once) {
                    this.off(eventName, listener.id);
                }
                
            } catch (error) {
                this.stats.errors++;
                console.error(`❌ Error in event listener for '${eventName}':`, error);
                
                // Emit error event for debugging
                if (eventName !== 'error') {
                    this.emit('error', {
                        event: eventName,
                        error,
                        listener: listener.id
                    });
                }
            }
        });
        
        this.stats.eventsEmitted++;
        this.log(`✅ Triggered ${listenersTriggered} listener(s) for '${eventName}'`);
        
        return listenersTriggered > 0;
    }

    /**
     * Get all registered event names
     * @returns {Array<string>} Array of event names
     */
    getEventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Get listener count for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of listeners
     */
    getListenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        return this.events.get(eventName).length;
    }

    /**
     * Get total listener count across all events
     * @returns {number} Total number of listeners
     */
    getTotalListenerCount() {
        let total = 0;
        for (const listeners of this.events.values()) {
            total += listeners.length;
        }
        return total;
    }

    /**
     * Check if event has any listeners
     * @param {string} eventName - Name of the event
     * @returns {boolean} Whether event has listeners
     */
    hasListeners(eventName) {
        return this.getListenerCount(eventName) > 0;
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners() {
        const eventCount = this.events.size;
        const listenerCount = this.getTotalListenerCount();
        
        this.events.clear();
        
        this.log(`🧹 Removed all listeners (${listenerCount} listeners across ${eventCount} events)`);
    }

    /**
     * Generate unique listener ID
     * @returns {string} Unique ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Enable or disable debug logging
     * @param {boolean} enabled - Whether to enable debug logging
     */
    setDebug(enabled) {
        this.debug = !!enabled;
        this.log(`🔧 Debug logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get event bus statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            activeEvents: this.events.size,
            totalListeners: this.getTotalListenerCount(),
            eventBreakdown: this.getEventBreakdown()
        };
    }

    /**
     * Get breakdown of events and their listener counts
     * @returns {Object} Event breakdown
     */
    getEventBreakdown() {
        const breakdown = {};
        for (const [eventName, listeners] of this.events.entries()) {
            breakdown[eventName] = listeners.length;
        }
        return breakdown;
    }

    /**
     * Log debug messages
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    log(message, ...args) {
        if (this.debug) {
            console.log(`[EventBus] ${message}`, ...args);
        }
    }

    /**
     * Create a namespaced event bus
     * @param {string} namespace - Namespace prefix
     * @returns {Object} Namespaced event bus interface
     */
    namespace(namespace) {
        if (typeof namespace !== 'string' || !namespace) {
            throw new Error('Namespace must be a non-empty string');
        }
        
        const namespacedBus = {
            on: (eventName, callback, options) => {
                return this.on(`${namespace}:${eventName}`, callback, options);
            },
            
            once: (eventName, callback, options) => {
                return this.once(`${namespace}:${eventName}`, callback, options);
            },
            
            off: (eventName, callbackOrId) => {
                return this.off(`${namespace}:${eventName}`, callbackOrId);
            },
            
            emit: (eventName, ...args) => {
                return this.emit(`${namespace}:${eventName}`, ...args);
            },
            
            hasListeners: (eventName) => {
                return this.hasListeners(`${namespace}:${eventName}`);
            },
            
            getListenerCount: (eventName) => {
                return this.getListenerCount(`${namespace}:${eventName}`);
            }
        };
        
        this.log(`🏷️ Created namespaced event bus: '${namespace}'`);
        
        return namespacedBus;
    }

    /**
     * Clean up event bus resources
     */
    destroy() {
        this.removeAllListeners();
        this.stats = { eventsEmitted: 0, eventsListened: 0, errors: 0 };
        this.log('🧹 EventBus destroyed');
    }
} 