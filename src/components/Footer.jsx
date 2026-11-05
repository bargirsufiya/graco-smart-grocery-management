function Footer() {
  return (
    <footer className="bg-emerald-800 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center mb-4">
              <img
                src="https://img.icons8.com/fluency/48/000000/grocery-bag.png"
                alt="Graco Logo"
                className="h-8 w-8 mr-2"
              />

              <span className="font-semibold text-2xl">
                Graco
              </span>
            </div>

            <p className="max-w-xs">
              The smart way to manage your grocery shopping and never forget
              an item again.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Product
              </h3>

              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-emerald-200">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-200">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#home" className="hover:text-emerald-200">
                    Demo
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Company
              </h3>

              <ul className="space-y-2">
                <li>
                  <a href="#about" className="hover:text-emerald-200">
                    About
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-emerald-200">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-emerald-200">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Support
              </h3>

              <ul className="space-y-2">
                <li>
                  <a href="#about" className="hover:text-emerald-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-emerald-200">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-emerald-200">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-emerald-200 mb-4 md:mb-0">
            © 2026 Graco. All rights reserved.
          </p>

          <div className="flex space-x-6">
            <a href="#" className="text-2xl hover:text-emerald-200">
              <i className="fab fa-facebook"></i>
            </a>

            <a href="#" className="text-2xl hover:text-emerald-200">
              <i className="fab fa-twitter"></i>
            </a>

            <a href="#" className="text-2xl hover:text-emerald-200">
              <i className="fab fa-instagram"></i>
            </a>

            <a href="#" className="text-2xl hover:text-emerald-200">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;