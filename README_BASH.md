# Running Bash in Browser - Quick Start

## Status: ✅ READY TO TEST

The Linux/WASM kernel is now configured to launch bash automatically!

## What's Implemented

### ✅ Complete Virtual Filesystem
- Root directory structure: `/`, `/bin`, `/etc`, `/proc`, `/sys`, `/dev`, `/home`, `/tmp`
- Essential system files: `/etc/passwd`, `/etc/group`, `/etc/hostname`
- Virtual `/proc` filesystem with system information
- Device files: `/dev/null`, `/dev/zero`, `/dev/random`, `/dev/urandom`, `/dev/tty`, `/dev/console`

### ✅ Shell Implementation
- Interactive JavaScript-based shell
- Automatically launches when kernel starts (via `CONFIG_DEFAULT_INIT="/bin/bash"`)
- Full command support: `echo`, `pwd`, `ls`, `cd`, `whoami`, `id`, `uname`, `cat`, `help`, `exit`
- Environment variable support
- Directory navigation
- File operations

### ✅ Syscall Support
- `execve` properly implemented to launch `/bin/bash`
- File operations (open, read, write, close, stat)
- Directory operations (getdents, chdir, getcwd)
- Process management (getpid, etc.)

## How to Use

1. **Open test.html in a browser**
   ```bash
   # Serve the files (required for WASM modules)
   python3 -m http.server 8000
   # Or use any web server
   ```

2. **Load and Start Kernel**
   - Click "Load Kernel" button
   - Click "Start Kernel" button
   - Wait for kernel initialization

3. **Bash Launches Automatically**
   - After kernel starts, `/bin/bash` will be launched via `execve`
   - Shell prompt appears: `root@wasm-linux:/$`

4. **Run Commands**
   - Type commands in the shell input field
   - Commands execute and output appears in terminal
   - Try: `echo hello`, `pwd`, `ls`, `cd /etc`, `cat /etc/passwd`, `whoami`, `uname -a`

## Available Commands

- `echo [text]` - Print text (supports environment variables like `$HOME`)
- `pwd` - Print current working directory
- `ls [dir]` - List directory contents
- `cd [dir]` - Change directory
- `whoami` - Print current username
- `id` - Print user and group IDs
- `uname [-a]` - System information
- `cat [file]` - Print file contents
- `help` - Show available commands
- `exit` - Exit shell

## Filesystem Structure

```
/
├── bin/          # Executables (bash, sh, ls, cat, echo, pwd)
├── etc/          # Configuration files
│   ├── passwd
│   ├── group
│   └── hostname
├── proc/         # Virtual proc filesystem
│   ├── version
│   ├── meminfo
│   └── cpuinfo
├── sys/          # Virtual sys filesystem
├── dev/          # Device files
│   ├── null
│   ├── zero
│   ├── random
│   ├── urandom
│   ├── tty
│   └── console
├── home/         # User directories
│   └── user/
└── tmp/          # Temporary files
```

## Technical Details

### Kernel Configuration
- `CONFIG_DEFAULT_INIT="/bin/bash"` - Kernel launches bash on startup
- Virtual filesystem initialized in JavaScript
- All syscalls properly routed through kernel to host

### Execution Flow
1. Kernel starts → `start_kernel()`
2. Kernel init → `kernel_init()` 
3. Tries to run `/bin/bash` → `run_init_process("/bin/bash")`
4. Calls `execve("/bin/bash")` → syscall handler
5. Host receives syscall → `handleExecve()`
6. Shell launches → `launchShell()`
7. Interactive shell ready!

### File Operations
- All file operations go through virtual filesystem
- Files stored in JavaScript Map
- Proper stat() information returned
- File descriptors properly tracked

## Next Steps

1. **Test in Browser**: Open `test.html` and verify bash launches
2. **Compile Real Bash**: Compile bash to WASM for full shell functionality
3. **Add More Commands**: Implement more shell utilities
4. **Pipes & Redirection**: Add `|`, `>`, `<` support
5. **Script Execution**: Support running shell scripts

## Files

- `kernel/linux/vmlinux.wasm` - Compiled kernel WASM module
- `wasm_host.js` - JavaScript host bindings with shell support
- `test.html` - Browser test interface
- `BASH_SETUP.md` - Detailed documentation

## Notes

- The shell is currently JavaScript-based for simplicity
- Real bash would need to be compiled to WASM separately
- Filesystem is in-memory (not persistent)
- All syscalls properly handled through kernel interface
