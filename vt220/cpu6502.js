/**
 * 6502 CPU Emulator
 * The VT220 uses a 6502-based architecture
 */
class CPU6502 {
    constructor() {
        // Registers
        this.A = 0;      // Accumulator
        this.X = 0;      // X register
        this.Y = 0;      // Y register
        this.PC = 0;     // Program Counter
        this.SP = 0xFF;  // Stack Pointer
        this.P = 0x20;   // Processor Status (flags)
        
        // Memory (64KB)
        this.memory = new Uint8Array(0x10000);
        
        // Cycle counter
        this.cycles = 0;
        
        // Flag bit positions
        this.FLAG_C = 0x01; // Carry
        this.FLAG_Z = 0x02; // Zero
        this.FLAG_I = 0x04; // Interrupt Disable
        this.FLAG_D = 0x08; // Decimal Mode
        this.FLAG_B = 0x10; // Break
        this.FLAG_U = 0x20; // Unused (always 1)
        this.FLAG_V = 0x40; // Overflow
        this.FLAG_N = 0x80; // Negative
        
        // Memory mapped I/O handlers
        this.readHandlers = [];
        this.writeHandlers = [];
    }
    
    reset() {
        this.A = 0;
        this.X = 0;
        this.Y = 0;
        this.SP = 0xFF;
        this.P = 0x20;
        
        // Read reset vector
        this.PC = this.readWord(0xFFFC);
        this.cycles = 0;
    }
    
    // Memory access
    read(addr) {
        addr &= 0xFFFF;
        
        // Check for memory-mapped I/O handlers
        for (let handler of this.readHandlers) {
            if (addr >= handler.start && addr <= handler.end) {
                return handler.callback(addr);
            }
        }
        
        return this.memory[addr];
    }
    
    write(addr, value) {
        addr &= 0xFFFF;
        value &= 0xFF;
        
        // Check for memory-mapped I/O handlers
        for (let handler of this.writeHandlers) {
            if (addr >= handler.start && addr <= handler.end) {
                handler.callback(addr, value);
                return;
            }
        }
        
        this.memory[addr] = value;
    }
    
    readWord(addr) {
        let low = this.read(addr);
        let high = this.read(addr + 1);
        return (high << 8) | low;
    }
    
    // Register memory-mapped I/O handler
    registerReadHandler(start, end, callback) {
        this.readHandlers.push({ start, end, callback });
    }
    
    registerWriteHandler(start, end, callback) {
        this.writeHandlers.push({ start, end, callback });
    }
    
    // Load ROM into memory
    loadROM(data, offset = 0x8000) {
        for (let i = 0; i < data.length; i++) {
            this.memory[offset + i] = data[i];
        }
    }
    
    // Flag operations
    getFlag(flag) {
        return (this.P & flag) !== 0;
    }
    
    setFlag(flag, value) {
        if (value) {
            this.P |= flag;
        } else {
            this.P &= ~flag;
        }
    }
    
    updateZN(value) {
        this.setFlag(this.FLAG_Z, (value & 0xFF) === 0);
        this.setFlag(this.FLAG_N, (value & 0x80) !== 0);
    }
    
    // Stack operations
    push(value) {
        this.write(0x0100 | this.SP, value);
        this.SP = (this.SP - 1) & 0xFF;
    }
    
    pop() {
        this.SP = (this.SP + 1) & 0xFF;
        return this.read(0x0100 | this.SP);
    }
    
    pushWord(value) {
        this.push((value >> 8) & 0xFF);
        this.push(value & 0xFF);
    }
    
    popWord() {
        let low = this.pop();
        let high = this.pop();
        return (high << 8) | low;
    }
    
    // Execute one instruction
    step() {
        let opcode = this.read(this.PC);
        this.PC = (this.PC + 1) & 0xFFFF;
        
        this.executeOpcode(opcode);
    }
    
    // Execute multiple cycles
    execute(cycleCount) {
        let targetCycles = this.cycles + cycleCount;
        while (this.cycles < targetCycles) {
            this.step();
        }
    }
    
    executeOpcode(opcode) {
        // Simplified instruction set - implement common opcodes
        switch(opcode) {
            case 0x00: // BRK
                this.pushWord(this.PC + 1);
                this.push(this.P | this.FLAG_B);
                this.setFlag(this.FLAG_I, true);
                this.PC = this.readWord(0xFFFE);
                this.cycles += 7;
                break;
                
            case 0xA9: // LDA Immediate
                this.A = this.read(this.PC++);
                this.updateZN(this.A);
                this.cycles += 2;
                break;
                
            case 0xA2: // LDX Immediate
                this.X = this.read(this.PC++);
                this.updateZN(this.X);
                this.cycles += 2;
                break;
                
            case 0xA0: // LDY Immediate
                this.Y = this.read(this.PC++);
                this.updateZN(this.Y);
                this.cycles += 2;
                break;
                
            case 0x85: // STA Zero Page
                this.write(this.read(this.PC++), this.A);
                this.cycles += 3;
                break;
                
            case 0x8D: // STA Absolute
                this.write(this.readWord(this.PC), this.A);
                this.PC += 2;
                this.cycles += 4;
                break;
                
            case 0x4C: // JMP Absolute
                this.PC = this.readWord(this.PC);
                this.cycles += 3;
                break;
                
            case 0x20: // JSR
                this.pushWord(this.PC + 1);
                this.PC = this.readWord(this.PC);
                this.cycles += 6;
                break;
                
            case 0x60: // RTS
                this.PC = (this.popWord() + 1) & 0xFFFF;
                this.cycles += 6;
                break;
                
            case 0xEA: // NOP
                this.cycles += 2;
                break;
                
            default:
                // For unimplemented opcodes, just advance
                console.warn(`Unimplemented opcode: 0x${opcode.toString(16).padStart(2, '0')} at PC: 0x${(this.PC-1).toString(16).padStart(4, '0')}`);
                this.cycles += 2;
                break;
        }
    }
}
