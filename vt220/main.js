/**
 * Main Application
 * Initializes and controls the VT220 emulator
 */

let vt220;
let display;
let keyboard;
let ptyClient;
let animationFrameId;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize VT220
    vt220 = new VT220();
    
    // Initialize display
    const canvas = document.getElementById('terminal');
    display = new VT220Display(canvas, vt220);
    
    // Initialize keyboard
    keyboard = new VT220Keyboard(vt220);
    
    // Initialize PTY client
    ptyClient = new PTYClient(vt220);
    ptyClient.onStatusChange = (status) => {
        updateStatus(status);
    };
    
    // Setup UI event handlers
    setupUI();
    
    // Initial render
    display.render();
    
    updateStatus('Ready - Load ROM to begin');
});

function setupUI() {
    const powerBtn = document.getElementById('powerBtn');
    const resetBtn = document.getElementById('resetBtn');
    const connectBtn = document.getElementById('connectBtn');
    const loadRomBtn = document.getElementById('loadRomBtn');
    const romFile = document.getElementById('romFile');
    
    // Power button
    powerBtn.addEventListener('click', () => {
        if (!vt220.powered) {
            if (vt220.powerOn()) {
                powerBtn.textContent = 'Power Off';
                document.querySelector('.header').classList.add('powered');
                keyboard.enable();
                startEmulation();
                updateStatus('Powered On');
            } else {
                updateStatus('Error: No ROM loaded');
            }
        } else {
            vt220.powerOff();
            powerBtn.textContent = 'Power On';
            document.querySelector('.header').classList.remove('powered');
            keyboard.disable();
            stopEmulation();
            updateStatus('Powered Off');
        }
    });
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        vt220.reset();
        display.render();
        updateStatus('Reset');
    });
    
    // Connect PTY button
    connectBtn.addEventListener('click', () => {
        if (!ptyClient.isConnected()) {
            const url = prompt('Enter WebSocket PTY URL:', 'ws://localhost:8080/pty');
            if (url) {
                ptyClient.connect(url);
                connectBtn.textContent = 'Disconnect PTY';
            }
        } else {
            ptyClient.disconnect();
            connectBtn.textContent = 'Connect PTY';
            updateStatus('PTY Disconnected');
        }
    });
    
    // Load ROM button
    loadRomBtn.addEventListener('click', () => {
        romFile.click();
    });
    
    // ROM file input
    romFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadROMFile(file);
        }
    });
}

function loadROMFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        vt220.loadROM(data);
        updateStatus(`ROM loaded: ${file.name} (${data.length} bytes)`);
        
        // Create a simple test ROM if this is a small file
        if (data.length < 1024) {
            updateStatus('Warning: ROM file seems too small. Using test ROM instead.');
            createTestROM();
        }
    };
    
    reader.onerror = () => {
        updateStatus('Error loading ROM file');
    };
    
    reader.readAsArrayBuffer(file);
}

function createTestROM() {
    // Create a simple test ROM that writes to video RAM
    const testROM = new Uint8Array(32768);
    
    // Fill with NOPs
    testROM.fill(0xEA);
    
    // Simple program at reset vector
    let pc = 0x0000;
    
    // LDA #'V'
    testROM[pc++] = 0xA9;
    testROM[pc++] = 0x56;
    
    // STA $2000
    testROM[pc++] = 0x8D;
    testROM[pc++] = 0x00;
    testROM[pc++] = 0x20;
    
    // LDA #'T'
    testROM[pc++] = 0xA9;
    testROM[pc++] = 0x54;
    
    // STA $2001
    testROM[pc++] = 0x8D;
    testROM[pc++] = 0x01;
    testROM[pc++] = 0x20;
    
    // LDA #'2'
    testROM[pc++] = 0xA9;
    testROM[pc++] = 0x32;
    
    // STA $2002
    testROM[pc++] = 0x8D;
    testROM[pc++] = 0x02;
    testROM[pc++] = 0x20;
    
    // LDA #'2'
    testROM[pc++] = 0xA9;
    testROM[pc++] = 0x32;
    
    // STA $2003
    testROM[pc++] = 0x8D;
    testROM[pc++] = 0x03;
    testROM[pc++] = 0x20;
    
    // LDA #'0'
    testROM[pc++] = 0xA9;
    testROM[pc++] = 0x30;
    
    // STA $2004
    testROM[pc++] = 0x8D;
    testROM[pc++] = 0x04;
    testROM[pc++] = 0x20;
    
    // Infinite loop
    // JMP $8000
    testROM[pc++] = 0x4C;
    testROM[pc++] = 0x17;
    testROM[pc++] = 0x80;
    
    // Reset vector at 0x7FFC (0xFFFC in memory)
    testROM[0x7FFC] = 0x00;
    testROM[0x7FFD] = 0x80;
    
    // IRQ vector at 0x7FFE
    testROM[0x7FFE] = 0x00;
    testROM[0x7FFF] = 0x80;
    
    vt220.loadROM(testROM);
    updateStatus('Test ROM loaded');
}

function startEmulation() {
    let lastTime = performance.now();
    
    function emulationLoop(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Run CPU cycles (approximately 1 MHz)
        const cyclesPerMs = 1000;
        const cyclesToRun = Math.floor(deltaTime * cyclesPerMs);
        
        if (cyclesToRun > 0) {
            vt220.tick(cyclesToRun);
        }
        
        // Render display
        display.render();
        
        // Continue loop
        animationFrameId = requestAnimationFrame(emulationLoop);
    }
    
    animationFrameId = requestAnimationFrame(emulationLoop);
}

function stopEmulation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function updateStatus(message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        console.log('Status:', message);
    }
}

// Expose for debugging
window.vt220 = vt220;
window.display = display;
