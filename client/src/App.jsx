
import { useEffect, useState } from "react";

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
        {/* Hero Section */}
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
                <span className="block text-blue-500">
                  Professional
                </span>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-slate-400"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>

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

        {/* Categories Section */}
        <section id="categories" className="scroll-mt-10 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
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

              <a
                href="#services"
                className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Browse all services →
              </a>
            </div>

            {loading ? (
              <p className="py-8 text-slate-400">
                Loading categories...
              </p>
            ) : categories.length === 0 ? (
              <p className="py-8 text-slate-400">
                No categories available at the moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSearch(
                        category.name || category.title || ""
                      );
                      document
                        .getElementById("services")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="group rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-left transition hover:-translate-y-1 hover:border-blue-500/50 hover:bg-slate-900"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400 transition group-hover:bg-blue-500/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                        />
                        <rect
                          x="14"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                        />
                        <rect
                          x="3"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                        />
                        <rect
                          x="14"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                        />
                      </svg>
                    </div>

                    <h3 className="text-lg font-semibold">
                      {category.name || category.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      Discover professionals in this category.
                    </p>

                    <span className="mt-5 inline-block text-sm font-medium text-blue-400">
                      Explore category →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Services Section */}
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
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
                >
                  Try Again
                </button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center">
                <div className="text-4xl">🔎</div>

                <h3 className="mt-4 text-xl font-semibold">
                  No services found
                </h3>

                <p className="mt-2 text-slate-400">
                  Try a different search term or check back later.
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => (
                  <article
                    key={service.id}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition hover:-translate-y-1 hover:border-blue-500/40"
                  >
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-950 via-slate-800 to-slate-900">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-400 transition group-hover:scale-110">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 3v18" />
                          <path d="M5 8h14" />
                          <path d="M7 8l-4 7h8L7 8Z" />
                          <path d="M17 8l-4 7h8l-4-7Z" />
                        </svg>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                          {service.category_name || "Professional Service"}
                        </span>

                        {service.duration_minutes && (
                          <span className="text-xs text-slate-500">
                            {service.duration_minutes} min
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold transition group-hover:text-blue-400">
                        {service.title || service.name}
                      </h3>

                      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-6 text-slate-400">
                        {service.description || "No description available."}
                      </p>

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
                            Starting at
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
                        className="mt-6 w-full rounded-xl border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white"
                      >
                        View Service
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950 to-slate-900 px-8 py-14 text-center md:px-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              ProConnect
            </p>

            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
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