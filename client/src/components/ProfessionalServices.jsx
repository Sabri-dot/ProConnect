
import { useMemo, useState } from 'react';
import './ProfessionalServices.css';

const API = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const EMPTY_FORM = {
  title: '',
  category_id: '',
  description: '',
  price: '',
  duration_minutes: '60',
  location: '',
};

function getImageUrl(image) {
  const url = typeof image === 'string' ? image : image?.image_url;

  if (!url) return '';
  return url.startsWith('http') ? url : `${SERVER_URL}${url}`;
}

function getCategoryName(service) {
  return service.category_name || service.category?.name || 'Professional Service';
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(price) || 0);
}

export default function ProfessionalServices({
  categories = [],
  services = [],
  currentUser,
  authToken,
  refreshServices,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  

  const myServices = useMemo(
    () =>
      services.filter(
        (service) =>
          Number(service.professional_id) === Number(currentUser?.id)
      ),
    [services, currentUser?.id]
  );

   

  const totalValue = useMemo(
    () =>
      myServices.reduce(
        (total, service) => total + (Number(service.price) || 0),
        0
      ),
    [myServices]
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedImages([]);
    setEditingId(null);

    const input = document.getElementById('ps-image-upload');
    if (input) input.value = '';
  };

  const startEditing = (service) => {
    clearMessages();
    setEditingId(service.id);

    setForm({
      title: service.title || '',
      category_id: String(service.category_id || ''),
      description: service.description || '',
      price: String(service.price ?? ''),
      duration_minutes: String(service.duration_minutes || 60),
      location: service.location || '',
    });

    setSelectedImages([]);

    document
      .getElementById('professional-service-editor')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImageChange = (event) => {
    clearMessages();

    const files = Array.from(event.target.files || []);

    if (files.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images per service.`);
      event.target.value = '';
      setSelectedImages([]);
      return;
    }

    const invalidType = files.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
          file.type
        )
    );

    if (invalidType) {
      setError('Use JPG, PNG, WEBP, or GIF image files.');
      event.target.value = '';
      setSelectedImages([]);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversized) {
      setError('Each image must be 5 MB or smaller.');
      event.target.value = '';
      setSelectedImages([]);
      return;
    }

    setSelectedImages(files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!authToken) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    if (!form.title.trim()) {
      setError('Please enter a service name.');
      return;
    }

    if (!form.category_id) {
      setError('Please select a category.');
      return;
    }

    if (form.price === '' || Number(form.price) < 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (
      !Number.isInteger(Number(form.duration_minutes)) ||
      Number(form.duration_minutes) < 1
    ) {
      setError('Duration must be at least 1 minute.');
      return;
    }

    const payload = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, value);
    });

    selectedImages.forEach((file) => payload.append('images', file));

    setLoading(true);

    try {
      const response = await fetch(
        editingId
          ? `${API}/services/${editingId}`
          : `${API}/services`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: payload,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to save your service.');
      }

      setSuccess(
        editingId
          ? 'Your service has been updated successfully.'
          : 'Your new service has been published successfully.'
      );

      resetForm();

      if (refreshServices) {
        await refreshServices();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Delete "${service.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    clearMessages();
    setDeletingId(service.id);

    try {
      const response = await fetch(`${API}/services/${service.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete this service.');
      }

      if (editingId === service.id) resetForm();

      setSuccess('Your service has been deleted.');
      if (refreshServices) await refreshServices();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const scrollToEditor = () => {
    clearMessages();
    resetForm();

    document
      .getElementById('professional-service-editor')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="professional-services-page">
      <div className="ps-background-glow ps-glow-one" />
      <div className="ps-background-glow ps-glow-two" />

      <div className="ps-container">
        <header className="ps-hero">
          <div className="ps-hero-copy">
            <div className="ps-eyebrow">
              <span className="ps-eyebrow-dot" />
              PROFESSIONAL WORKSPACE
            </div>

            <h1>
              Your services.
              <br />
              <span>Your business.</span>
            </h1>

            <p>
              Manage your offerings, showcase your expertise, and make it
              easier for customers to discover what you do.
            </p>

            <button
              className="ps-button ps-button-primary ps-hero-button"
              type="button"
              onClick={scrollToEditor}
            >
              <span className="ps-button-plus">+</span>
              Add a new service
            </button>
          </div>

          <div className="ps-hero-visual" aria-hidden="true">
            <div className="ps-orbit ps-orbit-outer" />
            <div className="ps-orbit ps-orbit-inner" />

            <div className="ps-visual-card ps-visual-card-main">
              <div className="ps-visual-icon">✦</div>
              <div className="ps-visual-lines">
                <span />
                <span />
              </div>
              <div className="ps-visual-status">
                <span />
                Ready to grow
              </div>
            </div>

            <div className="ps-visual-floating ps-floating-top">
              <span className="ps-floating-sparkle">✧</span>
              <div>
                <strong>{myServices.length}</strong>
                <small>Active listings</small>
              </div>
            </div>

            <div className="ps-visual-floating ps-floating-bottom">
              <span className="ps-floating-check">✓</span>
              <div>
                <strong>Your business</strong>
                <small>In your hands</small>
              </div>
            </div>
          </div>
        </header>

        <section className="ps-stats-grid" aria-label="Service overview">
          <article className="ps-stat-card">
            <div className="ps-stat-top">
              <span className="ps-stat-icon ps-icon-blue">▤</span>
              <span className="ps-stat-label">Total services</span>
            </div>
            <strong className="ps-stat-value">{myServices.length}</strong>
            <span className="ps-stat-caption">Your published offerings</span>
          </article>

          <article className="ps-stat-card">
            <div className="ps-stat-top">
              <span className="ps-stat-icon ps-icon-purple">◈</span>
              <span className="ps-stat-label">Categories</span>
            </div>
            <strong className="ps-stat-value">
              {new Set(myServices.map((service) => service.category_id)).size}
            </strong>
            <span className="ps-stat-caption">Categories represented</span>
          </article>

          <article className="ps-stat-card">
            <div className="ps-stat-top">
              <span className="ps-stat-icon ps-icon-green">€</span>
              <span className="ps-stat-label">Combined prices</span>
            </div>
            <strong className="ps-stat-value ps-stat-price">
              {formatPrice(totalValue)}
            </strong>
            <span className="ps-stat-caption">Sum of listed service prices</span>
          </article>
        </section>

        <section
          className="ps-editor-card"
          id="professional-service-editor"
        >
          <div className="ps-section-heading">
            <div className="ps-heading-icon">✧</div>
            <div className="ps-heading-copy">
              <span className="ps-section-kicker">
                {editingId ? 'UPDATE YOUR OFFERING' : 'GROW YOUR BUSINESS'}
              </span>
              <h2>{editingId ? 'Edit your service' : 'Create a service'}</h2>
              <p>
                {editingId
                  ? 'Keep your service details accurate and up to date.'
                  : 'Add the details customers need to choose your service.'}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                className="ps-button ps-button-quiet"
                onClick={() => {
                  resetForm();
                  clearMessages();
                }}
              >
                Cancel editing
              </button>
            )}
          </div>

          {error && (
            <div className="ps-alert ps-alert-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div className="ps-alert ps-alert-success" role="status">
              <span>✓</span>
              {success}
            </div>
          )}

          <form className="ps-form" onSubmit={handleSubmit}>
            <div className="ps-form-section-label">
              <span>01</span>
              SERVICE DETAILS
            </div>

            <div className="ps-form-grid">
              <label className="ps-field">
                <span>
                  Service name <b>*</b>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. Premium haircut"
                  maxLength={150}
                  required
                />
              </label>

              <label className="ps-field">
                <span>
                  Category <b>*</b>
                </span>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={updateField}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name ||
                        category.title ||
                        category.category_name ||
                        `Category ${category.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ps-field">
                <span>
                  Price (€) <b>*</b>
                </span>
                <div className="ps-input-with-prefix">
                  <span>€</span>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={updateField}
                    min="0"
                    step="0.01"
                    placeholder="25.00"
                    required
                  />
                </div>
              </label>

              <label className="ps-field">
                <span>
                  Duration <b>*</b>
                </span>
                <div className="ps-input-with-suffix">
                  <input
                    type="number"
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={updateField}
                    min="1"
                    step="1"
                    placeholder="60"
                    required
                  />
                  <span>minutes</span>
                </div>
              </label>
            </div>

            <div className="ps-form-divider" />

            <div className="ps-form-section-label">
              <span>02</span>
              LOCATION & DESCRIPTION
            </div>

            <div className="ps-form-grid">
              <label className="ps-field ps-field-full">
                <span>Service location</span>
                <div className="ps-input-with-prefix ps-location-input">
                  <span>⌖</span>
                  <input
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    maxLength={255}
                    placeholder="e.g. Pristina, City Center"
                  />
                </div>
              </label>

              <label className="ps-field ps-field-full">
                <span>Service description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={4}
                  placeholder="Describe your service, what customers can expect, and what makes it special..."
                />
                <small className="ps-character-count">
                  {form.description.length} characters
                </small>
              </label>
            </div>

            <div className="ps-form-divider" />

            <div className="ps-form-section-label">
              <span>03</span>
              SERVICE GALLERY
            </div>

            <div className="ps-upload-area">
              <div className="ps-upload-icon">↥</div>
              <div className="ps-upload-copy">
                <strong>
                  {editingId ? 'Update your gallery' : 'Showcase your work'}
                </strong>
                <p>
                  {editingId
                    ? 'Select new images to replace the existing gallery. Leave empty to keep current images.'
                    : 'Upload up to 5 images to help customers see your work.'}
                </p>
                <small>JPG, PNG, WEBP or GIF · Up to 5 MB per image</small>
              </div>

              <label className="ps-button ps-button-upload">
                Choose images
                <input
                  id="ps-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {selectedImages.length > 0 && (
              <div className="ps-selected-images">
                {selectedImages.map((file, index) => (
                  <div className="ps-selected-image" key={`${file.name}-${index}`}>
                    <img src={URL.createObjectURL(file)} alt={file.name} />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="ps-form-footer">
              <p>
                <span>*</span> Required fields
              </p>

              <button
                type="submit"
                className="ps-button ps-button-primary ps-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="ps-spinner" />
                    Saving service...
                  </>
                ) : (
                  <>
                    {editingId ? 'Save changes' : 'Publish service'}
                    <span className="ps-submit-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        
        <section className="ps-list-section">
          <div className="ps-list-header">
            <div>
              <span className="ps-section-kicker">YOUR BUSINESS CATALOG</span>
              <h2>Your services</h2>
              <p>Review and manage everything you offer in one place.</p>
            </div>
          </div>

          {myServices.length === 0 ? (
            <div className="ps-empty-state">
              <div className="ps-empty-art">
                <div className="ps-empty-art-ring" />
                <span>✦</span>
              </div>
              <span className="ps-section-kicker">YOUR NEXT CHAPTER</span>
              <h3>Your first service starts here.</h3>
              <p>
                Add your first service to showcase your expertise and help
                customers discover what you offer.
              </p>
            </div>
          ) : (
            <div className="ps-services-grid">
              {myServices.map((service) => {
                const gallery = Array.isArray(service.images)
                  ? service.images
                  : [];

                return (
                  <article className="ps-service-card" key={service.id}>
                    <div className="ps-card-gallery">
                      {gallery.length > 0 ? (
                        <>
                          <img
                            className="ps-card-cover"
                            src={getImageUrl(gallery[0])}
                            alt={service.title}
                            loading="lazy"
                          />
                          <span className="ps-gallery-count">
                            ▧ {gallery.length}{' '}
                            {gallery.length === 1 ? 'photo' : 'photos'}
                          </span>
                        </>
                      ) : (
                        <div className="ps-card-placeholder">
                          <div className="ps-placeholder-orbit" />
                          <span>✦</span>
                          <small>Service gallery</small>
                        </div>
                      )}

                      <span className="ps-card-category">
                        {getCategoryName(service)}
                      </span>
                    </div>

                    <div className="ps-card-body">
                      <div className="ps-card-title-row">
                        <h3>{service.title}</h3>
                        <strong className="ps-card-price">
                          {formatPrice(service.price)}
                        </strong>
                      </div>

                      <p className="ps-card-description">
                        {service.description?.trim() ||
                          'Add a description to help customers learn more about this service.'}
                      </p>

                      <div className="ps-card-details">
                        <span>
                          <span className="ps-detail-symbol">◷</span>
                          {service.duration_minutes} min
                        </span>
                        {service.location && (
                          <span className="ps-card-location">
                            <span className="ps-detail-symbol">⌖</span>
                            {service.location}
                          </span>
                        )}
                      </div>

                      {gallery.length > 1 && (
                        <div className="ps-thumbnail-row">
                          {gallery.slice(1, 5).map((image, index) => (
                            <img
                              key={image.id || image.image_url || index}
                              src={getImageUrl(image)}
                              alt={`${service.title} ${index + 2}`}
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}

                      <div className="ps-card-footer">
                        <button
                          className="ps-button ps-card-edit"
                          type="button"
                          onClick={() => startEditing(service)}
                        >
                          <span>↗</span>
                          Edit
                        </button>

                        <button
                          className="ps-button ps-card-delete"
                          type="button"
                          onClick={() => handleDelete(service)}
                          disabled={deletingId === service.id}
                        >
                          {deletingId === service.id ? (
                            'Deleting...'
                          ) : (
                            <>
                              <span>×</span>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="ps-page-footer">
          <span className="ps-footer-mark">✦</span>
          <p>
            Built for professionals who take pride in their work.
          </p>
          <span className="ps-footer-brand">PROCONNECT</span>
        </footer>
      </div>
    </main>
  );
}