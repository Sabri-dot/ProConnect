
import { useEffect, useState } from "react";

// Online images
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
  if (/beauty|makeup|make-up|nail|cosmetic/.test(value)) {
    return serviceImages.beauty;
  }
  if (/photo|camera|videograph/.test(value)) {
    return serviceImages.photography;
  }
  if (/electric/.test(value)) return serviceImages.electrician;
  if (/web|develop|program|software|computer/.test(value)) {
    return serviceImages.development;
  }
  if (/clean/.test(value)) return serviceImages.cleaning;

  return serviceImages.default;
}

function App() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  // Booking state
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingPeriod, setBookingPeriod] = useState("AM");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("proconnect_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("proconnect_token") || ""
  );

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Load categories and services
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
          err.message ||
            "Something went wrong while connecting to the server."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Login and register
  const handleAuth = async (event) => {
    event.preventDefault();

    setAuthLoading(true);
    setAuthMessage("");

    try {
      const isRegister = authMode === "register";

      const response = await fetch(
        `http://localhost:5000/api/auth/${
          isRegister ? "register" : "login"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isRegister
              ? {
                  full_name: authName,
                  email: authEmail,
                  password: authPassword,
                  phone: authPhone,
                }
              : {
                  email: authEmail,
                  password: authPassword,
                }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Authentication failed.");
      }

      if (isRegister) {
        setAuthMode("login");
        setAuthPassword("");
        setAuthMessage("Account created! Please log in.");
        return;
      }

      if (!result.token || !result.user) {
        throw new Error("The server did not return a valid login session.");
      }

      localStorage.setItem("proconnect_token", result.token);
      localStorage.setItem(
        "proconnect_user",
        JSON.stringify(result.user)
      );

      setAuthToken(result.token);
      setCurrentUser(result.user);
      setAuthPassword("");
      setAuthMessage("Login successful!");
    } catch (err) {
      setAuthMessage(err.message || "Something went wrong.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("proconnect_token");
    localStorage.removeItem("proconnect_user");

    setAuthToken("");
    setCurrentUser(null);
    setAuthMessage("");
    setBookingMessage("");
  };

  // Booking
  const handleBooking = async (event) => {
    event.preventDefault();

    if (!currentUser || !authToken) {
      setBookingMessage(
        "Për të rezervuar këtë shërbim, duhet të kyçeni ose të krijoni një llogari."
      );
      return;
    }

    if (!selectedService || !bookingDate || !bookingTime.trim()) {
      setBookingMessage(
        "Please select a booking date and enter a time."
      );
      return;
    }

    const timeMatch = bookingTime
      .trim()
      .match(/^(0?[1-9]|1[0-2]):([0-5]\d)$/);

    if (!timeMatch) {
      setBookingMessage(
        "Enter a valid time, for example 10:30 or 2:00."
      );
      return;
    }

    let hour = Number(timeMatch[1]);
    const minute = timeMatch[2];

    if (bookingPeriod === "PM" && hour !== 12) {
      hour += 12;
    }

    if (bookingPeriod === "AM" && hour === 12) {
      hour = 0;
    }

    const formattedHour = String(hour).padStart(2, "0");

    const bookingDateTime =
      `${bookingDate} ${formattedHour}:${minute}:00`;

    const selectedDateTime = new Date(
      `${bookingDate}T${formattedHour}:${minute}:00`
    );

    if (
      Number.isNaN(selectedDateTime.getTime()) ||
      selectedDateTime <= new Date()
    ) {
      setBookingMessage("Please select a future date and time.");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingMessage("");

      const response = await fetch(
        "http://localhost:5000/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            service_id: selectedService.id,
            booking_date: bookingDateTime,
            notes: bookingNotes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Your session may have expired. Please log in again."
          );
        }

        throw new Error(
          result.message || "Failed to create booking."
        );
      }

      setBookingMessage(
        `Booking created successfully! Booking ID: ${result.booking_id}`
      );

      setBookingDate("");
      setBookingTime("");
      setBookingPeriod("AM");
      setBookingNotes("");
    } catch (err) {
      setBookingMessage(err.message || "Something went wrong.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Search services
  const filteredServices = services.filter((service) => {
    const searchTerm = search.toLowerCase();

    return (
      service.title?.toLowerCase().includes(searchTerm) ||
      service.name?.toLowerCase().includes(searchTerm) ||
      service.professional_name?.toLowerCase().includes(searchTerm) ||
      service.category_name?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <a href="#" className="text-2xl font-bold tracking-tight">
            Pro<span className="text-blue-500">Connect</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a
              href="#categories"
              className="transition hover:text-white"
            >
              Categories
            </a>

            <a
              href="#services"
              className="transition hover:text-white"
            >
              Services
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser && authToken ? (
              <>
                <span className="hidden text-sm text-slate-300 sm:inline">
                  Hi, {currentUser.full_name}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthMessage("");
                    document
                      .getElementById("auth")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthMessage("");
                    document
                      .getElementById("auth")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-500"
                >
                  Register
                </button>
              </>
            )}
          </div>
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
        <section
          id="categories"
          className="scroll-mt-10 py-20"
        >
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
              <p className="py-8 text-slate-400">
                Loading categories...
              </p>
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

        {/* Authentication */}
        <section
          id="auth"
          className="scroll-mt-10 border-t border-white/10 py-20"
        >
          <div className="mx-auto max-w-lg px-6">
            {currentUser && authToken ? (
              <div className="rounded-2xl border border-green-500/20 bg-slate-900 p-8 text-center">
                <h2 className="text-2xl font-bold">
                  Welcome, {currentUser.full_name}!
                </h2>

                <p className="mt-3 text-slate-400">
                  You are logged in and can book services.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                  ProConnect Account
                </p>

                <h2 className="mt-3 text-3xl font-bold">
                  {authMode === "login"
                    ? "Welcome Back"
                    : "Create Account"}
                </h2>

                <p className="mt-2 text-slate-400">
                  {authMode === "login"
                    ? "Log in to book your preferred services."
                    : "Register to get started with ProConnect."}
                </p>

                <form
                  onSubmit={handleAuth}
                  className="mt-8 space-y-4"
                >
                  {authMode === "register" && (
                    <>
                      <input
                        type="text"
                        value={authName}
                        onChange={(event) =>
                          setAuthName(event.target.value)
                        }
                        placeholder="Full name"
                        autoComplete="name"
                        required
                        className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
                      />

                      <input
                        type="tel"
                        value={authPhone}
                        onChange={(event) =>
                          setAuthPhone(event.target.value)
                        }
                        placeholder="Phone number (optional)"
                        autoComplete="tel"
                        className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
                      />
                    </>
                  )}

                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) =>
                      setAuthEmail(event.target.value)
                    }
                    placeholder="Email address"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
                  />

                  <input
                    type="password"
                    value={authPassword}
                    onChange={(event) =>
                      setAuthPassword(event.target.value)
                    }
                    placeholder="Password"
                    minLength={6}
                    autoComplete={
                      authMode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
                  />

                  {authMessage && (
                    <p
                      role="status"
                      className={
                        authMessage.includes("successful") ||
                        authMessage.includes("created")
                          ? "text-sm text-green-400"
                          : "text-sm text-blue-300"
                      }
                    >
                      {authMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
                  >
                    {authLoading
                      ? "Please wait..."
                      : authMode === "login"
                        ? "Login"
                        : "Create Account"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                  {authMode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(
                        authMode === "login" ? "register" : "login"
                      );
                      setAuthMessage("");
                    }}
                    className="font-semibold text-blue-400 hover:text-blue-300"
                  >
                    {authMode === "login" ? "Register" : "Login"}
                  </button>
                </p>
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
                <h3 className="text-xl font-semibold">
                  No services found
                </h3>

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
                    `${service.category_name || ""} ${
                      service.title || service.name || ""
                    }`
                  );

                  return (
                    <article
                      key={service.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={image}
                          alt={
                            service.title ||
                            service.name ||
                            "Professional service"
                          }
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
                          onClick={() => {
                            setSelectedService(service);
                            setBookingMessage("");
                            setBookingDate("");
                            setBookingTime("");
                            setBookingPeriod("AM");
                            setBookingNotes("");

                            if (!currentUser || !authToken) {
                              setBookingMessage(
                                "Please log in or create an account to book this service."
                              );
                            }
                          }}
                          className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold transition hover:bg-blue-500"
                        >
                          Book Now
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

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Book a Service
                </h2>

                <p className="mt-2 text-slate-400">
                  {selectedService.title || selectedService.name}
                </p>

                <p className="mt-1 font-semibold text-blue-400">
                  €{Number(selectedService.price || 0).toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedService(null);
                  setBookingMessage("");
                }}
                className="text-2xl text-slate-400 hover:text-white"
                aria-label="Close booking form"
              >
                ×
              </button>
            </div>

            {(!currentUser || !authToken) && (
              <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-200">
                   Please log in to your account or register a new account to book this service.
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(null);
                      setAuthMode("login");
                      setAuthMessage("");
                      document
                        .getElementById("auth")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedService(null);
                      setAuthMode("register");
                      setAuthMessage("");
                      document
                        .getElementById("auth")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Booking date and time
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Select Date
                  </label>

                  <input
                    type="date"
                    value={bookingDate}
                    min={(() => {
                      const today = new Date();

                      return `${today.getFullYear()}-${String(
                        today.getMonth() + 1
                      ).padStart(2, "0")}-${String(
                        today.getDate()
                      ).padStart(2, "0")}`;
                    })()}
                    onChange={(event) =>
                      setBookingDate(event.target.value)
                    }
                    required
                    style={{ colorScheme: "dark" }}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Select Time
                  </label>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="10:30"
                      value={bookingTime}
                      onChange={(event) =>
                        setBookingTime(event.target.value)
                      }
                      pattern="(0?[1-9]|1[0-2]):[0-5][0-9]"
                      title="Enter a time between 1:00 and 12:59, for example 10:30"
                      required
                      className="w-2/3 rounded-xl border border-white/10 bg-slate-950 p-3 text-white placeholder:text-slate-500"
                    />

                    <select
                      value={bookingPeriod}
                      onChange={(event) =>
                        setBookingPeriod(event.target.value)
                      }
                      className="w-1/3 rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Example: 10:30 AM or 2:00 PM
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Notes (optional)
                </label>

                <textarea
                  value={bookingNotes}
                  onChange={(event) =>
                    setBookingNotes(event.target.value)
                  }
                  placeholder="Any special requests?"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white placeholder:text-slate-500"
                />
              </div>

              {bookingMessage && (
                <p
                  role="status"
                  className={
                    bookingMessage.startsWith("Booking created")
                      ? "text-sm text-green-400"
                      : "text-sm text-red-400"
                  }
                >
                  {bookingMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        </div>
      )}

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