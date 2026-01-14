/**
 * Alpine Linux Integration Script
 * 
 * This script integrates Alpine Linux rootfs into the WASM virtual filesystem
 */

const fs = require('fs');
const path = require('path');

class AlpineIntegrator {
    constructor(rootfsPath, wasmHost) {
        this.rootfsPath = rootfsPath;
        this.wasmHost = wasmHost;
    }

    /**
     * Load Alpine rootfs into virtual filesystem
     */
    async integrate() {
        console.log('Integrating Alpine Linux rootfs...');
        
        // Read Alpine rootfs structure
        const alpineFiles = this.readAlpineRootfs(this.rootfsPath);
        
        // Merge into virtual filesystem
        this.mergeIntoVirtualFS(alpineFiles);
        
        console.log(`Integrated ${alpineFiles.length} files/directories from Alpine`);
    }

    /**
     * Read Alpine rootfs structure recursively
     */
    readAlpineRootfs(rootPath) {
        const files = [];
        
        function traverse(dir, basePath = '') {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const virtualPath = basePath ? `${basePath}/${entry.name}` : `/${entry.name}`;
                
                if (entry.isDirectory()) {
                    files.push({
                        path: virtualPath,
                        type: 'directory',
                        realPath: fullPath
                    });
                    traverse(fullPath, virtualPath);
                } else if (entry.isFile()) {
                    const content = fs.readFileSync(fullPath);
                    files.push({
                        path: virtualPath,
                        type: 'file',
                        content: content,
                        mode: fs.statSync(fullPath).mode,
                        size: content.length
                    });
                } else if (entry.isSymbolicLink()) {
                    const target = fs.readlinkSync(fullPath);
                    files.push({
                        path: virtualPath,
                        type: 'symlink',
                        target: target
                    });
                }
            }
        }
        
        traverse(rootPath);
        return files;
    }

    /**
     * Merge Alpine files into virtual filesystem
     */
    mergeIntoVirtualFS(alpineFiles) {
        for (const file of alpineFiles) {
            if (file.type === 'directory') {
                this.wasmHost.filesystem.set(file.path, {
                    type: 'directory',
                    mode: 0o755,
                    entries: new Set()
                });
            } else if (file.type === 'file') {
                // For binary files, we'll need to handle them specially
                if (this.isBinary(file.path)) {
                    this.wasmHost.filesystem.set(file.path, {
                        type: 'file',
                        mode: file.mode || 0o755,
                        content: file.content,  // Binary content
                        isBinary: true,
                        size: file.size
                    });
                } else {
                    // Text files
                    this.wasmHost.filesystem.set(file.path, {
                        type: 'file',
                        mode: file.mode || 0o644,
                        content: file.content.toString('utf8'),
                        size: file.size
                    });
                }
            } else if (file.type === 'symlink') {
                this.wasmHost.filesystem.set(file.path, {
                    type: 'symlink',
                    target: file.target,
                    mode: 0o777
                });
            }
        }
        
        // Update directory entries
        for (const file of alpineFiles) {
            const dirPath = path.dirname(file.path);
            const dir = this.wasmHost.filesystem.get(dirPath === '.' ? '/' : dirPath);
            if (dir && dir.type === 'directory') {
                dir.entries.add(path.basename(file.path));
            }
        }
    }

    /**
     * Check if file is binary
     */
    isBinary(filePath) {
        const binaryExtensions = ['.so', '.bin', ''];
        const ext = path.extname(filePath);
        return binaryExtensions.includes(ext) || 
               filePath.startsWith('/bin/') ||
               filePath.startsWith('/sbin/') ||
               filePath.startsWith('/usr/bin/') ||
               filePath.startsWith('/usr/sbin/');
    }
}

module.exports = AlpineIntegrator;
