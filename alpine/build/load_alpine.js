/**
 * Load Alpine Linux rootfs into WASM virtual filesystem
 * 
 * This can be used in Node.js or browser environment
 */

async function loadAlpineRootfs(host, alpineRootfsPath = 'alpine/alpine_rootfs.json') {
    try {
        // In browser, use fetch
        if (typeof fetch !== 'undefined') {
            const response = await fetch(alpineRootfsPath);
            if (!response.ok) {
                console.warn(`Failed to load Alpine rootfs: ${response.status}`);
                return false;
            }
            const alpineRootfs = await response.json();
            await host.integrateAlpineRootfs(alpineRootfs);
            console.log('Alpine Linux rootfs loaded successfully');
            return true;
        } else {
            // In Node.js, use fs
            const fs = require('fs');
            const alpineRootfs = JSON.parse(fs.readFileSync(alpineRootfsPath, 'utf8'));
            await host.integrateAlpineRootfs(alpineRootfs);
            console.log('Alpine Linux rootfs loaded successfully');
            return true;
        }
    } catch (err) {
        console.error('Error loading Alpine rootfs:', err);
        return false;
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = loadAlpineRootfs;
}

// Also make available globally in browser
if (typeof window !== 'undefined') {
    window.loadAlpineRootfs = loadAlpineRootfs;
}
