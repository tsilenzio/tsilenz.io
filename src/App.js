import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import About from './components/About/About';
import Blog from './components/Blog/Blog';
import Contact from './components/Contact/Contact';
import './App.scss';

const App = () => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div className="container">
      <Navbar />
      <main className="main-test">
        <Home />
        <About />
        <Blog />
        <Contact />
      </main>
    </div>
  );
};

export default App;
