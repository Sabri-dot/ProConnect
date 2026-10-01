
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const updateStatus = async (bookingId, status) => {
    setUpdatingId(bookingId);
    setError('');

    try {
      await request(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Could not update booking status.');
    } finally {
      setUpdatingId(null);
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
            <button className="admin-secondary-btn" onClick={onBack}>
              Back to site
            </button>
          )}
          <button className="admin-primary-btn" onClick={loadDashboard}>
            ↻ Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>
          <button onClick={loadDashboard}>Try again</button>
        </div>
      )}

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
              <h2>{Number(stats[card.key] ?? 0).toLocaleString()}</h2>
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
            <strong>{Number(value ?? 0).toLocaleString()}</strong>
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
                    <strong>{booking.client_name || 'Unknown client'}</strong>
                    <small>{booking.client_email || 'No email'}</small>
                  </td>

                  <td>{booking.service_title || 'Service'}</td>

                  <td>
                    {booking.booking_date
                      ? new Date(booking.booking_date).toLocaleDateString()
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
                          {status.charAt(0).toUpperCase() + status.slice(1)}
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
    </main>
  );
}

export default AdminDashboard;