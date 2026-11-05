function About({ onRegister }) {
  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="graco-container">
        <div className="flex flex-col md:flex-row items-center">
          
          <div className="md:w-1/2 mb-8 md:mb-0">
            <img
              src="https://images.unsplash.com/photo-1606787366850-de6330128bfc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
              alt="Grocery Shopping"
              className="rounded-lg shadow-xl w-full"
            />
          </div>

          <div className="md:w-1/2 md:pl-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              About Graco
            </h2>

            <p className="text-gray-600 mb-4">
              Graco is designed to simplify your grocery shopping experience.
              Our mission is to help you save time, money and reduce food waste
              by better organizing your shopping.
            </p>

            <p className="text-gray-600 mb-6">
              With intuitive features and beautiful design, Graco makes grocery
              list management a pleasure rather than a chore.
            </p>

            <button
              onClick={onRegister}
              className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-full hover:bg-emerald-700 transition duration-300"
            >
              Join Now
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

export default About;