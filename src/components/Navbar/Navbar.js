// import React, { useState } from 'react';

import {
  RiHome2Line,
  RiUserLine,
  RiArticleLine,
  RiMailOpenLine,
} from 'react-icons/ri';

import './Navbar.scss';

const NavContent = [
  {
    caption: 'Home',
    link: '#home',
    icon: <RiHome2Line />,
    activeClass: 'active',
  },
  {
    caption: 'About',
    link: '#about',
    icon: <RiUserLine />,
    activeClass: '',
  },
  {
    caption: 'Blog',
    link: '#blog',
    icon: <RiArticleLine />,
    activeClass: '',
  },
  {
    caption: 'Contact',
    link: '#contact',
    icon: <RiMailOpenLine />,
    activeClass: '',
  },
];

const Navbar = () => {
  return (
    <header className="navbar">
      <nav className="navbar__menu" role="navigation">
        <ul className="navbar__row">
          {NavContent.map(item => (
            <li key={item.link} className="navbar__list">
              <div className="sidebar__inner">
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
