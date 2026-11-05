import { useState } from "react";

function Navbar({ onLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-emerald-700 shadow-lg" id="mainNav">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center">

          {/* Logo */}
          <div>
            <a
              href="#home"
              className="flex items-center py-4 px-2"
            >
              <img
                src="https://img.icons8.com/fluency/48/000000/grocery-bag.png"
                alt="Graco Logo"
                className="h-8 w-8 mr-2"
              />

              <span className="font-semibold text-white text-2xl">
                Graco
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center gap-3"
            id="navLinks"
          >
            <a
              href="#home"
              className="py-2 px-2 text-white font-medium hover:text-emerald-100 transition duration-300"
            >
              Home
            </a>

            <a
              href="#features"
              className="py-2 px-2 text-white font-medium hover:text-emerald-100 transition duration-300"
            >
              Features
            </a>

            <a
              href="#about"
              className="py-2 px-2 text-white font-medium hover:text-emerald-100 transition duration-300"
            >
              About
            </a>

            <button
              onClick={onLogin}
              className="py-2 px-4 text-emerald-700 bg-white font-medium rounded-full hover:bg-emerald-100 transition duration-300"
            >
              Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              className="outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3">
            <a
              href="#home"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </a>

            <a
              href="#features"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>

            <a
              href="#about"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>

            <button
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-600"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;