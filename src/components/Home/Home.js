import Social from '../Social/Social';
import './Home.scss';

const HomeContent = {
  name: 'Taylor Silenzio',
  headline: 'I am a',
  // description: 'I am a full stack engineer with a passion for building great products
  //   and enabling others to perform their roles more effectively. I have architected
  //   and developed scalable RESTful backends and interactive web-based frontends.',
  // effects: [
  //   'Sphere',
  //   'Space',
  //   'Field',
  //   'Mesh',
  //   'Abstract',
  //   'Particles',
  //   'Glitch',
  // ],
  words: [
    'Software Engineer',
    // 'Full Stack Engineer',
    // 'Photographer',
    // 'Freelancer',
    // 'Gamer',
  ],
};

const Home = () => {
  return (
    <article className="home" id="home">
      <div className="content">
        <h1 className="name">
          {HomeContent.name}
        </h1>
        <p className="headline">
          {HomeContent.headline}
          {HomeContent.words.map((word, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <b key={idx}>{word}</b>
          ))}
        </p>
        <div className="social">
          <Social />
        </div>
      </div>
    </article>
  );
};

export default Home;
