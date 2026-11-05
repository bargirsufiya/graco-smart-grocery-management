// Common page frame for the module screens: app header, title and a Back button.

function ModuleShell({ title, icon, onBack, children }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <img
              src="https://img.icons8.com/fluency/48/000000/grocery-bag.png"
              alt="Graco Logo"
              className="h-8 w-8 mr-2"
            />
            <span className="font-semibold text-emerald-700 text-2xl">
              Graco
            </span>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-emerald-600 hover:text-emerald-800 font-medium"
          >
            <i className="fas fa-arrow-left mr-1"></i>
            Back to Lists
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {icon && <i className={`fas ${icon} mr-2 text-emerald-600`}></i>}
          {title}
        </h2>

        {children}
      </div>
    </section>
  );
}

export default ModuleShell;
