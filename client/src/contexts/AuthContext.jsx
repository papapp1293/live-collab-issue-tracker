import { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Initialize from localStorage on component mount
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (userData) => {
        setUser(userData);
        // Connect to socket when user logs in
        socketService.connect();
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Disconnect from socket when user logs out
        socketService.disconnect();
    };

    // Connect to socket if user is already logged in (page refresh)
    useEffect(() => {
        if (user && localStorage.getItem('token')) {
            socketService.connect();
        }

        // Cleanup on unmount
        return () => {
            socketService.disconnect();
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
