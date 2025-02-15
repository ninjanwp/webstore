import React, { useState } from "react";
import { Button, Nav, Card } from "react-bootstrap";
import DataTable from "../components/common/DataTable";
import useTableData from "../hooks/useTableData";
import ProductModal from "../components/ProductModal";
import CategoryModal from "../components/CategoryModal";
import ManufacturerModal from "../components/ManufacturerModal";
import AttributeManager from "../components/AttributeManager";
import { formatCurrency } from "../utils/formatters";
import api from "../services/api";
import { toast } from "react-hot-toast";

const ProductsPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabs = {
    products: {
      title: "Products",
      singularTitle: "Product",
      icon: "bi-box-seam",
      endpoint: "/api/admin/products",
      columns: [
        { field: "name", label: "Name" },
        {
          field: "price",
          label: "Price",
          format: (value, item) => (
            <div>
              {formatCurrency(value)}
              {item.compare_at_price && (
                <div className="text-muted text-decoration-line-through small">
                  {formatCurrency(item.compare_at_price)}
                </div>
              )}
            </div>
          ),
        },
        {
          field: "stock",
          label: "Stock",
          format: (value, item) => (
            <div
              className={
                value <= (item.low_stock_threshold || 0) ? "text-warning" : ""
              }
            >
              {value}
            </div>
          ),
        },
        { field: "sku", label: "SKU" },
      ],
      modal: ProductModal,
      sortOptions: [
        { field: "name", direction: "asc", label: "Name (A-Z)" },
        { field: "name", direction: "desc", label: "Name (Z-A)" },
        { field: "price", direction: "asc", label: "Price (Low-High)" },
        { field: "price", direction: "desc", label: "Price (High-Low)" },
        { field: "stock", direction: "asc", label: "Stock (Low-High)" },
        { field: "stock", direction: "desc", label: "Stock (High-Low)" },
      ],
    },
    categories: {
      title: "Categories",
      singularTitle: "Category",
      icon: "bi-tags",
      endpoint: "/api/admin/categories",
      columns: [
        { field: "name", label: "Name" },
        { field: "description", label: "Description" },
        { field: "display_order", label: "Display Order" },
      ],
      modal: CategoryModal,
      sortOptions: [
        { field: "name", direction: "asc", label: "Name (A-Z)" },
        { field: "name", direction: "desc", label: "Name (Z-A)" },
        {
          field: "display_order",
          direction: "asc",
          label: "Display Order (Low-High)",
        },
        {
          field: "display_order",
          direction: "desc",
          label: "Display Order (High-Low)",
        },
      ],
    },
    manufacturers: {
      title: "Manufacturers",
      singularTitle: "Manufacturer",
      icon: "bi-building",
      endpoint: "/api/admin/manufacturers",
      columns: [
        { field: "name", label: "Name" },
        { field: "code", label: "Code" },
        { field: "contact_info", label: "Contact Info" },
      ],
      modal: ManufacturerModal,
      sortOptions: [
        { field: "name", direction: "asc", label: "Name (A-Z)" },
        { field: "name", direction: "desc", label: "Name (Z-A)" },
        { field: "code", direction: "asc", label: "Code (A-Z)" },
        { field: "code", direction: "desc", label: "Code (Z-A)" },
      ],
    },
  };

  const {
    data,
    error,
    isLoading,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    handleSort,
    handleSearch,
    refreshData,
  } = useTableData(tabs[activeTab].endpoint);

  if (error) {
    return (
      <div className="page-content">
        <div className="alert alert-danger">
          Failed to load data. Please try again later.
        </div>
      </div>
    );
  }

  const ModalComponent = tabs[activeTab].modal;

  const handleEdit = (item) => {
    if (!item) return;
    setEditItem(item);
    setShowModal(true);
  };

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const endpoint = tabs[activeTab].endpoint;
      const response = editItem
        ? await api.update(endpoint, editItem.id, formData)
        : await api.create(endpoint, formData);

      if (response) {
        toast.success(
          `${tabs[activeTab].singularTitle} ${
            editItem ? "updated" : "created"
          } successfully`
        );
        setShowModal(false);
        setEditItem(null);
        refreshData();
      }
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error(
        error.response?.data?.message || "Failed to save. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.delete(tabs[activeTab].endpoint, id);
      toast.success(`${tabs[activeTab].singularTitle} deleted successfully`);
      setShowModal(false);
      setEditItem(null);
      refreshData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <Nav variant="tabs" className="product-tabs">
        {Object.entries(tabs).map(([key, tab]) => (
          <Nav.Item key={key}>
            <Nav.Link
              active={activeTab === key}
              onClick={() => setActiveTab(key)}
              className="d-flex align-items-center"
            >
              <i className={`bi ${tab.icon} me-2`}></i>
              {tab.title}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <DataTable
        title={
          <>
            <i className={`bi ${tabs[activeTab].icon} me-2`}></i>
            {tabs[activeTab].title}
          </>
        }
        columns={tabs[activeTab].columns}
        data={data}
        isLoading={isLoading}
        actionButton={
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="d-inline-flex align-items-center"
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add {tabs[activeTab].singularTitle}
          </Button>
        }
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        onSort={handleSort}
        onSearch={handleSearch}
        onRowClick={handleEdit}
        sortOptions={tabs[activeTab].sortOptions}
        className="product-table"
      />

      {showModal && (
        <ModalComponent
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          {...(editItem && { [activeTab.slice(0, -1)]: editItem })}
        />
      )}
    </div>
  );
};

export default ProductsPage;
