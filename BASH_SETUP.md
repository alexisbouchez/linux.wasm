# Running Bash in Browser - Setup Guide

## Overview

This document describes how to run bash (or a shell) from the Linux/WASM kernel in a browser environment.

## Current Implementation

### Virtual Filesystem
- Complete root filesystem structure (`/`, `/bin`, `/etc`, `/proc`, `/sys`, `/dev`, `/home`)
- Essential files (`/etc/passwd`, `/etc/group`, `/etc/hostname`)
- Virtual `/proc` filesystem with system information
- Device files (`/dev/null`, `/dev/zero`, `/dev/random`, `/dev/urandom`, `/dev/tty`, `/dev/console`)

### Shell Implementation
- JavaScript-based shell that interfaces with the kernel
- Supports basic commands: `echo`, `pwd`, `ls`, `cd`, `whoami`, `uname -a`
- Interactive terminal interface
- Proper file descriptor handling

### Process Execution
- `execve` syscall handling
- Program loading framework (ready for WASM programs)
- Process management structure

## How It Works

1. **Kernel Initialization**: Kernel starts and runs through initialization
2. **Init Process**: Kernel tries to launch `/bin/bash` (configured in `CONFIG_DEFAULT_INIT`)
3. **Execve Handling**: When `execve("/bin/bash")` is called:
   - Host checks if file exists in virtual filesystem
   - Launches shell interface
   - Sets up terminal I/O
4. **Shell Commands**: Commands are executed in JavaScript and interact with kernel via syscalls

## Usage

1. **Load Kernel**: Click "Load Kernel" button
2. **Start Kernel**: Click "Start Kernel" button
3. **Shell Launches**: After kernel initialization, bash will automatically launch
4. **Run Commands**: Type commands in the shell input field or use keyboard

## Supported Commands

- `echo <text>` - Print text
- `pwd` - Print working directory
- `ls` - List directory contents
- `cd <dir>` - Change directory
- `whoami` - Print current user
- `uname -a` - System information
- `exit` - Exit shell

## Filesystem Structure

```
/
├── bin/
│   ├── bash
│   ├── sh
│   ├── ls
│   ├── cat
│   ├── echo
│   └── pwd
├── etc/
│   ├── passwd
│   ├── group
│   └── hostname
├── proc/
│   ├── version
│   ├── meminfo
│   └── cpuinfo
├── sys/
├── dev/
│   ├── null
│   ├── zero
│   ├── random
│   ├── urandom
│   ├── tty
│   └── console
├── home/
│   └── user/
└── tmp/
```

## Future Enhancements

1. **Compile Real Bash**: Compile bash to WASM and load it as a real program
2. **More Commands**: Add more shell commands (cat, grep, etc.)
3. **Pipes**: Implement pipe support (`|`)
4. **Redirection**: Implement I/O redirection (`>`, `<`)
5. **Background Jobs**: Support background process execution
6. **Script Execution**: Run shell scripts
7. **Environment Variables**: Full environment variable support
8. **Command History**: Shell command history

## Technical Details

### Execve Flow
1. Kernel calls `execve("/bin/bash", argv, envp)`
2. Syscall handler forwards to `wasm_host_syscall()`
3. JavaScript host receives syscall
4. Host checks virtual filesystem for `/bin/bash`
5. Host launches shell interface
6. Shell becomes active and ready for commands

### File Operations
- All file operations go through virtual filesystem
- Files are stored in JavaScript Map structure
- File descriptors tracked in `fdTable`
- Proper stat() information returned

### Terminal I/O
- stdin (fd 0): Reads from input buffer
- stdout (fd 1): Writes to terminal output
- stderr (fd 2): Writes to terminal output
- Shell input handled via JavaScript event handlers

## Testing

To test the shell:

1. Open `test.html` in a browser
2. Click "Load Kernel"
3. Click "Start Kernel"
4. Wait for "Launching /bin/bash..." message
5. Type commands in the shell input field
6. Commands execute and output appears in terminal

## Notes

- The current implementation uses a JavaScript-based shell for simplicity
- Real bash would need to be compiled to WASM separately
- The filesystem is in-memory and not persistent
- All syscalls are properly handled through the kernel interface
