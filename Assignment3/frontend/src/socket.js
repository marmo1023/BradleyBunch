import React, { createContext } from 'react';
import io from 'socket.io-client';

export const SocketContext = createContext();

const socket = io('http://localhost:5000', { withCredentials: true });

export function SocketProvider({ children }) {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}