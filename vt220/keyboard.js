/**
 * VT220 Keyboard Handler
 * Handles keyboard input and converts to VT220 key codes
 */
class VT220Keyboard {
    constructor(vt220) {
        this.vt220 = vt220;
        this.enabled = false;
    }
    
    enable() {
        this.enabled = true;
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keypress', this.handleKeyPress.bind(this));
    }
    
    disable() {
        this.enabled = false;
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keypress', this.handleKeyPress.bind(this));
    }
    
    handleKeyDown(event) {
        if (!this.enabled) return;
        
        // Handle special keys
        let keyCode = null;
        
        switch(event.key) {
            case 'ArrowUp':
                keyCode = 0x1B; // ESC
                this.vt220.receiveKey(keyCode);
                this.vt220.receiveKey(0x5B); // [
                this.vt220.receiveKey(0x41); // A
                event.preventDefault();
                break;
                
            case 'ArrowDown':
                keyCode = 0x1B; // ESC
                this.vt220.receiveKey(keyCode);
                this.vt220.receiveKey(0x5B); // [
                this.vt220.receiveKey(0x42); // B
                event.preventDefault();
                break;
                
            case 'ArrowRight':
                keyCode = 0x1B; // ESC
                this.vt220.receiveKey(keyCode);
                this.vt220.receiveKey(0x5B); // [
                this.vt220.receiveKey(0x43); // C
                event.preventDefault();
                break;
                
            case 'ArrowLeft':
                keyCode = 0x1B; // ESC
                this.vt220.receiveKey(keyCode);
                this.vt220.receiveKey(0x5B); // [
                this.vt220.receiveKey(0x44); // D
                event.preventDefault();
                break;
                
            case 'Enter':
                this.vt220.receiveKey(0x0D); // CR
                event.preventDefault();
                break;
                
            case 'Backspace':
                this.vt220.receiveKey(0x08); // BS
                event.preventDefault();
                break;
                
            case 'Tab':
                this.vt220.receiveKey(0x09); // TAB
                event.preventDefault();
                break;
                
            case 'Escape':
                this.vt220.receiveKey(0x1B); // ESC
                event.preventDefault();
                break;
                
            case 'Delete':
                this.vt220.receiveKey(0x7F); // DEL
                event.preventDefault();
                break;
        }
    }
    
    handleKeyPress(event) {
        if (!this.enabled) return;
        
        // Handle regular character input
        if (event.key.length === 1) {
            let charCode = event.key.charCodeAt(0);
            this.vt220.receiveKey(charCode);
            event.preventDefault();
        }
    }
}
