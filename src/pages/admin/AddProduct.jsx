import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ProductForm from "../../components/admin/ProductForm";
import { createProduct } from "../../services/productService";

export default function AddProduct() {
  const navigate = useNavigate();

  async function handleCreate(product) {
    await createProduct(product);
    navigate("/admin/products");
  }

  return (
    <AdminLayout>
      <div className="product-editor-container">
        <div className="page-heading">
          <span className="eyebrow">CATALOG INVENTORY</span>
          <h1>Add New Product</h1>
          <p>Create a product listing with pricing, inventory count, and media.</p>
        </div>

        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => navigate("/admin/products")}
          submitLabel="Publish Product"
        />
      </div>
    </AdminLayout>
  );
}