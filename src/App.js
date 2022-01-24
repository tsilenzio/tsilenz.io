import React, { useEffect } from "react";
import AOS from "aos";
import 'aos/dist/aos.css';
import Home from './components/Home/Home'

const App = () => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <Home />
  );
}

export default App;
