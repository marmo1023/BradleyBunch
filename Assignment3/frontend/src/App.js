import React from "react";
import { Route, Routes } from "react-router-dom";
import { SocketProvider } from './socket';
import "./styles.css";

import Name from './components/Name';
import Select from './components/Select';
import Hangman from './components/Hangman';
import Highscores from './components/Highscores';

function App() {
  return (
    <div>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Name />} />
          <Route path="/select" element={<Select />} />
          <Route path="/game" element={<Hangman />} />
          <Route path="/scores" element={<Highscores />} />
        </Routes>
      </SocketProvider>
    </div>
  );
}

export default App;