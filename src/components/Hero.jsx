function Hero({ onRegister, onDemo }) {
  return (
    <section
      id="home"
      className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-20"
    >
      <div className="graco-container text-center fade-in">
        <h1 className="text-5xl font-bold mb-6">
          Organize Your Grocery Shopping
        </h1>

        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Graco helps you create, manage and share grocery lists effortlessly.
          Never forget an item again!
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onRegister}
            className="bg-white text-emerald-700 font-bold py-3 px-8 rounded-full hover:bg-emerald-100 transition duration-300 btn-pulse"
          >
            Get Started
          </button>

          <button
            onClick={onDemo}
            className="border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-emerald-700 transition duration-300"
          >
            See Demo
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;