
import { useEffect, useState } from "react";

// Online images — no downloads or images folder needed.
const serviceImages = {
  barber:
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80",
  beauty:
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80",
  photography:
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
  electrician:
    "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=80",
  development:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
  cleaning:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1000&q=80",
  default:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80",
};

function getServiceImage(name = "") {
  const value = name.toLowerCase();

  if (/barber|haircut|beard/.test(value)) return serviceImages.barber;
  if (/beauty|makeup|make-up|nail|cosmetic/.test(value))
    return serviceImages.beauty;
  if (/photo|camera|videograph/.test(value))
    return serviceImages.photography;
  if (/electric/.test(value)) return serviceImages.electrician;
  if (/web|develop|program|software|computer/.test(value))
    return serviceImages.development;
  if (/clean/.test(value)) return serviceImages.cleaning;

  return serviceImages.default;
}

function App() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const [categoriesResponse, servicesResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/categories"),
            fetch("http://localhost:5000/api/services"),
          ]);

        if (!categoriesResponse.ok || !servicesResponse.ok) {
          throw new Error("Unable to load data from the server.");
        }

        const categoriesData = await categoriesResponse.json();
        const servicesData = await servicesResponse.json();

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : categoriesData.data || []
        );

        setServices(
          Array.isArray(servicesData)
            ? servicesData
            : servicesData.data || []
        );
      } catch (err) {
        setError(
          err.message || "Something went wrong while connecting to the server."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredServices = services.filter((service) => {
    const searchTerm = search.toLowerCase();

    return (
      service.title?.toLowerCase().includes(searchTerm) ||
      service.professional_name?.toLowerCase().includes(searchTerm) ||
      service.category_name?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="text-2xl font-bold tracking-tight">
            Pro<span className="text-blue-500">Connect</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#categories" className="transition hover:text-white">
              Categories
            </a>
            <a href="#services" className="transition hover:text-white">
              Services
            </a>
          </nav>

          <a
            href="#services"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
          >
            Find a Professional
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-slate-950 to-slate-950" />

          <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Your services, one platform
              </div>

              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-7xl">
                Find the Right
                <span className="block text-blue-500">Professional</span>
                for Every Need.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
                Discover trusted professionals and explore services
                tailored to your needs. Simple, fast, and hassle-free.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:flex-row"
              >
                <div className="flex flex-1 items-center gap-3 px-3">
                  <span className="text-xl text-slate-400">⌕</span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search for a service or professional..."
                    className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-7 py-3 font-semibold transition hover:bg-blue-500"
                >
                  Search Services
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <span>✓ Easy discovery</span>
                <span>✓ Multiple service categories</span>
                <span>✓ Built for your needs</span>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="scroll-mt-10 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                Explore
              </p>

              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Service Categories
              </h2>

              <p className="mt-3 text-slate-400">
                Explore services across different professional fields.
              </p>
            </div>

            {loading ? (
              <p className="py-8 text-slate-400">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="py-8 text-slate-400">
                No categories available at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                  const categoryName =
                    category.name || category.title || "Services";

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSearch(categoryName);
                        document
                          .getElementById("services")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group relative h-56 overflow-hidden rounded-2xl border border-white/10 text-left"
                    >
                      <img
                        src={getServiceImage(categoryName)}
                        alt={categoryName}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        onError={(event) => {
                          event.currentTarget.src = serviceImages.default;
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <h3 className="text-xl font-bold">
                          {categoryName}
                        </h3>

                        <p className="mt-2 text-sm text-slate-300">
                          Discover professionals →
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Services */}
        <section
          id="services"
          className="scroll-mt-10 border-t border-white/10 bg-slate-900/40 py-20"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                  Discover
                </p>

                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Available Services
                </h2>

                <p className="mt-3 text-slate-400">
                  Find the right service for you.
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {filteredServices.length}{" "}
                {filteredServices.length === 1 ? "service" : "services"}
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
                Loading services...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                <p className="font-semibold text-red-400">
                  Unable to load services
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {error} Please check that the backend server is running.
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
                >
                  Try Again
                </button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center">
                <h3 className="text-xl font-semibold">No services found</h3>

                <p className="mt-2 text-slate-400">
                  Try a different search term or check back later.
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => {
                  const image = getServiceImage(
                    `${service.category_name || ""} ${service.title || service.name || ""}`
                  );

                  return (
                    <article
                      key={service.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={image}
                          alt={service.title || service.name || "Professional service"}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.src = serviceImages.default;
                          }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />

                        <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                          {service.category_name || "Professional Service"}
                        </span>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-semibold transition group-hover:text-blue-400">
                          {service.title || service.name}
                        </h3>

                        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-6 text-slate-400">
                          {service.description || "No description available."}
                        </p>

                        {service.duration_minutes && (
                          <p className="mt-3 text-xs text-slate-500">
                            Duration: {service.duration_minutes} minutes
                          </p>
                        )}

                        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                          <div>
                            <p className="text-xs text-slate-500">
                              Professional
                            </p>

                            <p className="mt-1 font-medium text-slate-200">
                              {service.professional_name || "Service Provider"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              Price
                            </p>

                            <p className="mt-1 text-xl font-bold text-white">
                              €{Number(service.price || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              "Booking functionality will be available soon."
                            )
                          }
                          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold transition hover:bg-blue-500"
                        >
                          View Service
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950 to-slate-900 px-8 py-14 text-center md:px-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              ProConnect
            </p>

            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold md:text-4xl">
              The Right Professional Is Just a Search Away.
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
              Explore available services and find the right fit for your needs.
            </p>

            <a
              href="#categories"
              className="mt-8 inline-flex rounded-xl bg-blue-600 px-7 py-3.5 font-semibold transition hover:bg-blue-500"
            >
              Explore Categories
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <a href="#" className="text-xl font-bold">
            Pro<span className="text-blue-500">Connect</span>
          </a>

          <p className="text-sm text-slate-500">
            Connecting people with the right professionals.
          </p>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ProConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;