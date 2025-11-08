import React from "react";
import { Route, Routes } from "react-router-dom";
import "./styles.css";

// Routes
import Account from "./components/Account";
import Exchange from './components/Exchange';
import History from './components/History';
import Login from './components/Login';
import Register from "./components/Register";
import Select from './components/Select';
import Transfer from './components/Transfer';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select" element={<Select />} />
        <Route path="/transfer" element={<Transfer />} />
      </Routes>
    </div>
  );
}

export default App;