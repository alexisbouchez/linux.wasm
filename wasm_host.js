/**
 * WASM Host Bindings for Linux Kernel
 * 
 * This JavaScript file provides the host functions that the WASM kernel
 * can call to interact with the browser environment.
 */

class LinuxWasmHost {
    constructor() {
        this.instance = null;
        this.memory = null;
        this.fdTable = new Map();  // File descriptor table
        this.nextFd = 3;  // Start after stdin(0), stdout(1), stderr(2)
        this.syscallHandlers = new Map();
        this.initTime = Date.now();
        this.currentDir = '/';
        this.filesystem = new Map();  // Virtual filesystem
        this.processes = new Map();   // Running processes
        this.programs = new Map();    // Loaded WASM programs
        this.stdinBuffer = [];       // Input buffer for stdin
        this.setupFilesystem();
    }

    /**
     * Set up initial virtual filesystem structure
     */
    setupFilesystem() {
        // Root directory structure
        this.filesystem.set('/', {
            type: 'directory',
            mode: 0o755,
            entries: new Set(['bin', 'etc', 'home', 'proc', 'sys', 'dev', 'tmp', 'usr', 'var'])
        });

        // /bin directory
        this.filesystem.set('/bin', {
            type: 'directory',
            mode: 0o755,
            entries: new Set(['bash', 'sh', 'ls', 'cat', 'echo', 'pwd'])
        });

        // /etc directory
        this.filesystem.set('/etc', {
            type: 'directory',
            mode: 0o755,
            entries: new Set(['passwd', 'group', 'hostname'])
        });

        // /proc directory (virtual)
        this.filesystem.set('/proc', {
            type: 'directory',
            mode: 0o555,
            entries: new Set(['version', 'meminfo', 'cpuinfo', 'self'])
        });

        // /sys directory (virtual)
        this.filesystem.set('/sys', {
            type: 'directory',
            mode: 0o555,
            entries: new Set()
        });

        // /dev directory
        this.filesystem.set('/dev', {
            type: 'directory',
            mode: 0o755,
            entries: new Set(['null', 'zero', 'random', 'urandom', 'tty', 'console'])
        });

        // /home directory
        this.filesystem.set('/home', {
            type: 'directory',
            mode: 0o755,
            entries: new Set(['user'])
        });

        // Essential files
        this.filesystem.set('/etc/passwd', {
            type: 'file',
            mode: 0o644,
            content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash\n'
        });

        this.filesystem.set('/etc/group', {
            type: 'file',
            mode: 0o644,
            content: 'root:x:0:\nuser:x:1000:\n'
        });

        this.filesystem.set('/etc/hostname', {
            type: 'file',
            mode: 0o644,
            content: 'wasm-linux\n'
        });

        // /proc files
        this.filesystem.set('/proc/version', {
            type: 'file',
            mode: 0o444,
            content: 'Linux version 6.1.0 (wasm) #1 SMP WASM\n'
        });

        this.filesystem.set('/proc/meminfo', {
            type: 'file',
            mode: 0o444,
            content: 'MemTotal:       262144 kB\nMemFree:        262144 kB\n'
        });

        this.filesystem.set('/proc/cpuinfo', {
            type: 'file',
            mode: 0o444,
            content: 'processor\t: 0\nmodel name\t: WebAssembly\n'
        });

        // Device files
        this.filesystem.set('/dev/null', { type: 'char', mode: 0o666, major: 1, minor: 3 });
        this.filesystem.set('/dev/zero', { type: 'char', mode: 0o666, major: 1, minor: 5 });
        this.filesystem.set('/dev/random', { type: 'char', mode: 0o666, major: 1, minor: 8 });
        this.filesystem.set('/dev/urandom', { type: 'char', mode: 0o666, major: 1, minor: 9 });
        this.filesystem.set('/dev/tty', { type: 'char', mode: 0o666, major: 5, minor: 0 });
        this.filesystem.set('/dev/console', { type: 'char', mode: 0o666, major: 5, minor: 1 });
    }

    /**
     * Initialize the WASM module
     */
    async init(wasmModule) {
        const imports = {
            env: {
                // Memory management
                wasm_host_print: this.print.bind(this),
                wasm_host_exit: this.exit.bind(this),
                
                // Time functions
                wasm_host_get_time: this.getTime.bind(this),
                wasm_host_sleep: this.sleep.bind(this),
                
                // System calls
                wasm_host_syscall: this.syscall.bind(this),
                
                // Memory
                memory: new WebAssembly.Memory({ initial: 256, maximum: 2048 })  // 256MB initial, 2GB max
            }
        };

        const result = await WebAssembly.instantiate(wasmModule, imports);
        this.instance = result.instance;
        this.memory = imports.env.memory;
        
        // Initialize kernel
        if (this.instance.exports.wasm_kernel_init) {
            this.instance.exports.wasm_kernel_init();
        }
        
        return this.instance;
    }

    /**
     * Start the kernel
     */
    start() {
        if (this.instance.exports.wasm_kernel_start) {
            this.instance.exports.wasm_kernel_start();
        }
    }

    /**
     * Print string from WASM memory
     */
    print(ptr) {
        if (!this.memory) return;
        const view = new Uint8Array(this.memory.buffer);
        let str = '';
        let i = ptr;
        while (view[i] !== 0) {
            str += String.fromCharCode(view[i]);
            i++;
        }
        console.log('[Kernel]', str);
    }

    /**
     * Exit the kernel
     */
    exit(code) {
        console.log(`[Kernel] Exiting with code ${code}`);
        // Could trigger cleanup or page reload
    }

    /**
     * Get current time in milliseconds (converted to jiffies)
     */
    getTime() {
        const now = Date.now();
        const elapsed = now - this.initTime;
        // Convert to jiffies (assuming 100 HZ = 10ms per jiffy)
        return Math.floor(elapsed / 10);
    }

    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        // In a real implementation, this would need to be async
        // For now, just a placeholder
        const start = Date.now();
        while (Date.now() - start < ms) {
            // Busy wait - in real implementation, use setTimeout or async
        }
    }

    /**
     * Handle system calls from the kernel
     */
    syscall(nr, arg1, arg2, arg3, arg4, arg5, arg6) {
        // System call numbers (from arch/wasm/include/asm/unistd.h)
        const syscalls = {
            // File operations
            open: 5,
            openat: 294,
            creat: 8,
            read: 3,
            write: 4,
            close: 6,
            lseek: 19,
            readv: 145,
            writev: 146,
            pread64: 180,
            pwrite64: 181,
            preadv: 333,
            pwritev: 334,
            
            // File status
            stat: 106,
            lstat: 107,
            fstat: 108,
            stat64: 195,
            lstat64: 196,
            fstat64: 197,
            fstatat64: 299,
            statfs: 99,
            fstatfs: 100,
            statfs64: 268,
            fstatfs64: 269,
            
            // Directory operations
            getdents: 141,
            getdents64: 220,
            readdir: 89,
            mkdir: 39,
            mkdirat: 295,
            rmdir: 40,
            
            // File manipulation
            unlink: 10,
            unlinkat: 300,
            link: 9,
            linkat: 302,
            symlink: 83,
            symlinkat: 303,
            rename: 38,
            renameat: 301,
            renameat2: 353,
            readlink: 85,
            readlinkat: 304,
            
            // File permissions
            chmod: 15,
            fchmod: 94,
            fchmodat: 305,
            chown: 182,
            lchown: 16,
            fchown: 95,
            fchownat: 297,
            access: 33,
            faccessat: 306,
            
            // File descriptors
            dup: 41,
            dup2: 63,
            dup3: 330,
            fcntl: 55,
            fcntl64: 221,
            ioctl: 54,
            
            // Working directory
            chdir: 12,
            fchdir: 133,
            getcwd: 183,
            
            // Pipes
            pipe: 42,
            pipe2: 331,
            
            // Truncate
            truncate: 92,
            ftruncate: 93,
            truncate64: 193,
            ftruncate64: 194,
            
            // Time
            time: 13,
            gettimeofday: 78,
            clock_gettime: 265,
            clock_getres: 266,
            clock_settime: 264,
            nanosleep: 162,
            
            // Signals
            kill: 37,
            tkill: 238,
            tgkill: 270,
            
            // Process
            fork: 2,
            vfork: 190,
            clone: 120,
            execve: 11,
            execveat: 358,
            waitpid: 7,
            wait4: 114,
            waitid: 284,
            
            // Random
            getrandom: 355
        };

        switch (nr) {
            // File operations
            case syscalls.open:
            case syscalls.openat:
            case syscalls.creat:
                return this.handleOpen(nr, arg1, arg2, arg3);
            
            case syscalls.read:
            case syscalls.readv:
            case syscalls.pread64:
            case syscalls.preadv:
                return this.handleRead(arg1, arg2, arg3);
            
            case syscalls.write:
            case syscalls.writev:
            case syscalls.pwrite64:
            case syscalls.pwritev:
                return this.handleWrite(arg1, arg2, arg3);
            
            case syscalls.close:
                return this.handleClose(arg1);
            
            case syscalls.lseek:
            case syscalls._llseek:
                return this.handleLseek(arg1, arg2, arg3);
            
            // File status
            case syscalls.stat:
            case syscalls.lstat:
            case syscalls.fstat:
            case syscalls.stat64:
            case syscalls.lstat64:
            case syscalls.fstat64:
            case syscalls.fstatat64:
                return this.handleStat(nr, arg1, arg2, arg3);
            
            case syscalls.statfs:
            case syscalls.fstatfs:
            case syscalls.statfs64:
            case syscalls.fstatfs64:
                return this.handleStatfs(nr, arg1, arg2);
            
            // Directory operations
            case syscalls.getdents:
            case syscalls.getdents64:
            case syscalls.readdir:
                return this.handleGetdents(arg1, arg2, arg3);
            
            case syscalls.mkdir:
            case syscalls.mkdirat:
                return this.handleMkdir(nr, arg1, arg2, arg3);
            
            case syscalls.rmdir:
                return this.handleRmdir(arg1);
            
            // File manipulation
            case syscalls.unlink:
            case syscalls.unlinkat:
                return this.handleUnlink(nr, arg1, arg2);
            
            case syscalls.link:
            case syscalls.linkat:
                return this.handleLink(nr, arg1, arg2, arg3);
            
            case syscalls.symlink:
            case syscalls.symlinkat:
                return this.handleSymlink(nr, arg1, arg2, arg3);
            
            case syscalls.rename:
            case syscalls.renameat:
            case syscalls.renameat2:
                return this.handleRename(nr, arg1, arg2, arg3);
            
            case syscalls.readlink:
            case syscalls.readlinkat:
                return this.handleReadlink(nr, arg1, arg2, arg3);
            
            // File permissions
            case syscalls.chmod:
            case syscalls.fchmod:
            case syscalls.fchmodat:
                return this.handleChmod(nr, arg1, arg2, arg3);
            
            case syscalls.chown:
            case syscalls.lchown:
            case syscalls.fchown:
            case syscalls.fchownat:
                return this.handleChown(nr, arg1, arg2, arg3);
            
            case syscalls.access:
            case syscalls.faccessat:
                return this.handleAccess(nr, arg1, arg2);
            
            // File descriptors
            case syscalls.dup:
            case syscalls.dup2:
            case syscalls.dup3:
                return this.handleDup(nr, arg1, arg2, arg3);
            
            case syscalls.fcntl:
            case syscalls.fcntl64:
                return this.handleFcntl(arg1, arg2, arg3);
            
            case syscalls.ioctl:
                return this.handleIoctl(arg1, arg2, arg3);
            
            // Working directory
            case syscalls.chdir:
            case syscalls.fchdir:
                return this.handleChdir(nr, arg1);
            
            case syscalls.getcwd:
                return this.handleGetcwd(arg1, arg2);
            
            // Pipes
            case syscalls.pipe:
            case syscalls.pipe2:
                return this.handlePipe(nr, arg1, arg2);
            
            // Truncate
            case syscalls.truncate:
            case syscalls.ftruncate:
            case syscalls.truncate64:
            case syscalls.ftruncate64:
                return this.handleTruncate(nr, arg1, arg2);
            
            // Time
            case syscalls.time:
                return Math.floor(Date.now() / 1000);
            
            case syscalls.gettimeofday:
                return this.handleGettimeofday(arg1, arg2);
            
            case syscalls.clock_gettime:
            case syscalls.clock_getres:
            case syscalls.clock_settime:
                return this.handleClock(nr, arg1, arg2, arg3);
            
            case syscalls.nanosleep:
                return this.handleNanosleep(arg1, arg2);
            
            // Signals
            case syscalls.kill:
            case syscalls.tkill:
            case syscalls.tgkill:
                return this.handleKill(nr, arg1, arg2);
            
            // Process (limited support in WASM)
            case syscalls.fork:
            case syscalls.vfork:
            case syscalls.clone:
                return this.handleFork(nr, arg1, arg2, arg3);
            
            case syscalls.execve:
            case syscalls.execveat:
                return this.handleExecve(nr, arg1, arg2, arg3);
            
            case syscalls.waitpid:
            case syscalls.wait4:
            case syscalls.waitid:
                return this.handleWait(nr, arg1, arg2, arg3);
            
            // Random
            case syscalls.getrandom:
                return this.handleGetrandom(arg1, arg2, arg3);
            
            default:
                console.warn(`[Kernel] Unhandled syscall ${nr}`);
                return -38;  // ENOSYS
        }
    }

    /**
     * Handle open/openat syscall
     */
    handleOpen(nr, pathname, flags, mode) {
        if (!this.memory) return -14;  // EFAULT
        
        // Read pathname from WASM memory
        const view = new Uint8Array(this.memory.buffer);
        let path = '';
        let i = pathname;
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            path += String.fromCharCode(view[i]);
            i++;
        }
        
        // Resolve relative paths
        path = this.resolvePath(path);
        
        console.log(`[Kernel] open("${path}", ${flags}, ${mode})`);
        
        // Check if file exists in virtual filesystem
        const file = this.filesystem.get(path);
        if (!file) {
            // File doesn't exist - check if we should create it
            if (flags & 0x200) {  // O_CREAT
                // Create new file
                this.filesystem.set(path, {
                    type: 'file',
                    mode: mode || 0o644,
                    content: '',
                    position: 0
                });
                
                const fd = this.nextFd++;
                this.fdTable.set(fd, {
                    path: path,
                    flags: flags,
                    mode: mode,
                    type: 'file',
                    position: 0
                });
                return fd;
            }
            return -2;  // ENOENT
        }
        
        // Check access permissions (simplified)
        if (file.type === 'directory' && (flags & 0x3) !== 0) {  // O_RDONLY
            return -21;  // EISDIR
        }
        
        // Allocate file descriptor
        const fd = this.nextFd++;
        this.fdTable.set(fd, {
            path: path,
            flags: flags,
            mode: mode,
            type: file.type,
            position: 0,
            file: file
        });
        
        return fd;
    }

    /**
     * Resolve relative paths
     */
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        // Resolve relative to current directory
        const base = this.currentDir === '/' ? '' : this.currentDir;
        return base + '/' + path;
    }

    /**
     * Handle read syscall
     */
    handleRead(fd, buf, count) {
        if (!this.memory) return -14;  // EFAULT
        
        // Handle stdin
        if (fd === 0) {
            // Read from shell input buffer
            if (this.stdinBuffer && this.stdinBuffer.length > 0) {
                const view = new Uint8Array(this.memory.buffer);
                const toRead = Math.min(count, this.stdinBuffer.length);
                for (let i = 0; i < toRead; i++) {
                    view[buf + i] = this.stdinBuffer.shift();
                }
                return toRead;
            }
            return 0;  // EOF or no data
        }
        
        const file = this.fdTable.get(fd);
        if (!file) return -9;  // EBADF
        
        // Handle device files
        if (file.type === 'char') {
            if (file.path === '/dev/null') {
                return 0;  // Always EOF
            } else if (file.path === '/dev/zero') {
                const view = new Uint8Array(this.memory.buffer);
                for (let i = 0; i < count; i++) {
                    view[buf + i] = 0;
                }
                return count;
            } else if (file.path === '/dev/random' || file.path === '/dev/urandom') {
                const view = new Uint8Array(this.memory.buffer);
                for (let i = 0; i < count; i++) {
                    view[buf + i] = Math.floor(Math.random() * 256);
                }
                return count;
            }
        }
        
        // Handle regular files
        if (file.file && file.file.content !== undefined) {
            const content = file.file.content;
            const view = new Uint8Array(this.memory.buffer);
            const pos = file.position || 0;
            const toRead = Math.min(count, content.length - pos);
            
            for (let i = 0; i < toRead; i++) {
                view[buf + i] = content.charCodeAt(pos + i);
            }
            
            file.position = pos + toRead;
            return toRead;
        }
        
        return 0;
    }

    /**
     * Handle write syscall
     */
    handleWrite(fd, buf, count) {
        if (!this.memory) return -14;  // EFAULT
        
        // Read data from WASM memory
        const view = new Uint8Array(this.memory.buffer);
        let data = '';
        for (let i = 0; i < count && (buf + i) < this.memory.buffer.byteLength; i++) {
            data += String.fromCharCode(view[buf + i]);
        }
        
        // Write to stdout/stderr
        if (fd === 1 || fd === 2) {
            // Output to terminal
            console.log(data);
            if (this.onShellOutput) {
                this.onShellOutput(data);
            }
        } else if (fd === 0) {
            // Can't write to stdin
            return -9;  // EBADF
        } else {
            // Write to file
            const file = this.fdTable.get(fd);
            if (!file) return -9;  // EBADF
            
            if (file.file && file.file.content !== undefined) {
                const pos = file.position || 0;
                const content = file.file.content;
                
                // Append or overwrite based on flags
                if (file.flags & 0x400) {  // O_APPEND
                    file.file.content = content + data;
                    file.position = file.file.content.length;
                } else {
                    const newContent = content.substring(0, pos) + data + content.substring(pos + data.length);
                    file.file.content = newContent;
                    file.position = pos + data.length;
                }
            } else {
                console.log(`[Kernel] Write to ${file.path}: ${data}`);
            }
        }
        
        return count;
    }

    /**
     * Handle close syscall
     */
    handleClose(fd) {
        // Don't close stdin/stdout/stderr
        if (fd < 3) {
            return 0;
        }
        
        if (this.fdTable.has(fd)) {
            this.fdTable.delete(fd);
            return 0;
        }
        return -9;  // EBADF
    }

    /**
     * Handle lseek syscall
     */
    handleLseek(fd, offset, whence) {
        const file = this.fdTable.get(fd);
        if (!file && fd >= 3) {
            return -9;  // EBADF
        }
        
        // For now, just return current position
        // In a real implementation, track file position
        return file ? (file.position || 0) : 0;
    }

    /**
     * Handle stat/fstat/lstat syscalls
     */
    handleStat(nr, pathname, statbuf) {
        if (!this.memory) return -14;  // EFAULT
        
        // Read pathname from WASM memory if needed
        let path = '';
        let file = null;
        
        if (nr === 108 || nr === 197) {  // fstat
            // Get file from file descriptor
            const fdFile = this.fdTable.get(pathname);
            if (!fdFile) return -9;  // EBADF
            path = fdFile.path;
            file = fdFile.file || this.filesystem.get(path);
        } else {
            // stat/lstat - read pathname
            const view = new Uint8Array(this.memory.buffer);
            let i = pathname;
            while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
                path += String.fromCharCode(view[i]);
                i++;
            }
            path = this.resolvePath(path);
            file = this.filesystem.get(path);
        }
        
        if (!file) {
            return -2;  // ENOENT
        }
        
        // Create stat structure
        const stat = new DataView(this.memory.buffer, statbuf);
        const now = Math.floor(Date.now() / 1000);
        
        // Determine file type and mode
        let mode = 0;
        let size = 0;
        
        if (file.type === 'directory') {
            mode = 0o040755;  // S_IFDIR | 0755
        } else if (file.type === 'file') {
            mode = 0o100644;  // S_IFREG | 0644
            if (file.content !== undefined) {
                size = file.content.length;
            }
            // Make executables in /bin executable
            if (path.startsWith('/bin/')) {
                mode = 0o100755;  // S_IFREG | 0755
            }
        } else if (file.type === 'char') {
            mode = 0o020666;  // S_IFCHR | 0666
        }
        
        // Write stat structure (simplified - actual struct is more complex)
        stat.setUint32(0, 0x8000, true);  // st_dev
        stat.setUint32(4, 1, true);       // st_ino
        stat.setUint32(8, mode, true);    // st_mode
        stat.setUint32(12, 1, true);      // st_nlink
        stat.setUint32(16, 0, true);      // st_uid
        stat.setUint32(20, 0, true);      // st_gid
        stat.setUint32(24, file.major ? ((file.major << 8) | file.minor) : 0, true);  // st_rdev
        stat.setUint32(28, size, true);   // st_size
        stat.setUint32(32, 4096, true);   // st_blksize
        stat.setUint32(36, Math.ceil(size / 512), true);  // st_blocks
        stat.setUint32(40, now, true);    // st_atime
        stat.setUint32(44, now, true);    // st_mtime
        stat.setUint32(48, now, true);    // st_ctime
        
        return 0;
    }

    /**
     * Handle statfs/fstatfs syscalls
     */
    handleStatfs(nr, pathname, statfsbuf) {
        if (!this.memory) return -14;  // EFAULT
        
        const statfs = new DataView(this.memory.buffer, statfsbuf);
        
        // Write minimal statfs structure
        statfs.setUint32(0, 0xEF53, true);  // f_type (EXT2_SUPER_MAGIC)
        statfs.setUint32(4, 4096, true);    // f_bsize
        statfs.setUint32(8, 0, true);       // f_blocks
        statfs.setUint32(12, 0, true);      // f_bfree
        statfs.setUint32(16, 0, true);      // f_bavail
        statfs.setUint32(20, 0, true);     // f_files
        statfs.setUint32(24, 0, true);      // f_ffree
        
        return 0;
    }

    /**
     * Handle getdents/getdents64 syscalls
     */
    handleGetdents(fd, dirent, count) {
        if (!this.memory) return -14;  // EFAULT
        
        const file = this.fdTable.get(fd);
        if (!file || file.type !== 'directory') {
            return -9;  // EBADF
        }
        
        const dir = this.filesystem.get(file.path);
        if (!dir || dir.type !== 'directory') {
            return -20;  // ENOTDIR
        }
        
        // Build directory entries
        const entries = Array.from(dir.entries || []);
        const view = new Uint8Array(this.memory.buffer);
        let offset = 0;
        
        for (const entry of entries) {
            // Linux dirent structure: d_ino, d_off, d_reclen, d_name
            const name = entry;
            const reclen = 8 + 2 + name.length + 1;  // ino(8) + off(8) + reclen(2) + name + null
            const alignedReclen = (reclen + 7) & ~7;  // Align to 8 bytes
            
            if (offset + alignedReclen > count) break;
            
            const dataView = new DataView(this.memory.buffer, dirent + offset);
            dataView.setBigUint64(0, BigInt(1), true);  // d_ino
            dataView.setBigUint64(8, BigInt(offset), true);  // d_off
            dataView.setUint16(16, alignedReclen, true);  // d_reclen
            
            // Write name
            for (let i = 0; i < name.length; i++) {
                view[dirent + offset + 18 + i] = name.charCodeAt(i);
            }
            view[dirent + offset + 18 + name.length] = 0;
            
            offset += alignedReclen;
        }
        
        return offset;
    }

    /**
     * Handle mkdir/mkdirat syscalls
     */
    handleMkdir(nr, pathname, mode) {
        if (!this.memory) return -14;  // EFAULT
        
        const view = new Uint8Array(this.memory.buffer);
        let path = '';
        let i = pathname;
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            path += String.fromCharCode(view[i]);
            i++;
        }
        
        console.log(`[Kernel] mkdir("${path}", ${mode})`);
        // In a real implementation, create directory in virtual filesystem
        return 0;
    }

    /**
     * Handle rmdir syscall
     */
    handleRmdir(pathname) {
        if (!this.memory) return -14;  // EFAULT
        
        const view = new Uint8Array(this.memory.buffer);
        let path = '';
        let i = pathname;
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            path += String.fromCharCode(view[i]);
            i++;
        }
        
        console.log(`[Kernel] rmdir("${path}")`);
        return 0;
    }

    /**
     * Handle unlink/unlinkat syscalls
     */
    handleUnlink(nr, pathname, flags) {
        if (!this.memory) return -14;  // EFAULT
        
        const view = new Uint8Array(this.memory.buffer);
        let path = '';
        let i = pathname;
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            path += String.fromCharCode(view[i]);
            i++;
        }
        
        console.log(`[Kernel] unlink("${path}")`);
        return 0;
    }

    /**
     * Handle link/linkat syscalls
     */
    handleLink(nr, oldpath, newpath, flags) {
        if (!this.memory) return -14;  // EFAULT
        
        console.log(`[Kernel] link(${nr}, ${oldpath}, ${newpath})`);
        return 0;
    }

    /**
     * Handle symlink/symlinkat syscalls
     */
    handleSymlink(nr, target, linkpath) {
        if (!this.memory) return -14;  // EFAULT
        
        console.log(`[Kernel] symlink(${nr}, ${target}, ${linkpath})`);
        return 0;
    }

    /**
     * Handle rename/renameat/renameat2 syscalls
     */
    handleRename(nr, oldpath, newpath, flags) {
        if (!this.memory) return -14;  // EFAULT
        
        console.log(`[Kernel] rename(${nr}, ${oldpath}, ${newpath})`);
        return 0;
    }

    /**
     * Handle readlink/readlinkat syscalls
     */
    handleReadlink(nr, pathname, buf, bufsiz) {
        if (!this.memory) return -14;  // EFAULT
        
        // Return empty link target for now
        return 0;
    }

    /**
     * Handle chmod/fchmod/fchmodat syscalls
     */
    handleChmod(nr, pathname, mode) {
        if (!this.memory) return -14;  // EFAULT
        
        console.log(`[Kernel] chmod(${nr}, ${pathname}, ${mode})`);
        return 0;
    }

    /**
     * Handle chown/lchown/fchown/fchownat syscalls
     */
    handleChown(nr, pathname, owner, group) {
        if (!this.memory) return -14;  // EFAULT
        
        console.log(`[Kernel] chown(${nr}, ${pathname}, ${owner}, ${group})`);
        return 0;
    }

    /**
     * Handle access/faccessat syscalls
     */
    handleAccess(nr, pathname, mode) {
        if (!this.memory) return -14;  // EFAULT
        
        // Return success (file accessible)
        return 0;
    }

    /**
     * Handle dup/dup2/dup3 syscalls
     */
    handleDup(nr, oldfd, newfd, flags) {
        if (nr === 41) {  // dup
            const newFd = this.nextFd++;
            const file = this.fdTable.get(oldfd);
            if (file) {
                this.fdTable.set(newFd, { ...file });
                return newFd;
            }
            return -9;  // EBADF
        } else if (nr === 63) {  // dup2
            const file = this.fdTable.get(oldfd);
            if (file) {
                this.fdTable.set(newfd, { ...file });
                return newfd;
            }
            return -9;  // EBADF
        }
        return -38;  // ENOSYS
    }

    /**
     * Handle fcntl syscall
     */
    handleFcntl(fd, cmd, arg) {
        const file = this.fdTable.get(fd);
        if (!file && fd >= 3) {
            return -9;  // EBADF
        }
        
        // Basic fcntl support
        switch (cmd) {
            case 0:  // F_DUPFD
                const newFd = this.nextFd++;
                if (file) {
                    this.fdTable.set(newFd, { ...file });
                    return newFd;
                }
                return -9;
            case 1:  // F_GETFD
            case 2:  // F_SETFD
            case 3:  // F_GETFL
            case 4:  // F_SETFL
                return 0;  // Success
            default:
                return -22;  // EINVAL
        }
    }

    /**
     * Handle ioctl syscall
     */
    handleIoctl(fd, request, argp) {
        // Basic ioctl support - return success for most operations
        return 0;
    }

    /**
     * Handle chdir/fchdir syscalls
     */
    handleChdir(nr, pathname) {
        if (!this.memory) return -14;  // EFAULT
        
        const view = new Uint8Array(this.memory.buffer);
        let path = '';
        let i = pathname;
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            path += String.fromCharCode(view[i]);
            i++;
        }
        
        // Resolve path
        if (!path.startsWith('/')) {
            path = this.currentDir === '/' ? '/' + path : this.currentDir + '/' + path;
        }
        
        // Normalize path
        path = this.normalizePath(path);
        
        // Check if directory exists
        const dir = this.filesystem.get(path);
        if (!dir || dir.type !== 'directory') {
            return -2;  // ENOENT
        }
        
        console.log(`[Kernel] chdir("${path}")`);
        this.currentDir = path;
        return 0;
    }

    /**
     * Normalize a path (remove . and .. components)
     */
    normalizePath(path) {
        const parts = path.split('/').filter(p => p !== '' && p !== '.');
        const result = [];
        
        for (const part of parts) {
            if (part === '..') {
                if (result.length > 0) {
                    result.pop();
                }
            } else {
                result.push(part);
            }
        }
        
        return '/' + result.join('/');
    }

    /**
     * Handle getcwd syscall
     */
    handleGetcwd(buf, size) {
        if (!this.memory) return -14;  // EFAULT
        
        const cwd = this.currentDir || '/';
        const view = new Uint8Array(this.memory.buffer);
        
        if (cwd.length + 1 > size) {
            return -34;  // ERANGE
        }
        
        for (let i = 0; i < cwd.length; i++) {
            view[buf + i] = cwd.charCodeAt(i);
        }
        view[buf + cwd.length] = 0;
        
        return cwd.length;
    }

    /**
     * Handle pipe/pipe2 syscalls
     */
    handlePipe(nr, pipefd, flags) {
        if (!this.memory) return -14;  // EFAULT
        
        const view = new Uint32Array(this.memory.buffer);
        const readFd = this.nextFd++;
        const writeFd = this.nextFd++;
        
        this.fdTable.set(readFd, { type: 'pipe', direction: 'read' });
        this.fdTable.set(writeFd, { type: 'pipe', direction: 'write' });
        
        view[pipefd / 4] = readFd;
        view[pipefd / 4 + 1] = writeFd;
        
        return 0;
    }

    /**
     * Handle truncate/ftruncate syscalls
     */
    handleTruncate(nr, pathname, length) {
        if (!this.memory) return -14;  // EFAULT
        
        console.log(`[Kernel] truncate(${nr}, ${pathname}, ${length})`);
        return 0;
    }

    /**
     * Handle gettimeofday syscall
     */
    handleGettimeofday(tv, tz) {
        if (!this.memory) return -14;  // EFAULT
        
        const now = Date.now();
        const sec = Math.floor(now / 1000);
        const usec = (now % 1000) * 1000;
        
        const view = new DataView(this.memory.buffer, tv);
        view.setUint32(0, sec, true);      // tv_sec
        view.setUint32(4, usec, true);    // tv_usec
        
        return 0;
    }

    /**
     * Handle clock_gettime/clock_getres/clock_settime syscalls
     */
    handleClock(nr, clockid, tp) {
        if (!this.memory) return -14;  // EFAULT
        
        const now = Date.now();
        const sec = Math.floor(now / 1000);
        const nsec = (now % 1000) * 1000000;
        
        const view = new DataView(this.memory.buffer, tp);
        view.setUint32(0, sec, true);   // tv_sec
        view.setUint32(4, nsec, true);  // tv_nsec
        
        return 0;
    }

    /**
     * Handle nanosleep syscall
     */
    handleNanosleep(req, rem) {
        // For now, just return immediately
        // In a real implementation, would need async sleep
        return 0;
    }

    /**
     * Handle kill/tkill/tgkill syscalls
     */
    handleKill(nr, pid, sig) {
        console.log(`[Kernel] kill(${nr}, ${pid}, ${sig})`);
        // Signal delivery not fully implemented
        return 0;
    }

    /**
     * Handle waitpid/wait4/waitid syscalls
     */
    handleWait(nr, pid, status, options) {
        // No child processes in WASM for now
        return -10;  // ECHILD
    }

    /**
     * Handle getrandom syscall
     */
    handleGetrandom(buf, buflen, flags) {
        if (!this.memory) return -14;  // EFAULT
        
        const view = new Uint8Array(this.memory.buffer);
        for (let i = 0; i < buflen; i++) {
            view[buf + i] = Math.floor(Math.random() * 256);
        }
        
        return buflen;
    }

    /**
     * Handle fork/vfork/clone syscalls
     */
    handleFork(nr, flags, stack, ptid, ctid, tls) {
        // For WASM, we can't really fork processes
        // Return a new PID but it's the same process
        const newPid = this.nextFd++;  // Use as PID for now
        console.log(`[Kernel] fork/vfork/clone (${nr}) - returning PID ${newPid}`);
        return newPid;
    }

    /**
     * Handle execve/execveat syscalls - Load and execute WASM programs
     */
    handleExecve(nr, filename, argv, envp) {
        if (!this.memory) return -14;  // EFAULT
        
        // Read filename from WASM memory
        const view = new Uint8Array(this.memory.buffer);
        let path = '';
        let i = filename;
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            path += String.fromCharCode(view[i]);
            i++;
        }
        
        // Resolve path
        path = this.resolvePath(path);
        
        console.log(`[Kernel] execve("${path}")`);
        
        // Check if file exists in virtual filesystem
        const file = this.filesystem.get(path);
        if (!file) {
            console.warn(`[Kernel] File not found: ${path}`);
            return -2;  // ENOENT
        }
        
        if (file.type !== 'file') {
            return -13;  // EACCES (not executable)
        }
        
        // For bash/sh, we'll create a shell interface
        if (path === '/bin/bash' || path === '/bin/sh' || path.endsWith('/bash') || path.endsWith('/sh')) {
            return this.launchShell(path, argv, envp);
        }
        
        // For other programs, try to load as WASM module
        return this.loadProgram(path, argv, envp);
    }

    /**
     * Launch a shell (bash/sh)
     */
    launchShell(path, argv, envp) {
        console.log('[Kernel] Launching shell:', path);
        
        // Set up shell environment
        this.shellActive = true;
        this.shellPath = path;
        
        // Read argv and envp from memory
        let argvArray = [];
        let envpArray = [];
        
        if (argv) {
            argvArray = this.readStringArray(argv);
        }
        if (envp) {
            envpArray = this.readStringArray(envp);
        }
        
        // Default argv if not provided
        if (argvArray.length === 0) {
            argvArray = [path, '-i'];  // Interactive shell
        }
        
        console.log('[Kernel] Shell argv:', argvArray);
        console.log('[Kernel] Shell envp:', envpArray);
        
        // Set up environment
        this.shellEnv = {};
        for (const env of envpArray) {
            const [key, value] = env.split('=', 2);
            if (key) {
                this.shellEnv[key] = value || '';
            }
        }
        
        // Set default environment if empty
        if (Object.keys(this.shellEnv).length === 0) {
            this.shellEnv = {
                'HOME': '/home/user',
                'USER': 'user',
                'SHELL': '/bin/bash',
                'PATH': '/bin:/usr/bin:/sbin:/usr/sbin',
                'PWD': this.currentDir,
                'TERM': 'xterm-256color'
            };
        }
        
        // Create a shell prompt
        setTimeout(() => {
            this.printShellPrompt();
        }, 100);
        
        // Return success - shell is now "running"
        // In a real implementation, this would switch to userspace
        return 0;
    }

    /**
     * Read a null-terminated string array from WASM memory
     */
    readStringArray(ptr) {
        if (!this.memory || !ptr) return [];
        
        const view = new Uint32Array(this.memory.buffer);
        const strings = [];
        let i = 0;
        
        while (true) {
            const strPtr = view[ptr / 4 + i];
            if (strPtr === 0) break;
            
            const str = this.readString(strPtr);
            strings.push(str);
            i++;
        }
        
        return strings;
    }

    /**
     * Read a null-terminated string from WASM memory
     */
    readString(ptr) {
        if (!this.memory) return '';
        
        const view = new Uint8Array(this.memory.buffer);
        let str = '';
        let i = ptr;
        
        while (view[i] !== 0 && i < this.memory.buffer.byteLength) {
            str += String.fromCharCode(view[i]);
            i++;
        }
        
        return str;
    }

    /**
     * Print shell prompt
     */
    printShellPrompt() {
        const user = this.shellEnv.USER || 'root';
        const hostname = this.shellEnv.HOSTNAME || 'wasm-linux';
        const dir = this.currentDir === '/' ? '/' : this.currentDir.split('/').pop();
        const prompt = `${user}@${hostname}:${dir}$ `;
        console.log(prompt);
        // Also write to stdout if we have a terminal
        if (this.onShellOutput) {
            this.onShellOutput(prompt);
        }
    }

    /**
     * Load a WASM program
     */
    async loadProgram(path, argv, envp) {
        // Check if program is already loaded
        if (this.programs.has(path)) {
            const program = this.programs.get(path);
            return this.executeProgram(program, argv, envp);
        }
        
        // Try to load program from filesystem or fetch from server
        console.log(`[Kernel] Loading program: ${path}`);
        
        // For now, return error - programs need to be pre-compiled
        return -8;  // ENOEXEC
    }

    /**
     * Execute a loaded program
     */
    executeProgram(program, argv, envp) {
        // Execute the program
        // This would involve calling the program's main function
        console.log('[Kernel] Executing program');
        return 0;
    }

    /**
     * Handle shell input
     */
    handleShellInput(input) {
        if (!this.shellActive) return;
        
        const command = input.trim();
        
        if (command === 'exit' || command === 'logout') {
            this.shellActive = false;
            const output = 'exit\n';
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
            return;
        }
        
        if (command === '') {
            this.printShellPrompt();
            return;
        }
        
        // Execute simple commands
        if (command.startsWith('echo ')) {
            let text = command.substring(5);
            // Handle quotes
            if ((text.startsWith('"') && text.endsWith('"')) || 
                (text.startsWith("'") && text.endsWith("'"))) {
                text = text.slice(1, -1);
            }
            // Handle environment variables
            text = text.replace(/\$(\w+)/g, (match, var) => {
                return this.shellEnv[var] || '';
            });
            const output = text + '\n';
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        } else if (command === 'pwd') {
            const output = this.currentDir + '\n';
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        } else if (command.startsWith('cd ')) {
            const dir = command.substring(3).trim() || this.shellEnv.HOME || '/';
            // Simulate chdir syscall
            const oldDir = this.currentDir;
            const path = dir.startsWith('/') ? dir : (this.currentDir === '/' ? '/' + dir : this.currentDir + '/' + dir);
            const normalized = this.normalizePath(path);
            const dirEntry = this.filesystem.get(normalized);
            if (dirEntry && dirEntry.type === 'directory') {
                this.currentDir = normalized;
                this.shellEnv.PWD = normalized;
            } else {
                const output = `bash: cd: ${dir}: No such file or directory\n`;
                console.log(output);
                if (this.onShellOutput) {
                    this.onShellOutput(output);
                }
            }
        } else if (command === 'ls' || command.startsWith('ls ')) {
            this.handleLs(command);
        } else if (command === 'whoami') {
            const output = (this.shellEnv.USER || 'root') + '\n';
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        } else if (command === 'id') {
            const output = `uid=0(root) gid=0(root) groups=0(root)\n`;
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        } else if (command === 'uname' || command === 'uname -a') {
            const output = 'Linux wasm-linux 6.1.0 #1 SMP WASM\n';
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        } else if (command.startsWith('cat ')) {
            const filepath = command.substring(4).trim();
            this.handleCat(filepath);
        } else if (command === 'help' || command === '--help') {
            const output = `Available commands:
  echo [text]     - Print text
  pwd            - Print working directory
  ls [dir]       - List directory
  cd [dir]       - Change directory
  whoami         - Print username
  id             - Print user ID
  uname [-a]     - System information
  cat [file]     - Print file contents
  help           - Show this help
  exit           - Exit shell
`;
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        } else {
            const output = `bash: ${command.split(' ')[0]}: command not found\n`;
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
        }
        
        // Print prompt again
        this.printShellPrompt();
    }

    /**
     * Handle cat command
     */
    handleCat(filepath) {
        const path = filepath.startsWith('/') ? filepath : 
                     (this.currentDir === '/' ? '/' + filepath : this.currentDir + '/' + filepath);
        const normalized = this.normalizePath(path);
        const file = this.filesystem.get(normalized);
        
        if (!file) {
            const output = `cat: ${filepath}: No such file or directory\n`;
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
            return;
        }
        
        if (file.type === 'directory') {
            const output = `cat: ${filepath}: Is a directory\n`;
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
            return;
        }
        
        const content = file.content || '';
        const output = content + (content && !content.endsWith('\n') ? '\n' : '');
        console.log(output);
        if (this.onShellOutput) {
            this.onShellOutput(output);
        }
    }

    /**
     * Handle ls command
     */
    handleLs(command) {
        let targetDir = this.currentDir;
        
        // Parse ls arguments
        const args = command.split(' ').slice(1);
        if (args.length > 0 && !args[0].startsWith('-')) {
            targetDir = args[0].startsWith('/') ? args[0] : 
                       (this.currentDir === '/' ? '/' + args[0] : this.currentDir + '/' + args[0]);
            targetDir = this.normalizePath(targetDir);
        }
        
        const dir = this.filesystem.get(targetDir);
        if (!dir || dir.type !== 'directory') {
            const output = `ls: cannot access '${targetDir}': No such file or directory\n`;
            console.log(output);
            if (this.onShellOutput) {
                this.onShellOutput(output);
            }
            return;
        }
        
        const entries = Array.from(dir.entries || []).sort();
        const output = entries.join('  ') + '\n';
        console.log(output);
        if (this.onShellOutput) {
            this.onShellOutput(output);
        }
    }

    /**
     * Convert string to pointer in WASM memory (helper for testing)
     */
    stringToPtr(str) {
        // This is a placeholder - in real implementation would allocate in WASM memory
        return 0;
    }

    /**
     * Set callback for shell output
     */
    setShellOutputCallback(callback) {
        this.onShellOutput = callback;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LinuxWasmHost;
}
