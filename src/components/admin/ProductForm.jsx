import { useEffect, useState } from "react";
import { Image as ImageIcon, Sparkles, Check, ArrowLeft } from "lucide-react";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
  image: "",
  status: "approved",
};

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  submitLabel = "Save Product",
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!product) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      stock: String(product.stock ?? 0),
      image: product.image || "",
      status: product.status || "approved",
    });
  }, [product]);

  function update(event) {
    const { name, value } = event.target;
    if (name === "image") setImgError(false);

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (Number(form.price) < 0 || Number(form.stock) < 0) {
      setError("Price and stock cannot be negative numbers.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: Number(form.price),
        category: form.category.trim(),
        stock: Number(form.stock),
        image: form.image.trim(),
        status: form.status,
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="shopify-product-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}

      <div className="product-form-layout">
        {/* Left Column: Primary Details & Pricing */}
        <div className="form-main-column">
          <div className="form-section-card">
            <div className="section-card-header">
              <h4>Product Overview</h4>
              <p>Key information visible to customers in catalog</p>
            </div>

            <div className="form-field-group">
              <label className="form-field">
                <span className="field-label">Title <span className="required-star">*</span></span>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Minimalist Ceramic Mug"
                  value={form.name}
                  onChange={update}
                  required
                />
              </label>

              <label className="form-field">
                <span className="field-label">Description</span>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="Provide rich details, specifications, and materials..."
                  value={form.description}
                  onChange={update}
                />
              </label>
            </div>
          </div>

          <div className="form-section-card">
            <div className="section-card-header">
              <h4>Pricing & Inventory</h4>
              <p>Set unit retail price and stock quantities</p>
            </div>

            <div className="form-grid-two">
              <label className="form-field">
                <span className="field-label">Price (₹) <span className="required-star">*</span></span>
                <div className="input-currency-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={update}
                    required
                  />
                </div>
              </label>

              <label className="form-field">
                <span className="field-label">Stock Quantity <span className="required-star">*</span></span>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.stock}
                  onChange={update}
                  required
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Organization, Status & Media Preview */}
        <div className="form-side-column">
          <div className="form-section-card">
            <div className="section-card-header">
              <h4>Media & Imagery</h4>
              <p>Product thumbnail preview</p>
            </div>

            <label className="form-field">
              <span className="field-label">Image URL</span>
              <input
                name="image"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={form.image}
                onChange={update}
              />
            </label>

            <div className="image-preview-box">
              {form.image && !imgError ? (
                <img
                  src={form.image}
                  alt="Product preview"
                  className="preview-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="preview-placeholder">
                  <ImageIcon size={32} strokeWidth={1.5} />
                  <span>{imgError ? "Invalid image URL" : "Live image preview"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-section-card">
            <div className="section-card-header">
              <h4>Product Organization</h4>
              <p>Catalog grouping and storefront status</p>
            </div>

            <label className="form-field">
              <span className="field-label">Category <span className="required-star">*</span></span>
              <input
                name="category"
                type="text"
                placeholder="e.g. Home Goods, Electronics"
                value={form.category}
                onChange={update}
                required
              />
            </label>

            <label className="form-field">
              <span className="field-label">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={update}
                className="shopify-select"
              >
                <option value="approved">Approved (Live)</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected (Hidden)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="form-sticky-footer">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          <ArrowLeft size={15} /> Discard Changes
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={saving}
        >
          <Check size={16} />
          {saving ? "Saving Changes..." : submitLabel}
        </button>
      </div>
    </form>
  );
}