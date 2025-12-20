/**
 * VT220 Terminal Emulator Core
 * Emulates the VT220 hardware including video RAM, NVRAM, and I/O
 */
class VT220 {
    constructor() {
        this.cpu = new CPU6502();
        
        // VT220 Configuration
        this.cols = 80;
        this.rows = 24;
        
        // Video memory (character cells)
        this.videoRAM = new Uint8Array(this.cols * this.rows);
        this.attrRAM = new Uint8Array(this.cols * this.rows);
        
        // NVRAM (settings storage)
        this.nvram = new Uint8Array(256);
        
        // Cursor position
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        
        // UART (serial communication)
        this.uartRxBuffer = [];
        this.uartTxBuffer = [];
        this.uartStatus = 0x01; // TX ready
        
        // Keyboard buffer
        this.keyboardBuffer = [];
        
        // Power state
        this.powered = false;
        
        // ROM loaded flag
        this.romLoaded = false;
        
        this.setupMemoryMap();
    }
    
    setupMemoryMap() {
        // Video RAM at 0x2000-0x27CF (80x24 = 1920 bytes)
        this.cpu.registerReadHandler(0x2000, 0x27CF, (addr) => {
            return this.videoRAM[addr - 0x2000];
        });
        
        this.cpu.registerWriteHandler(0x2000, 0x27CF, (addr, value) => {
            this.videoRAM[addr - 0x2000] = value;
        });
        
        // Attribute RAM at 0x2800-0x2FCF
        this.cpu.registerReadHandler(0x2800, 0x2FCF, (addr) => {
            return this.attrRAM[addr - 0x2800];
        });
        
        this.cpu.registerWriteHandler(0x2800, 0x2FCF, (addr, value) => {
            this.attrRAM[addr - 0x2800] = value;
        });
        
        // UART data register at 0x3000
        this.cpu.registerReadHandler(0x3000, 0x3000, (addr) => {
            if (this.uartRxBuffer.length > 0) {
                return this.uartRxBuffer.shift();
            }
            return 0;
        });
        
        this.cpu.registerWriteHandler(0x3000, 0x3000, (addr, value) => {
            this.uartTxBuffer.push(value);
            this.sendToHost(value);
        });
        
        // UART status register at 0x3001
        this.cpu.registerReadHandler(0x3001, 0x3001, (addr) => {
            let status = 0x01; // TX ready
            if (this.uartRxBuffer.length > 0) {
                status |= 0x02; // RX ready
            }
            return status;
        });
        
        // Keyboard data register at 0x3002
        this.cpu.registerReadHandler(0x3002, 0x3002, (addr) => {
            if (this.keyboardBuffer.length > 0) {
                return this.keyboardBuffer.shift();
            }
            return 0;
        });
        
        // Keyboard status register at 0x3003
        this.cpu.registerReadHandler(0x3003, 0x3003, (addr) => {
            return this.keyboardBuffer.length > 0 ? 0x01 : 0x00;
        });
        
        // NVRAM at 0x4000-0x40FF
        this.cpu.registerReadHandler(0x4000, 0x40FF, (addr) => {
            return this.nvram[addr - 0x4000];
        });
        
        this.cpu.registerWriteHandler(0x4000, 0x40FF, (addr, value) => {
            this.nvram[addr - 0x4000] = value;
            this.saveNVRAM();
        });
    }
    
    loadROM(data) {
        // VT220 ROM typically at 0x8000-0xFFFF (32KB)
        this.cpu.loadROM(data, 0x8000);
        this.romLoaded = true;
        console.log(`Loaded ${data.length} bytes of ROM`);
    }
    
    powerOn() {
        if (!this.romLoaded) {
            console.error('No ROM loaded!');
            return false;
        }
        
        this.powered = true;
        this.cpu.reset();
        this.clearScreen();
        this.loadNVRAM();
        console.log('VT220 powered on');
        return true;
    }
    
    powerOff() {
        this.powered = false;
        console.log('VT220 powered off');
    }
    
    reset() {
        if (this.powered) {
            this.cpu.reset();
            this.clearScreen();
            console.log('VT220 reset');
        }
    }
    
    clearScreen() {
        this.videoRAM.fill(0x20); // Fill with spaces
        this.attrRAM.fill(0x00);
        this.cursorX = 0;
        this.cursorY = 0;
    }
    
    // Execute CPU cycles
    tick(cycles = 1000) {
        if (this.powered) {
            this.cpu.execute(cycles);
        }
    }
    
    // Receive data from keyboard
    receiveKey(keyCode) {
        this.keyboardBuffer.push(keyCode);
    }
    
    // Receive data from host (via PTY)
    receiveFromHost(data) {
        if (typeof data === 'string') {
            for (let i = 0; i < data.length; i++) {
                this.uartRxBuffer.push(data.charCodeAt(i));
            }
        } else if (data instanceof Uint8Array || Array.isArray(data)) {
            this.uartRxBuffer.push(...data);
        }
    }
    
    // Send data to host (via PTY) - to be overridden
    sendToHost(byte) {
        // This will be connected to the PTY client
        if (this.onDataToHost) {
            this.onDataToHost(byte);
        }
    }
    
    // NVRAM persistence
    saveNVRAM() {
        try {
            localStorage.setItem('vt220_nvram', JSON.stringify(Array.from(this.nvram)));
        } catch (e) {
            console.error('Failed to save NVRAM:', e);
        }
    }
    
    loadNVRAM() {
        try {
            let data = localStorage.getItem('vt220_nvram');
            if (data) {
                let arr = JSON.parse(data);
                this.nvram.set(arr);
                console.log('NVRAM loaded from storage');
            }
        } catch (e) {
            console.error('Failed to load NVRAM:', e);
        }
    }
    
    // Get display state for rendering
    getDisplayState() {
        return {
            videoRAM: this.videoRAM,
            attrRAM: this.attrRAM,
            cursorX: this.cursorX,
            cursorY: this.cursorY,
            cursorVisible: this.cursorVisible,
            cols: this.cols,
            rows: this.rows
        };
    }
}
