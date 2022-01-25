import {
  FaLinkedin,
  FaGithub,
  FaStackOverflow,
  FaFacebook,
  FaInstagram,
} from 'react-icons/fa';

const SocialShare = [
  {
    name: 'LinkedIn',
    icon: <FaLinkedin />,
    link: 'https://www.linkedin.com/in/tsilenzio/',
  },
  {
    name: 'Github',
    icon: <FaGithub />,
    link: 'https://github.com/tsilenzio/',
  },
  {
    name: 'StackOverflow',
    icon: <FaStackOverflow />,
    link: 'https://stackoverflow.com/users/4954281/taylor-silenzio/',
  },
  {
    name: 'Facebook',
    icon: <FaFacebook />,
    link: 'https://www.facebook.com/tsilenzio/',
  },
  {
    name: 'Instagram',
    icon: <FaInstagram />,
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
