"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import { useGetAllCustomerWishlistsQuery } from "../../../../store/backendSlice/customerWishlistAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

export default function ManageCustomerWishlistPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data, isLoading, isError } = useGetAllCustomerWishlistsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.CanRead !== 1) {
      toast.error("You do not have permission to view customer wishlists.");
      router.push("/legacy-of-marwar-admin/dashboard");
    }
  }, [checkData, pagePermission, router]);

  const wishlists = Array.isArray(data?.data) ? data.data : [];
  const customers = useMemo(() => {
    const uniqueCustomers = new Map();
    wishlists.forEach((item) => {
      const customerId = Number(item.CustomerID);
      if (!customerId || uniqueCustomers.has(customerId)) return;
      uniqueCustomers.set(customerId, {
        value: String(customerId),
        label: item.CustomerName || `Customer #${customerId}`,
      });
    });
    return [...uniqueCustomers.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [wishlists]);

  const products = useMemo(() => {
    const uniqueProducts = new Map();
    wishlists.forEach((item) => {
      const productId = item.ProductID ?? item.ProductCode ?? item.ProductName;
      const productKey = String(productId ?? "").trim();
      const productName = item.ProductName || `Product #${productKey || "Unknown"}`;
      if (!productKey || uniqueProducts.has(productKey)) return;
      uniqueProducts.set(productKey, {
        value: productKey,
        label: productName,
      });
    });
    return [...uniqueProducts.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [wishlists]);

  const filteredWishlists = useMemo(() => {
    const term = search.trim().toLowerCase();
    return wishlists.filter((item) => {
      const matchesTerm =
        !term ||
        [
          item.CustomerWishlistID,
          item.CustomerID,
          item.CustomerName,
          item.CustomerEmailID,
          item.CustomerPhoneNo,
          item.ProductID,
          item.ProductName,
          item.ProductCode,
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesCustomer =
        customerFilter === "all" || String(item.CustomerID) === String(customerFilter);
      const productKey = String(item.ProductID ?? item.ProductCode ?? item.ProductName ?? "").trim();
      const matchesProduct =
        productFilter === "all" || productKey === productFilter || String(item.ProductName ?? "") === productFilter;
      const matchesStatus =
        statusFilter === "all" || Number(item.ActiveStatus) === Number(statusFilter);
      return matchesTerm && matchesCustomer && matchesProduct && matchesStatus;
    });
  }, [wishlists, search, customerFilter, productFilter, statusFilter]);

  const columns = [
    { name: "Customer", selector: (row) => row.CustomerName || `Customer #${row.CustomerID}`, grow: 1.2, sortable: true,
      cell: (row) => (
        <div className={styles.customerCell}>
          <strong>{row.CustomerName || `Customer #${row.CustomerID}`}</strong>
          <span><b>Email:</b> {row.CustomerEmailID || "-"}</span>
          <span><b>Mobile:</b> {row.CustomerPhoneNo || "-"}</span>
        </div>
      ),
    },
    {
      name: "Product",
      selector: (row) => row.ProductName || `Product #${row.ProductID}`,
      sortable: true,
      grow: 1.4,
      cell: (row) => (
        <div className={styles.productCell}>
          <div className={styles.productImageFrame}>
            {row.ProductImage ? (
              <img
                src={`/OnlineImages/ProductImages/${encodeURIComponent(row.ProductImage)}`}
                alt=""
              />
            ) : (
              <span>No image</span>
            )}
          </div>
          <div className={styles.productDetails}>
            <strong>{row.ProductName || `Product #${row.ProductID}`}</strong>
            {row.ProductCode && <span>Code: {row.ProductCode}</span>}
          </div>
        </div>
      ),
    },
    {
      name: "Added",
      selector: (row) => row.PostedDate || "",
      sortable: true,
      width: "130px",
    },
    {
      name: "Status",
      cell: (row) => {
        const active = Number(row.ActiveStatus) === 1;
        return (
          <span className={active ? styles.active : styles.removed}>
            {active ? "Saved" : "Removed"}
          </span>
        );
      },
      width: "115px",
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <h1>Customer Wishlists</h1>
            <p>View products saved to customer wishlists. Changes are managed from the storefront.</p>
          </div>
          <span className={styles.total}>{filteredWishlists.length} entries</span>
        </div>
        <div className={styles.tableFrame}>
          <div className={styles.toolbar}>
            <span>{wishlists.length} total wishlist entries</span>
            <div className={styles.filters}>
              <select
                className={styles.statusFilter}
                aria-label="Filter wishlist customer"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
              >
                <option value="all">All customers</option>
                {customers.map((customer) => (
                  <option key={customer.value} value={customer.value}>
                    {customer.label}
                  </option>
                ))}
              </select>
              <select
                className={styles.statusFilter}
                aria-label="Filter wishlist product"
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
              >
                <option value="all">All products</option>
                {products.map((product) => (
                  <option key={product.value} value={product.value}>
                    {product.label}
                  </option>
                ))}
              </select>
              <select
                className={styles.statusFilter}
                aria-label="Filter wishlist status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="1">Saved</option>
                <option value="0">Removed</option>
              </select>
              <input
                className={styles.search}
                type="search"
                aria-label="Search customer wishlists"
                placeholder="Search customer or product..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          {isError ? (
            <p className={styles.error}>Unable to load wishlists. Please refresh and try again.</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredWishlists}
              keyField="CustomerWishlistID"
              striped
              pagination
              highlightOnHover
              responsive
              progressPending={isLoading}
              noDataComponent="No wishlist entries found."
              paginationRowsPerPageOptions={[10, 25, 50]}
              customStyles={{
                headRow: { style: { backgroundColor: "#f8fafc", minHeight: "46px" } },
                headCells: {
                  style: {
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  },
                },
                rows: { style: { minHeight: "88px", fontSize: "13px" } },
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
