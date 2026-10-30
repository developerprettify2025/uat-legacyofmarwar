"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useDeleteCouponMutation,
  useGetAllCouponsQuery,
} from "../../../../store/backendSlice/couponAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
};

export default function ManageCouponPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data, isLoading, isError } = useGetAllCouponsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) router.push("/legacy-of-marwar-admin/login");
  }, [isSuccess, checkData?.loggedIn, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission.CanRead !== 1) {
      toast.error("You do not have permission to view this page.");
      router.push("/legacy-of-marwar-admin/dashboard");
    }
  }, [checkData, pagePermission, router]);

  const coupons = Array.isArray(data?.data) ? data.data : [];
  const filteredCoupons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coupons;
    return coupons.filter((coupon) =>
      [
        coupon.CouponID,
        coupon.CouponName,
        coupon.CouponCode,
        coupon.CouponType,
      ].some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [coupons, search]);

  const handleDelete = async (coupon) => {
    if (pagePermission.CanDelete !== 1) {
      toast.error("You do not have permission to delete coupons.");
      return;
    }
    if (!window.confirm(`Delete coupon "${coupon.CouponCode}"?`)) return;
    try {
      const response = await deleteCoupon(coupon.CouponID).unwrap();
      toast.success(response.message || "Coupon deleted.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete coupon.");
    }
  };

  const columns = [
    { name: "ID", selector: (row) => row.CouponID, width: "76px", sortable: true },
    { name: "Coupon Name", selector: (row) => row.CouponName, sortable: true, grow: 1.5 },
    { name: "Code", selector: (row) => row.CouponCode, sortable: true, grow: 1 },
    {
      name: "Discount",
      cell: (row) => (
        <span>
          {row.CouponValue}
          {row.CouponType === "Percentage" ? "%" : " amount"}
        </span>
      ),
      sortable: true,
      width: "130px",
    },
    {
      name: "Minimum Amount",
      selector: (row) => row.CouponMinAmount,
      sortable: true,
      width: "145px",
    },
    {
      name: "Valid Dates",
      cell: (row) => (
        <span>
          {formatDate(row.CouponStartDate)} – {formatDate(row.CouponExpiryDate)}
        </span>
      ),
      Width: "200px",
    },
    {
      name: "Status",
      cell: (row) => {
        const active = Number(row.ActiveStatus) === 1;
        return (
          <span className={active ? styles.active : styles.inactive}>
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
      width: "105px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className={styles.actions}>
          {pagePermission.CanWrite === 1 && (
            <Link
              className={styles.editButton}
              href={`/legacy-of-marwar-admin/addupd-coupon?ID=${row.CouponID}`}
            >
              Edit
            </Link>
          )}
          {pagePermission.CanDelete === 1 && (
            <button
              className={styles.deleteButton}
              type="button"
              disabled={isDeleting}
              onClick={() => handleDelete(row)}
            >
              Delete
            </button>
          )}
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
            <h1>Manage Coupons</h1>
            <p>Create and maintain discount coupons.</p>
          </div>
          {pagePermission.CanAdd === 1 && (
            <Link className={styles.addButton} href="/legacy-of-marwar-admin/addupd-coupon">
              Add Coupon
            </Link>
          )}
        </div>
        <div className={styles.tableFrame}>
          <div className={styles.toolbar}>
            <span>
              {filteredCoupons.length} coupon{filteredCoupons.length === 1 ? "" : "s"}
            </span>
            <input
              className={styles.search}
              type="search"
              aria-label="Search coupons"
              placeholder="Search name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isError ? (
            <p className={styles.error}>Unable to load coupons. Please refresh and try again.</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCoupons}
              keyField="CouponID"
              striped
              pagination
              highlightOnHover
              responsive
              progressPending={isLoading}
              noDataComponent="No coupons found."
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
                rows: { style: { minHeight: "68px", fontSize: "13px" } },
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
