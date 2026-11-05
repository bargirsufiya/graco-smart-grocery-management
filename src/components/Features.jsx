function Features() {
  const features = [
    {
      icon: "fas fa-list-check",
      title: "Smart Lists",
      description:
        "Create multiple lists, categorize items, and set priorities for efficient shopping.",
    },
    {
      icon: "fas fa-users",
      title: "Shared Lists",
      description:
        "Collaborate with family or roommates on shared grocery lists in real-time.",
    },
    {
      icon: "fas fa-bolt",
      title: "Quick Add",
      description:
        "Add items quickly with our smart suggestions and barcode scanning.",
    },
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="graco-container">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">
          Amazing Features
        </h2>

        <div className="flex flex-wrap justify-center">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="w-full md:w-1/3 px-4 mb-8"
            >
              <div className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-xl transition duration-300 card-hover">
                <div className="text-emerald-500 mb-4">
                  <i className={`${feature.icon} text-4xl`}></i>
                </div>

                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>

                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;