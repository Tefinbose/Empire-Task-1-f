import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../components/admin/AdminLayout";
import ProductForm from "../../components/admin/ProductForm";
import {
  getProductById,
  updateProduct,
} from "../../services/productService";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    async function loadProduct() {
      try {
        const result = await getProductById(id);
        setProduct(result);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, navigate]);

  async function handleUpdate(data) {
    await updateProduct(id, data);
    navigate("/admin/products");
  }

  return (
    <AdminLayout>
      <div className="product-editor-container">
        <div className="page-heading">
          <span className="eyebrow">CATALOG INVENTORY</span>
          <h1>Edit Product</h1>
          <p>Update title, specifications, pricing, stock levels, and media.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state-card">
            <div className="loading-spinner"></div>
            <p>Loading product details...</p>
          </div>
        ) : product ? (
          <ProductForm
            product={product}
            onSubmit={handleUpdate}
            onCancel={() => navigate("/admin/products")}
            submitLabel="Update Product"
          />
        ) : (
          <div className="empty-state">Product not found.</div>
        )}
      </div>
    </AdminLayout>
  );
}