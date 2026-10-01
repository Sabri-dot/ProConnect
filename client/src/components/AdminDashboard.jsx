
import { useCallback, useEffect, useState } from 'react';
import './AdminDashboard.css';

const API = 'http://localhost:5000/api';

const STAT_CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: '👥', color: '#6366f1' },
  { key: 'totalServices', label: 'Total Services', icon: '🛠️', color: '#0891b2' },
  { key: 'totalBookings', label: 'Total Bookings', icon: '📅', color: '#7c3aed' },
  { key: 'pendingBookings', label: 'Pending Bookings', icon: '⏳', color: '#d97706' },
];

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingKey, setDeletingKey] = useState('');
  const [filter, setFilter] = useState('all');

  const getToken = () => localStorage.getItem('proconnect_token');

  const request = async (path, options = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error('Session missing. Please log in again.');
    }

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Request failed.');
    }

    return result;
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResult, bookingsResult] = await Promise.all([
        request('/admin/stats'),
        request('/admin/bookings'),
      ]);

      setStats(statsResult.data || {});

      setBookings(
        Array.isArray(bookingsResult.data) ? bookingsResult.data : []
      );
    } catch (err) {
      setError(err.message || 'Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setSectionLoading(true);
    setError('');

    try {
      const result = await request('/admin/users');

      // Supports both { success, data } and a plain array response.
      const list = Array.isArray(result)
        ? result
        : result.data;

      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Could not load users.');
    } finally {
      setSectionLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    setSectionLoading(true);
    setError('');

    try {
      const result = await request('/admin/services');

      const list = Array.isArray(result)
        ? result
        : result.data;

      setServices(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Could not load services.');
    } finally {
      setSectionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const changeSection = (section) => {
    setActiveSection(section);
    setError('');
    setNotice('');

    if (section === 'users') {
      loadUsers();
    } else if (section === 'services') {
      loadServices();
    }
  };

  const refreshCurrentSection = () => {
    if (activeSection === 'users') {
      loadUsers();
    } else if (activeSection === 'services') {
      loadServices();
    } else {
      loadDashboard();
    }
  };

  const updateStatus = async (bookingId, status) => {
    setUpdatingId(bookingId);
    setError('');
    setNotice('');

    try {
      await request(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status }
            : booking
        )
      );

      await loadDashboard();
      setNotice('Booking status updated successfully.');
    } catch (err) {
      setError(err.message || 'Could not update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (user) => {
    if (user.role === 'admin') {
      setError('Admin accounts cannot be deleted here.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.full_name || user.email}? This action cannot be undone.`
    );

    if (!confirmed) return;

    const key = `user-${user.id}`;
    setDeletingKey(key);
    setError('');
    setNotice('');

    try {
      await request(`/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      setUsers((current) =>
        current.filter((item) => item.id !== user.id)
      );

      await loadDashboard();
      setNotice('User deleted successfully.');
    } catch (err) {
      setError(err.message || 'Could not delete user.');
    } finally {
      setDeletingKey('');
    }
  };

  const deleteService = async (service) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    const key = `service-${service.id}`;
    setDeletingKey(key);
    setError('');
    setNotice('');

    try {
      await request(`/admin/services/${service.id}`, {
        method: 'DELETE',
      });

      setServices((current) =>
        current.filter((item) => item.id !== service.id)
      );

      await loadDashboard();
      setNotice('Service deleted successfully.');
    } catch (err) {
      setError(err.message || 'Could not delete service.');
    } finally {
      setDeletingKey('');
    }
  };

  const visibleBookings =
    filter === 'all'
      ? bookings
      : bookings.filter((booking) => booking.status === filter);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">PROCONNECT MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
          <p>Manage your platform and monitor bookings.</p>
        </div>

        <div className="admin-header-actions">
          {onBack && (
            <button
              className="admin-secondary-btn"
              onClick={onBack}
            >
              Back to site
            </button>
          )}

          <button
            className="admin-primary-btn"
            onClick={refreshCurrentSection}
            disabled={sectionLoading || Boolean(deletingKey)}
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'users', label: '👥 Users' },
          { key: 'services', label: '🛠️ Services' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-tab ${
              activeSection === tab.key ? 'admin-tab-active' : ''
            }`}
            onClick={() => changeSection(tab.key)}
            aria-current={activeSection === tab.key ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button onClick={refreshCurrentSection}>Try again</button>
        </div>
      )}

      {notice && (
        <div className="admin-notice" role="status">
          {notice}
        </div>
      )}

      {activeSection === 'overview' && (
        <>
          <section className="admin-stats">
            {STAT_CARDS.map((card) => (
              <article className="admin-stat-card" key={card.key}>
                <div
                  className="admin-stat-icon"
                  style={{ backgroundColor: `${card.color}18` }}
                >
                  <span>{card.icon}</span>
                </div>
                <div>
                  <p>{card.label}</p>
                  <h2>
                    {Number(stats[card.key] ?? 0).toLocaleString()}
                  </h2>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-extra-stats">
            {[
              ['Confirmed', stats.confirmedBookings],
              ['Completed', stats.completedBookings],
              ['Cancelled', stats.cancelledBookings],
            ].map(([label, value]) => (
              <div className="admin-extra-card" key={label}>
                <span>{label}</span>
                <strong>
                  {Number(value ?? 0).toLocaleString()}
                </strong>
              </div>
            ))}
          </section>

          <section className="admin-bookings-section">
            <div className="admin-section-header">
              <div>
                <h2>Bookings</h2>
                <p>View and update customer bookings.</p>
              </div>

              <select
                className="admin-filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filter bookings by status"
              >
                <option value="all">All bookings</option>
                {STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Update status</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <strong>
                          {booking.client_name || 'Unknown client'}
                        </strong>
                        <small>
                          {booking.client_email || 'No email'}
                        </small>
                      </td>

                      <td>{booking.service_title || 'Service'}</td>

                      <td>
                        {booking.booking_date
                          ? new Date(
                              booking.booking_date
                            ).toLocaleDateString()
                          : '—'}
                      </td>

                      <td>
                        <span
                          className={`admin-status admin-status-${String(
                            booking.status
                          ).toLowerCase()}`}
                        >
                          {booking.status || 'unknown'}
                        </span>
                      </td>

                      <td>
                        <select
                          className="admin-status-select"
                          value={booking.status || 'pending'}
                          disabled={updatingId === booking.id}
                          onChange={(event) =>
                            updateStatus(booking.id, event.target.value)
                          }
                          aria-label={`Update status for booking ${booking.id}`}
                        >
                          {STATUSES.map((status) => (
                            <option value={status} key={status}>
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}

                  {visibleBookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="admin-empty">
                        No bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {activeSection === 'users' && (
        <section className="admin-bookings-section">
          <div className="admin-section-header">
            <div>
              <h2>Users</h2>
              <p>View and manage registered users.</p>
            </div>
            <strong>{users.length} users</strong>
          </div>

          {sectionLoading ? (
            <p className="admin-empty">Loading users...</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <strong>{user.full_name || '—'}</strong>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>{user.phone || '—'}</td>
                      <td>
                        <span className="admin-role">
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          disabled={
                            user.role === 'admin' ||
                            Boolean(deletingKey)
                          }
                          onClick={() => deleteUser(user)}
                        >
                          {deletingKey === `user-${user.id}`
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan="6" className="admin-empty">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === 'services' && (
        <section className="admin-bookings-section">
          <div className="admin-section-header">
            <div>
              <h2>Services</h2>
              <p>View and manage platform services.</p>
            </div>
            <strong>{services.length} services</strong>
          </div>

          {sectionLoading ? (
            <p className="admin-empty">Loading services...</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td>{service.id}</td>
                      <td>
                        <strong>{service.title || 'Untitled'}</strong>
                      </td>
                      <td>{service.description || '—'}</td>
                      <td>
                        {service.price != null
                          ? `${service.price}`
                          : '—'}
                      </td>
                      <td>
                        {service.duration != null
                          ? service.duration
                          : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-delete-btn"
                          disabled={Boolean(deletingKey)}
                          onClick={() => deleteService(service)}
                        >
                          {deletingKey === `service-${service.id}`
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {services.length === 0 && (
                    <tr>
                      <td colSpan="6" className="admin-empty">
                        No services found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default AdminDashboard;