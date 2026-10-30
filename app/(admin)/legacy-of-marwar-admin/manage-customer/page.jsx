"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useDeleteCustomerMutation,
  useGetAllCustomersQuery,
} from "../../../../store/backendSlice/customerAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

export default function ManageCustomerPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data, isLoading, isError } = useGetAllCustomersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.CanRead !== 1) {
      toast.error("You do not have permission to view this page.");
      router.push("/legacy-of-marwar-admin/dashboard");
    }
  }, [checkData?.loggedIn, pagePermission.CanRead, router]);

  const customers = Array.isArray(data?.data) ? data.data : [];
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [
        customer.CustomerID,
        customer.CustomerName,
        customer.CustomerEmailID,
        customer.CustomerPhoneNo,
      ].some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [customers, search]);

  const handleDelete = async (customer) => {
    if (pagePermission.CanDelete !== 1) {
      toast.error("You do not have permission to delete customers.");
      return;
    }
    if (!window.confirm(`Delete customer "${customer.CustomerName}"?`)) return;
    try {
      const response = await deleteCustomer(customer.CustomerID).unwrap();
      if (response.success) toast.success(response.message);
      else toast.error(response.message || "Could not delete customer.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete customer.");
    }
  };

  const columns = [
    { name: "ID", selector: (row) => row.CustomerID, sortable: true, width: "82px" },
    { name: "Customer Name", selector: (row) => row.CustomerName, sortable: true, grow: 1.2 },
    { name: "Email", selector: (row) => row.CustomerEmailID, sortable: true, grow: 1.5 },
    { name: "Phone", selector: (row) => row.CustomerPhoneNo, sortable: true, width: "170px" },
    {
      name: "Status",
      cell: (row) => {
        const active = Number(row.ActiveStatus) === 1;
        return <span className={active ? styles.active : styles.inactive}>{active ? "Active" : "Inactive"}</span>;
      },
      width: "110px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className={styles.actions}>
          {pagePermission.CanWrite === 1 && (
            <Link
              className={styles.editButton}
              href={`/legacy-of-marwar-admin/addupd-customer?ID=${row.CustomerID}`}
            >
              Edit
            </Link>
          )}
          {/* {pagePermission.CanDelete === 1 && (
            <button
              className={styles.deleteButton}
              type="button"
              disabled={isDeleting}
              onClick={() => handleDelete(row)}
            >
              Delete
            </button>
          )} */}
        </div>
      ),
      Width: "160px",
      ignoreRowClick: true,
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <h1>Manage Customers</h1>
            <p>View and maintain customer account details.</p>
          </div>
          {pagePermission.CanAdd === 1 && (
            <Link className={styles.addButton} href="/legacy-of-marwar-admin/addupd-customer">
              Add Customer
            </Link>
          )}
        </div>
        <div className={styles.tableFrame}>
          <div className={styles.toolbar}>
            <span>{filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"}</span>
            <input
              className={styles.search}
              type="search"
              aria-label="Search customers"
              placeholder="Search name, email, or phone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isError ? (
            <p className={styles.error}>Unable to load customers. Please refresh and try again.</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCustomers}
              keyField="CustomerID"
              striped
              pagination
              highlightOnHover
              responsive
              progressPending={isLoading}
              noDataComponent="No customers found."
              paginationRowsPerPageOptions={[10, 25, 50]}
              customStyles={{
                headRow: { style: { backgroundColor: "#f8fafc", minHeight: "46px" } },
                headCells: { style: { color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" } },
                rows: { style: { minHeight: "62px", fontSize: "13px" } },
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
