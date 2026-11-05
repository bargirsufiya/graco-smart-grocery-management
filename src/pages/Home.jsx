import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import Footer from "../components/Footer";

function Home({ onLogin, onRegister, onDemo }) {
  return (
    <>
      <Navbar
        onLogin={onLogin}
        onRegister={onRegister}
      />

      <main>
        <Hero
          onRegister={onRegister}
          onDemo={onDemo}
        />

        <Features />

        <About onRegister={onRegister} />
      </main>

      <Footer />
    </>
  );
}

export default Home;