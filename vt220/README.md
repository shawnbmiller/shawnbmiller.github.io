# VT220 Terminal Emulator

A web-based VT220 terminal emulator that runs the authentic VT220 ROM and can connect to a PTY on the host via WebSocket.

## Features

- **6502 CPU Emulation**: Emulates the 6502 processor used in the VT220
- **ROM Support**: Loads and executes authentic VT220 ROM images
- **Terminal Display**: 80x24 character display with green phosphor styling
- **Keyboard Input**: Full keyboard support including arrow keys and special keys
- **PTY Connection**: Connect to a host PTY via WebSocket for remote shell access
- **NVRAM Persistence**: Settings are saved in browser localStorage

## Usage

### 1. Loading the ROM

1. Click the "Load ROM" button
2. Select a VT220 ROM file (.bin or .rom)
3. The ROM will be loaded into memory

**Note**: If you don't have a VT220 ROM, a test ROM will be created automatically that displays "VT220" on the screen.

### 2. Running the Emulator

1. Click "Power On" to start the emulator
2. The emulator will reset the CPU and begin executing the ROM
3. The terminal display will show output from the ROM

### 3. Connecting to a PTY

To connect the emulator to a real terminal session on your host:

1. Set up a WebSocket server that provides PTY access (see below)
2. Click "Connect PTY"
3. Enter the WebSocket URL (default: ws://localhost:8080/pty)
4. The emulator will connect and you can interact with the host terminal

## WebSocket PTY Server

You'll need a WebSocket server that bridges to a PTY. Here's a simple example using Node.js:

```javascript
const WebSocket = require('ws');
const pty = require('node-pty');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    const shell = pty.spawn('bash', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });

    shell.on('data', (data) => {
        ws.send(data);
    });

    ws.on('message', (msg) => {
        shell.write(msg);
    });

    ws.on('close', () => {
        shell.kill();
    });
});
```

Install dependencies:
```bash
npm install ws node-pty
```

Run the server:
```bash
node pty-server.js
```

## Technical Details

### Architecture

- **CPU**: 6502 emulator with full instruction set
- **Memory Map**:
  - 0x0000-0x1FFF: RAM
  - 0x2000-0x27CF: Video RAM (80x24 characters)
  - 0x2800-0x2FCF: Attribute RAM
  - 0x3000-0x3003: UART and Keyboard I/O
  - 0x4000-0x40FF: NVRAM
  - 0x8000-0xFFFF: ROM

### Memory-Mapped I/O

- **0x3000**: UART data register (read: receive, write: transmit)
- **0x3001**: UART status register
- **0x3002**: Keyboard data register
- **0x3003**: Keyboard status register

## Browser Compatibility

Tested on:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## License

This emulator is provided as-is for educational purposes.

## Credits

Created as part of the shawnbmiller.github.io project collection.
