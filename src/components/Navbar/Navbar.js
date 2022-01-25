// import React, { useState } from 'react';
import {
  FaHome,
  FaUserAlt,
  FaFileAlt,
  FaAddressCard,
} from 'react-icons/fa';
import './Navbar.scss';

const NavContent = [
  {
    caption: 'Home',
    link: '#home',
    icon: <FaHome />,
    activeClass: 'active',
  },
  {
    caption: 'About',
    link: '#about',
    icon: <FaUserAlt />,
    activeClass: '',
  },
  {
    caption: 'Blog',
    link: '#blog',
    icon: <FaFileAlt />,
    activeClass: '',
  },
  {
    caption: 'Contact',
    link: '#contact',
    icon: <FaAddressCard />,
    activeClass: '',
  },
];

const Navbar = () => {
  // const [links, setLinks] = useState({});

  // NavContent.forEach(item => {
  //   if (!links[item.link]) {
  //     const newLink = <a href={item.link}>{item.caption}</a>;
  //     setLinks(prevState => ({ ...prevState, [item.link]: newLink }));
  //   }
  // });

  return (
    <header className="navbar">
      <nav className="navbar__menu" role="navigation">
        <ul className="navbar__row">
          {NavContent.map(item => (
            <li key={item.link} className="navbar__list">
              <div className="navbar__inner">
                <a
                  href={item.link}
                  className={item.activeClass}
                >
                  {item.icon}
                  {item.caption}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
