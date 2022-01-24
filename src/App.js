import React, { useEffect } from "react";
import AOS from "aos";
import 'aos/dist/aos.css';
import logo from './logo.svg';
import './App.css';

const App = () => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
