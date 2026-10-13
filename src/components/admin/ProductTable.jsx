import { Pencil, Trash2, PackageOpen, AlertTriangle } from "lucide-react";

export default function ProductTable({
  products = [],
  onEdit,
  onDelete,
}) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <PackageOpen size={42} strokeWidth={1.5} className="empty-icon" />
        <h4>No products found</h4>
        <p>Try adjusting your search criteria or add a new product to catalogue.</p>
      </div>
    );
  }

  const getStockBadge = (stock) => {
    const qty = Number(stock || 0);
    if (qty === 0) {
      return (
        <span className="inventory-badge out-of-stock">
          <span className="badge-dot"></span>
          0 in stock
        </span>
      );
    }
    if (qty <= 5) {
      return (
        <span className="inventory-badge low-stock">
          <AlertTriangle size={11} />
          Low stock ({qty})
        </span>
      );
    }
    return (
      <span className="inventory-badge in-stock">
        <span className="badge-dot"></span>
        {qty} available
      </span>
    );
  };

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Inventory</th>
            <th>Visibility</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product._id} className="table-row">
              <td>
                <div className="product-cell">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name || "Product"}
                      className="product-thumbnail"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "grid";
                      }}
                    />
                  ) : null}
                  <div
                    className="product-placeholder"
                    style={{ display: product.image ? "none" : "grid" }}
                  >
                    {(product.name || "P").charAt(0).toUpperCase()}
                  </div>

                  <div className="product-meta">
                    <span className="product-title-text">{product.name || "Untitled Product"}</span>
                    <span className="product-sku">
                      ID: #{product._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              </td>

              <td>
                <span className="category-pill">
                  {product.category || "General"}
                </span>
              </td>

              <td>
                <span className="price-tag">
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </span>
              </td>

              <td>
                {getStockBadge(product.stock)}
              </td>

              <td>
                <span className={`status-pill ${product.status || "approved"}`}>
                  <span className="status-dot"></span>
                  {product.status || "approved"}
                </span>
              </td>

              <td className="text-right">
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-action edit"
                    onClick={() => onEdit?.(product)}
                    aria-label={`Edit ${product.name || "product"}`}
                    title="Edit product"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    className="icon-action delete"
                    onClick={() => onDelete?.(product._id)}
                    aria-label={`Delete ${product.name || "product"}`}
                    title="Delete product"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
