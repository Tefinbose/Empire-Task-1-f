import { useEffect, useState, useMemo } from "react";
import { Plus, Search, X, PackageCheck, Layers } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import AdminLayout from "../../components/admin/AdminLayout";
import ProductTable from "../../components/admin/ProductTable";
import { getProducts, deleteProduct } from "../../services/productService";

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const result = await getProducts({ search });
      setProducts(result.products || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadProducts();
  }, [search, navigate, location.key]);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to remove this product from your catalog?")) return;

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed.");
    }
  }

  // Derive unique categories
  const categories = useMemo(() => {
    const list = Array.from(
      new Set(products.map((p) => p.category?.trim()).filter(Boolean))
    );
    return ["all", ...list];
  }, [products]);

  // Filter products by category and stock filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category?.trim() !== selectedCategory) {
        return false;
      }
      if (selectedStockFilter === "low") {
        return p.stock > 0 && p.stock <= 5;
      }
      if (selectedStockFilter === "out") {
        return p.stock === 0;
      }
      if (selectedStockFilter === "in") {
        return p.stock > 5;
      }
      return true;
    });
  }, [products, selectedCategory, selectedStockFilter]);

  return (
    <AdminLayout>
      <div className="products-page-container">
        {/* Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">STORE CATALOG</span>
            <h1>Products</h1>
            <p>Manage product pricing, inventory levels, and visibility status.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/admin/products/add")}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters and Controls */}
        <div className="catalog-control-panel">
          <div className="filter-bar">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Search product title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-tags-row">
            <div className="filter-pills-group">
              <span className="filter-group-label">
                <Layers size={13} />
                Category:
              </span>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            <div className="stock-filters-group">
              <select
                value={selectedStockFilter}
                onChange={(e) => setSelectedStockFilter(e.target.value)}
                className="shopify-select-sm"
              >
                <option value="all">All Inventory</option>
                <option value="in">In Stock (&gt;5)</option>
                <option value="low">Low Stock (≤5)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="loading-state-card">
            <div className="loading-spinner"></div>
            <p>Loading catalog items...</p>
          </div>
        ) : (
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-title-row">
                  <h3>All Products</h3>
                  <span className="panel-badge-pill">
                    {filteredProducts.length} of {products.length} shown
                  </span>
                </div>
                <p>Real-time SKU count and active items</p>
              </div>

              <div className="panel-actions-sub">
                <span className="stock-quick-indicator">
                  <PackageCheck size={14} />
                  Stock Monitored
                </span>
              </div>
            </div>

            <ProductTable
              products={filteredProducts}
              onEdit={(product) => navigate(`/admin/products/edit/${product._id}`)}
              onDelete={handleDelete}
            />
          </section>
        )}
      </div>
    </AdminLayout>
  );
}