
import NavbarHome from '../components/NavbarHome';
import './Home.css';
import PostBox from '../components/PostBox';
import PostFeed from '../components/PostFeed';

function Home() {
  return (
    <div className="home-page">
      <NavbarHome />
      <PostBox />
      <PostFeed />

    </div>
  );
}

export default Home;

