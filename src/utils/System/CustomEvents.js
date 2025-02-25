class CustomEventManager {
    constructor(client) {
        this.client = client;
        this.events = new Map();
    }

    on(eventName, callback, options = {}) {
        const event = {
            callback,
            once: options.once || false,
            timeout: options.timeout || null
        };

        this.events.set(eventName, event);
        
        if (event.timeout) {
            setTimeout(() => this.remove(eventName), event.timeout);
        }
    }

    emit(eventName, ...args) {
        const event = this.events.get(eventName);
        if (!event) return;

        event.callback(...args);
        
        if (event.once) {
            this.remove(eventName);
        }
    }
} 

module.exports = CustomEventManager;