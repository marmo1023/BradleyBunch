import React from "react";
import { Route, Routes } from "react-router-dom";

// Routes
import HomePageDisplay from "./components/homePage";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePageDisplay />} />
      </Routes>
    </div>
  );
}

export default App;