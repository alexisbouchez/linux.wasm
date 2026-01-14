/**
 * X11 Client Library
 * 
 * Provides Xlib-like API for X11 clients to connect to the X11 server.
 * This is a compatibility layer that translates Xlib calls to our JavaScript X11 server.
 */

class X11Client {
    constructor(displayString = ':0.0') {
        this.displayString = displayString;
        this.server = null; // Will be set when connecting
        this.connection = null;
        this.screen = null;
        this.root = null;
        this.defaultGC = null;
        
        // Resource tracking
        this.windows = new Map();
        this.pixmaps = new Map();
        this.gcs = new Map();
        this.fonts = new Map();
        
        console.log('[X11 Client] Created client for display:', displayString);
    }
    
    /**
     * Connect to X11 server
     */
    connect(server) {
        this.server = server;
        this.screen = {
            root: server.rootWindow.id,
            width: server.width,
            height: server.height,
            depth: 24,
            visual: 0
        };
        this.root = server.rootWindow.id;
        
        console.log('[X11 Client] Connected to server');
        return this;
    }
    
    /**
     * Create a window (XCreateWindow)
     */
    createWindow(parent, x, y, width, height, borderWidth, depth, class_, visual, attributes) {
        if (!this.server) {
            throw new Error('Not connected to X11 server');
        }
        
        const windowId = this.server.createWindow(
            parent || this.root,
            x, y, width, height,
            depth || this.screen.depth,
            visual || this.screen.visual,
            class_ || 1, // InputOutput
            attributes || {}
        );
        
        this.windows.set(windowId, {
            id: windowId,
            parent: parent || this.root,
            x, y, width, height
        });
        
        return windowId;
    }
    
    /**
     * Map a window (XMapWindow)
     */
    mapWindow(window) {
        if (!this.server) return;
        this.server.mapWindow(window);
    }
    
    /**
     * Unmap a window (XUnmapWindow)
     */
    unmapWindow(window) {
        if (!this.server) return;
        this.server.unmapWindow(window);
    }
    
    /**
     * Configure window (XConfigureWindow)
     */
    configureWindow(window, mask, values) {
        if (!this.server) return;
        this.server.configureWindow(window, values);
    }
    
    /**
     * Fill rectangle (XFillRectangle)
     */
    fillRectangle(window, gc, x, y, width, height) {
        if (!this.server) return;
        const color = this.gcs.get(gc)?.foreground || 0xffffff;
        this.server.fillRectangle(window, x, y, width, height, color);
    }
    
    /**
     * Draw text (XDrawString)
     */
    drawString(window, gc, x, y, string) {
        if (!this.server) return;
        const gcData = this.gcs.get(gc) || {};
        const color = gcData.foreground || 0xffffff;
        const font = gcData.font || '12px monospace';
        this.server.drawText(window, x, y, string, font, color);
    }
    
    /**
     * Create graphics context (XCreateGC)
     */
    createGC(window, mask, values) {
        const gcId = this.nextResourceId();
        const gc = {
            foreground: values?.foreground || 0xffffff,
            background: values?.background || 0x000000,
            font: values?.font || '12px monospace',
            lineWidth: values?.lineWidth || 1
        };
        this.gcs.set(gcId, gc);
        return gcId;
    }
    
    /**
     * Set foreground color (XSetForeground)
     */
    setForeground(gc, color) {
        const gcData = this.gcs.get(gc);
        if (gcData) {
            gcData.foreground = color;
        }
    }
    
    /**
     * Set background color (XSetBackground)
     */
    setBackground(gc, color) {
        const gcData = this.gcs.get(gc);
        if (gcData) {
            gcData.background = color;
        }
    }
    
    /**
     * Flush output (XFlush)
     */
    flush() {
        if (this.server) {
            this.server.render();
        }
    }
    
    /**
     * Get next resource ID
     */
    nextResourceId() {
        return 0x1000000 + this.gcs.size + this.windows.size; // Start from high IDs
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = X11Client;
}
export default X11Client;
