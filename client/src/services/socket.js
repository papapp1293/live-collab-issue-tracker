import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found for socket connection');
            return;
        }

        const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        this.socket = io(SERVER_URL, {
            auth: {
                token: token
            }
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.socket.emit('user:online');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Issue events
    emitIssueCreated(issueData) {
        if (this.socket) {
            this.socket.emit('issue:created', issueData);
        }
    }

    emitIssueUpdated(issueData) {
        if (this.socket) {
            this.socket.emit('issue:updated', issueData);
        }
    }

    emitIssueDeleted(issueId) {
        if (this.socket) {
            this.socket.emit('issue:deleted', issueId);
        }
    }

    emitTyping(issueId, isTyping) {
        if (this.socket) {
            this.socket.emit('issue:typing', { issueId, isTyping });
        }
    }

    // Event listeners
    onIssueCreated(callback) {
        if (this.socket) {
            this.socket.on('issue:created', callback);
        }
    }

    onIssueUpdated(callback) {
        if (this.socket) {
            this.socket.on('issue:updated', callback);
        }
    }

    onIssueDeleted(callback) {
        if (this.socket) {
            this.socket.on('issue:deleted', callback);
        }
    }

    onUserTyping(callback) {
        if (this.socket) {
            this.socket.on('issue:typing', callback);
        }
    }

    onUserOnline(callback) {
        if (this.socket) {
            this.socket.on('user:online', callback);
        }
    }

    onUserOffline(callback) {
        if (this.socket) {
            this.socket.on('user:offline', callback);
        }
    }

    // Comment events
    emitCommentCreated(commentData) {
        if (this.socket) {
            this.socket.emit('comment:created', commentData);
        }
    }

    emitCommentUpdated(commentData) {
        if (this.socket) {
            this.socket.emit('comment:updated', commentData);
        }
    }

    emitCommentDeleted(commentData) {
        if (this.socket) {
            this.socket.emit('comment:deleted', commentData);
        }
    }

    onCommentCreated(callback) {
        if (this.socket) {
            this.socket.on('comment:created', callback);
        }
    }

    onCommentUpdated(callback) {
        if (this.socket) {
            this.socket.on('comment:updated', callback);
        }
    }

    onCommentDeleted(callback) {
        if (this.socket) {
            this.socket.on('comment:deleted', callback);
        }
    }

    // Remove listeners
    removeListener(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
