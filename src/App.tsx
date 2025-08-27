import React from 'react';
import { Outlet } from 'react-router-dom';
import './style/globals.css';

function App() {
  return (
    <div className="app">
      <Outlet />
    </div>
  );
}

export default App;