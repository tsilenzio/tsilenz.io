import {
  FiLinkedin,
  FiGithub,
  FiFacebook,
  FiInstagram,
} from 'react-icons/fi';

import {
  SiStackoverflow,
} from 'react-icons/si';

import {
  ImSteam,
} from 'react-icons/im';

const SocialShare = [
  {
    name: 'LinkedIn',
    icon: <FiLinkedin />,
    link: 'https://www.linkedin.com/in/tsilenzio/',
  },
  {
    name: 'Github',
    icon: <FiGithub />,
    link: 'https://github.com/tsilenzio/',
  },
  {
    name: 'StackOverflow',
    icon: <SiStackoverflow />,
    link: 'https://stackoverflow.com/users/4954281/taylor-silenzio/',
  },
  {
    name: 'Steam',
    icon: <ImSteam />,
    link: 'https://steamcommunity.com/id/nebXden/',
  },
  {
    name: 'Facebook',
    icon: <FiFacebook />,
    link: 'https://www.facebook.com/tsilenzio/',
  },
  {
    name: 'Instagram',
    icon: <FiInstagram />,
    link: 'https://instagram.com/tsilenzio/',
  },
];
const Social = () => {
  return (
    <ul>
      {SocialShare.map(item => (
        <li key={item.name}>
          <a href={item.link} target="_blank" rel="noreferrer">
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default Social;
