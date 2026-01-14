/**
 * Create Alpine Linux rootfs data structure for WASM integration
 * 
 * This script reads an Alpine rootfs and creates a JSON structure
 * that can be loaded into the WASM virtual filesystem
 */

const fs = require('fs');
const path = require('path');

class AlpineRootfsBuilder {
    constructor(rootfsPath) {
        this.rootfsPath = rootfsPath;
        this.output = [];
    }

    /**
     * Build rootfs structure
     */
    build() {
        console.log(`Building Alpine rootfs structure from: ${this.rootfsPath}`);
        
        if (!fs.existsSync(this.rootfsPath)) {
            console.error(`Rootfs path does not exist: ${this.rootfsPath}`);
            return null;
        }
        
        this.traverse(this.rootfsPath, '/');
        
        return this.output;
    }

    /**
     * Traverse directory tree
     */
    traverse(dirPath, virtualPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        // Create directory entry
        if (virtualPath !== '/') {
            this.output.push({
                path: virtualPath,
                type: 'directory',
                mode: this.getMode(dirPath),
                entries: entries.map(e => e.name)
            });
        }
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const vPath = virtualPath === '/' ? `/${entry.name}` : `${virtualPath}/${entry.name}`;
            
            try {
                if (entry.isDirectory()) {
                    this.traverse(fullPath, vPath);
                } else if (entry.isFile()) {
                    this.addFile(fullPath, vPath);
                } else if (entry.isSymbolicLink()) {
                    this.addSymlink(fullPath, vPath);
                }
            } catch (err) {
                console.warn(`Skipping ${vPath}: ${err.message}`);
            }
        }
    }

    /**
     * Add file to output
     */
    addFile(filePath, virtualPath) {
        const stat = fs.statSync(filePath);
        const isBinary = this.isBinaryFile(filePath);
        
        let content = '';
        if (!isBinary) {
            try {
                content = fs.readFileSync(filePath, 'utf8');
            } catch (err) {
                // Binary file read as text - skip content
                content = '';
            }
        }
        
        this.output.push({
            path: virtualPath,
            type: 'file',
            mode: stat.mode,
            size: stat.size,
            content: content,
            isBinary: isBinary
        });
    }

    /**
     * Add symlink to output
     */
    addSymlink(linkPath, virtualPath) {
        const target = fs.readlinkSync(linkPath);
        this.output.push({
            path: virtualPath,
            type: 'symlink',
            target: target,
            mode: 0o777
        });
    }

    /**
     * Check if file is binary
     */
    isBinaryFile(filePath) {
        // Check extension
        const ext = path.extname(filePath);
        const binaryExts = ['.so', '.bin', '.o', '.a', '.wasm'];
        if (binaryExts.includes(ext)) return true;
        
        // Check if in binary directories
        const binaryDirs = ['/bin/', '/sbin/', '/usr/bin/', '/usr/sbin/', '/lib/', '/usr/lib/'];
        if (binaryDirs.some(dir => filePath.includes(dir))) {
            // Try to read first few bytes to check for binary
            try {
                const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
                // Check for null bytes or non-text characters
                for (let i = 0; i < Math.min(512, buffer.length); i++) {
                    if (buffer[i] === 0) return true;
                }
            } catch (err) {
                return true; // Assume binary if can't read
            }
        }
        
        return false;
    }

    /**
     * Get file mode
     */
    getMode(filePath) {
        try {
            return fs.statSync(filePath).mode;
        } catch (err) {
            return 0o755;
        }
    }

    /**
     * Save to JSON file
     */
    save(outputPath) {
        const json = JSON.stringify(this.output, null, 2);
        fs.writeFileSync(outputPath, json);
        console.log(`Saved ${this.output.length} entries to ${outputPath}`);
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node create_alpine_rootfs.js <rootfs_path> [output.json]');
        process.exit(1);
    }
    
    const rootfsPath = args[0];
    const outputPath = args[1] || 'alpine_rootfs.json';
    
    const builder = new AlpineRootfsBuilder(rootfsPath);
    const result = builder.build();
    
    if (result) {
        builder.save(outputPath);
        console.log(`\nAlpine rootfs structure created: ${outputPath}`);
        console.log(`Total entries: ${result.length}`);
    }
}

module.exports = AlpineRootfsBuilder;
