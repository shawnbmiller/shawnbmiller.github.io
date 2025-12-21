/**
 * VT220 Display Renderer
 * Renders the terminal display to a canvas
 */
class VT220Display {
    constructor(canvas, vt220) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.vt220 = vt220;
        
        // Display properties
        this.charWidth = 10;
        this.charHeight = 20;
        this.cols = 80;
        this.rows = 24;
        
        // Constants
        this.SPACE_CHAR = 0x20;
        
        // Update canvas size
        this.canvas.width = this.cols * this.charWidth;
        this.canvas.height = this.rows * this.charHeight;
        
        // Colors (green phosphor terminal)
        this.backgroundColor = '#000000';
        this.foregroundColor = '#00ff00';
        this.cursorColor = '#00ff00';
        
        // Cursor blink
        this.cursorBlinkState = true;
        this.cursorBlinkInterval = null;
        
        // Font
        this.ctx.font = `${this.charHeight}px monospace`;
        this.ctx.textBaseline = 'top';
        
        this.startCursorBlink();
    }
    
    startCursorBlink() {
        this.cursorBlinkInterval = setInterval(() => {
            this.cursorBlinkState = !this.cursorBlinkState;
            this.renderCursor();
        }, 500);
    }
    
    renderCursor() {
        // Only render the cursor area for better performance
        const state = this.vt220.getDisplayState();
        const x = state.cursorX * this.charWidth;
        const y = state.cursorY * this.charHeight;
        
        if (this.cursorBlinkState && state.cursorVisible) {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(x, y + this.charHeight - 2, this.charWidth, 2);
        } else {
            // Clear cursor area
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x, y + this.charHeight - 2, this.charWidth, 2);
        }
    }
    
    stopCursorBlink() {
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
            this.cursorBlinkInterval = null;
        }
    }
    
    render() {
        // Clear screen
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get display state
        let state = this.vt220.getDisplayState();
        
        // Render characters
        this.ctx.fillStyle = this.foregroundColor;
        for (let y = 0; y < state.rows; y++) {
            for (let x = 0; x < state.cols; x++) {
                let index = y * state.cols + x;
                let charCode = state.videoRAM[index];
                
                // Skip spaces for efficiency
                if (charCode === this.SPACE_CHAR) continue;
                
                // Convert to character
                let char = String.fromCharCode(charCode);
                
                // Render character
                let px = x * this.charWidth;
                let py = y * this.charHeight;
                this.ctx.fillText(char, px, py);
            }
        }
        
        // Render cursor
        if (state.cursorVisible && this.cursorBlinkState) {
            let cx = state.cursorX * this.charWidth;
            let cy = state.cursorY * this.charHeight;
            
            this.ctx.fillStyle = this.cursorColor;
            this.ctx.fillRect(cx, cy + this.charHeight - 2, this.charWidth, 2);
        }
    }
    
    setColors(bg, fg) {
        this.backgroundColor = bg;
        this.foregroundColor = fg;
        this.render();
    }
}
