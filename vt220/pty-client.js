/**
 * PTY Client
 * Connects to a WebSocket server that provides PTY access
 */
class PTYClient {
    constructor(vt220) {
        this.vt220 = vt220;
        this.ws = null;
        this.connected = false;
        this.url = 'ws://localhost:8080/pty';
    }
    
    connect(url) {
        if (url) {
            this.url = url;
        }
        
        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('PTY connected');
                this.connected = true;
                if (this.onStatusChange) {
                    this.onStatusChange('Connected to PTY');
                }
            };
            
            this.ws.onmessage = (event) => {
                // Receive data from PTY and send to VT220
                if (typeof event.data === 'string') {
                    this.vt220.receiveFromHost(event.data);
                } else if (event.data instanceof ArrayBuffer) {
                    let data = new Uint8Array(event.data);
                    this.vt220.receiveFromHost(data);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('PTY connection error:', error);
                if (this.onStatusChange) {
                    this.onStatusChange('PTY connection error');
                }
            };
            
            this.ws.onclose = () => {
                console.log('PTY disconnected');
                this.connected = false;
                if (this.onStatusChange) {
                    this.onStatusChange('PTY disconnected');
                }
            };
            
            // Connect VT220 output to PTY
            this.vt220.onDataToHost = (byte) => {
                this.send(byte);
            };
            
        } catch (error) {
            console.error('Failed to connect to PTY:', error);
            if (this.onStatusChange) {
                this.onStatusChange('Failed to connect to PTY');
            }
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }
    
    send(data) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            if (typeof data === 'number') {
                // Send single byte
                this.ws.send(String.fromCharCode(data));
            } else if (typeof data === 'string') {
                this.ws.send(data);
            } else if (data instanceof Uint8Array) {
                this.ws.send(data);
            }
        }
    }
    
    isConnected() {
        return this.connected;
    }
}
