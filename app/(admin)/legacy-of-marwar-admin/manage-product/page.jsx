"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import Link from "next/link";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useCheckLoginQuery } from "@/store/backendSlice/authAPISlice";
import { useGetAllCategorysQuery } from "@/store/backendSlice/categoryAPISlice";
import { useGetAllProductsQuery, useDeleteProductMutation, useUpdateProductStatusMutation, useUpdateDisplayOrderMutation, } from "@/store/backendSlice/productAPISlice";
import TestimonialSkeleton from "@/components/backendcomponents/listskeleton";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";
const PAGINATION_KEY = "manage-product-rows-v2";
export default function ManageProductData() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {refetchOnMountOrArgChange: true, pollingInterval: 180000, skipPollingIfUnfocused: true, });
  const pagePermission = usePagePermission(checkData);
  const [filterText, setFilterText] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const { data: productData = [], refetch, isLoading } = useGetAllProductsQuery();
  const { data: categories = [] } = useGetAllCategorysQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [updateStatus] = useUpdateProductStatusMutation();
  const [updateDisplayOrder] = useUpdateDisplayOrderMutation();
  const [displayOrders, setDisplayOrders] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (typeof window === "undefined") return 25;
    return Number(localStorage.getItem(PAGINATION_KEY)) || 25;
  });

  useEffect(() => {
    if (!selectedImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedImage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);
  // Login Check
  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isSuccess, checkData?.loggedIn, router]);
  // Permission Check
  useEffect(() => {
    if (checkData?.loggedIn && pagePermission?.CanRead !== 1) {
      toast.error("You do not have permission to view this page");

      router.push("/legacy-of-marwar-admin/dashboard");
    }
  }, [checkData?.loggedIn, pagePermission?.CanRead, router]);

  // Display Orders
  useEffect(() => {
    if (productData.length > 0) {
      const orders = {};

      productData.forEach((product) => {
        orders[product.ProductID] = product.DisplayOrder;
      });

      setDisplayOrders(orders);
    }
  }, [productData]);

  const handlePerRowsChange = (newPerPage) => {
    setRowsPerPage(newPerPage);
    localStorage.setItem(PAGINATION_KEY, newPerPage.toString());
  };

  const handleDisplayOrderChange = (id, value) => {
    setDisplayOrders((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleUpdateDisplayOrder = async () => {
    if (pagePermission?.CanWrite !== 1) {
      toast.error("You do not have permission to update display order");
      return;
    }

    const updates = Object.entries(displayOrders).map(([id, order]) => ({
      ProductID: parseInt(id),
      DisplayOrder: parseInt(order) || 0,
    }));

    try {
      const res = await updateDisplayOrder(updates).unwrap();

      if (res.success) {
        toast.success("Display orders updated successfully");
      } else {
        toast.error("Failed to update display orders");
      }
    } catch {
      toast.error("Error updating display orders");
    }
  };

  const handleDelete = async (ProductID) => {
    if (pagePermission?.CanDelete !== 1) {
      toast.error("You do not have permission to delete product");
      return;
    }

    if (!confirm("Are you sure you want to delete this Product post?")) {
      return;
    }

    try {
      const res = await deleteProduct(ProductID).unwrap();

      if (res.success) {
        toast.success("Product deleted successfully");
        refetch();
      } else {
        toast.error("Error deleting Product.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleApprove = async (ProductID, currentStatus) => {
    if (pagePermission?.CanWrite !== 1) {
      toast.error("You do not have permission to update status");
      return;
    }

    if (!confirm("Are you sure you want to update this status?")) {
      return;
    }

    try {
      const updatedStatus = Number(currentStatus) === 1 ? 0 : 1;

      const res = await updateStatus({
        ProductID,
        ActiveStatus: updatedStatus,
      }).unwrap();

      if (res.success) {
        toast.success("Status updated successfully");
        refetch();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  const filteredData = productData.filter((item) => {
    const searchText = filterText.trim().toLowerCase();

    const matchesText =
      String(item.ProductName ?? "").toLowerCase().includes(searchText) ||
      String(item.ProductCode ?? "").toLowerCase().includes(searchText);

    const matchesStatus =
      !selectedOption || String(item.ActiveStatus) === selectedOption;
    const matchesCategory =
      !selectedCategory || String(item.CategoryID) === selectedCategory;

    return matchesText && matchesStatus && matchesCategory;
  });

  const columns = [
    {
      name: "Title",
      selector: (row) => row.ProductName,
      sortable: true,
      cell: (row) =>
        isLoading ? (
          <div
            className={styles.titleCell}
          >
            <Skeleton circle width={40} height={40} />
            <Skeleton width={200} />
          </div>
        ) : (
          <div className={styles.titleCell}>
            <span className={styles.serial}>{row.SerialNo}</span>
            <span className={styles.productTitle}>{row.ProductName ?? ""}</span>
          </div>
        ),
      width: "40%",
    },    
    {
      name: "Category",
      selector: (row) => row.CategoryName,
      width: "250px",
    },
    {
      name: "Image",
      selector: (row) => row.ProductImage,
      cell: (row) =>
        isLoading ? (
          <Skeleton circle width={40} height={40} />
        ) : (
          <button
            type="button"
            className={styles.thumbnailButton}
            onClick={() =>
              setSelectedImage({
                src: `/OnlineImages/ProductImages/${row.ProductImage}`,
                alt: `${row.ProductName} thumbnail`,
              })
            }
            aria-label={`View thumbnail for ${row.ProductName}`}
          >
            <img
              src={`/OnlineImages/ProductImages/${row.ProductImage}`}
              alt=""
              className={styles.thumbnail}
            />
          </button>
        ),
      width: "105px",
    },    
    {
      name: "Date",
      selector: (row) => row.PostedDate,
      width: "135px",
    },
    {
      name: "Status",
      cell: (row) =>
        isLoading ? (
          <Skeleton width={70} />
        ) : (
          <span className={`${styles.statusBadge} ${Number(row.ActiveStatus) === 1 ? styles.active : styles.inactive}`}>
            <span className={styles.statusDot} />
            {Number(row.ActiveStatus) === 1 ? "Active" : "Inactive"}
          </span>
        ),
      width: "110px",
    },
    ...(pagePermission?.CanWrite === 1
      ? [
          {
            name: "Status As",
            cell: (row) =>
              isLoading ? (
                <Skeleton width={76} height={30} />
              ) : (
                <button
                  type="button"
                  className={`${styles.statusAction} ${Number(row.ActiveStatus) === 1 ? styles.setInactive : styles.setActive}`}
                  aria-label={`Change ${row.ProductName} status to ${Number(row.ActiveStatus) === 1 ? "inactive" : "active"}`}
                  onClick={() => handleApprove(row.ProductID, row.ActiveStatus)}
                >
                  {Number(row.ActiveStatus) === 1 ? "Inactive" : "Active"}
                </button>
              ),
            width: "110px",
          },
        ]
      : []),
    ...(pagePermission?.CanWrite === 1
      ? [
          {
            name: "Action",
            cell: (row) =>
              isLoading ? (
                <Skeleton circle width={24} height={24} />
              ) : (
                <Link
                  href={`/legacy-of-marwar-admin/addupd-product?ID=${row.ProductID}`}
                  className={styles.iconButton}
                  aria-label={`Edit ${row.ProductName}`}
                  title="Edit product"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                  >
                    <g fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M13.198 1.22L3.12 11.298a1 1 0 0 0-.282.555l-.705 4.594a1 1 0 0 0 1.14 1.14l4.595-.705a1 1 0 0 0 .555-.281L18.501 6.523a1 1 0 0 0 0-1.414l-3.89-3.89a1.2 1.2 0 0 0-1.413 0M4.317 15.404l.448-2.924l9.14-9.14l2.475 2.476l-9.14 9.14z"
                        clipRule="evenodd"
                      />
                      <path d="m11.442 5.247l1.06-1.061l3.242 3.24l-1.061 1.061z" />
                    </g>
                  </svg>
                </Link>
              ),
            width: "90px",
          },
        ]
      : []),
    // ...(pagePermission?.CanDelete === 1
    //   ? [
    //       {
    //         name: "Delete",
    //         cell: (row) =>
    //           isLoading ? (
    //             <Skeleton circle width={24} height={24} />
    //           ) : (
    //             <button
    //               onClick={() => handleDelete(row.ProductID)}
    //               className={`${styles.iconButton} ${styles.deleteButton}`}
    //               aria-label={`Delete ${row.ProductName}`}
    //               title="Delete product"
    //             >
    //               <svg
    //                 xmlns="http://www.w3.org/2000/svg"
    //                 width="24"
    //                 height="24"
    //                 viewBox="0 0 24 24"
    //               >
    //                 <path
    //                   fill="currentColor"
    //                   d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
    //                 />
    //               </svg>
    //             </button>
    //           ),
    //         width: "90px",
    //       },
    //     ]
    //   : []),
  ];

  const subHeaderComponent = (
    <div className={styles.toolbar}>
      <div className={styles.filters}>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
          className={styles.statusFilter}
          aria-label="Filter products by status"
        >
          <option value="">Select Status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className={styles.statusFilter}
          aria-label="Filter products by category"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.CategoryID} value={category.CategoryID}>
              {category.CategoryName}
            </option>
          ))}
        </select>

        <label className={styles.searchBox}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            placeholder="Search product titles or codes..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Search product titles or product codes"
          />
        </label>
      </div>

      <div className={styles.toolbarActions}>        
        {pagePermission?.CanAdd === 1 && (
          <Link href="/legacy-of-marwar-admin/addupd-product"className={styles.addButton}>
            <span aria-hidden="true">+</span> New Product
          </Link>
        )}
      </div>
    </div>
  );

  const SkeletonLoader = () => (
    <div>
      {[...Array(10)].map((_, i) => (
        <TestimonialSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.pageTitle}>Manage Product Data</h1>
        <div className={styles.tableFrame}>
          <DataTable
            columns={columns}
            data={filteredData}
            striped
            pagination
            highlightOnHover
            selectableRowsHighlight
            subHeader
            subHeaderComponent={subHeaderComponent}
            customStyles={tableStyles}
            paginationRowsPerPageOptions={[25, 50, 75, 100]}
            paginationPerPage={rowsPerPage}
            onChangeRowsPerPage={handlePerRowsChange}
            subHeaderWrap
            progressPending={isLoading}
            progressComponent={<SkeletonLoader />}
            responsive
          />
          <span className={styles.resultCount}>Total: {filteredData.length} {filteredData.length === 1 ? "Product" : "Products"}</span>
        </div>
      </section>
      {selectedImage && (
        <div
          className={styles.imageOverlay}
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <div
            className={styles.imageDialog}
            role="dialog"
            aria-modal="true"
            aria-label="Product image preview"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.previewClose}
              onClick={() => setSelectedImage(null)}
              aria-label="Close image preview"
            >
              &times;
            </button>
            <img src={selectedImage.src} alt={selectedImage.alt} />
          </div>
        </div>
      )}
    </main>
  );
}

const tableStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      minHeight: "42px",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #e8edf3",
    },
  },
  headCells: {
    style: {
      color: "#64748b",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  rows: {
    style: {
      minHeight: "64px",
      color: "#334155",
      fontSize: "13px",
      borderBottom: "1px solid #edf1f5",
      transition: "background-color 150ms ease",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#f8fbff",
      outline: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  subHeader: {
    style: {
      padding: "0 0 12px",
      backgroundColor: "transparent",
    },
  },
  pagination: {
    style: {
      minHeight: "48px",
      color: "#64748b",
      fontSize: "12px",
      borderTop: "1px solid #edf1f5",
    },
  },
};
