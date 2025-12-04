import React from "react";
import { Route, Routes } from "react-router-dom";
import { SocketProvider } from './socket';

//Routes
import Start from './components/Start';
import Game from './components/Game';
import History from './components/History';

function App() {
  return (
    <div>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/game" element={<Game />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </SocketProvider>
    </div>
  );
}

export default App;