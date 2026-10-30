"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useDeleteOccasionMutation,
  useGetAllOccasionsQuery,
} from "../../../../store/backendSlice/occasionAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const videoUrl = (video) =>
  video ? `/OnlineImages/OccasionImages/${encodeURIComponent(video)}` : "";

const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export default function ManageOccasionPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data, isLoading, isError } = useGetAllOccasionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteOccasion, { isLoading: isDeleting }] = useDeleteOccasionMutation();
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

  const occasions = Array.isArray(data?.data) ? data.data : [];
  const filteredOccasions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return occasions;
    return occasions.filter((occasion) =>
      [occasion.OccasionName, occasion.OccasionURL, occasion.OccasionID]
        .some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [occasions, search]);

  const handleDelete = async (occasion) => {
    if (pagePermission.CanDelete !== 1) {
      toast.error("You do not have permission to delete occasions.");
      return;
    }
    if (!window.confirm(`Delete "${occasion.OccasionName}"?`)) return;
    try {
      const response = await deleteOccasion(occasion.OccasionID).unwrap();
      if (response.success) toast.success(response.message);
      else toast.error(response.message || "Could not delete occasion.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete occasion.");
    }
  };

  const columns = [
    { name: "ID", selector: (row) => row.OccasionID, width: "78px", sortable: true },
    {
      name: "Occasion",
      cell: (row) => (
        <div className={styles.occasionCell}>
          {row.OccasionImage ? (
            <video className={styles.occasionImage} src={videoUrl(row.OccasionImage)} controls preload="metadata" aria-label={`${row.OccasionName} video`} />
          ) : <span className={styles.noImage}>No video</span>}
        </div>
      ),
      width: "125px",
    },
    { name: "Occasion Name", selector: (row) => row.OccasionName, sortable: true, width: "550px" },
    { name: "Display Order", selector: (row) => row.DisplayOrder, sortable: true, width: "135px" },
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
          {pagePermission.CanWrite === 1 && <Link className={styles.editButton} href={`/legacy-of-marwar-admin/addupd-occasion?ID=${row.OccasionID}`}>Edit</Link>}
          {/* {pagePermission.CanDelete === 1 && <button className={styles.deleteButton} type="button" disabled={isDeleting} onClick={() => handleDelete(row)}>Delete</button>} */}
        </div>
      ),
      minWidth: "150px",
      ignoreRowClick: true,
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <h1>Manage Occasions</h1>
            <p>View and maintain the occasion records.</p>
          </div>
          {pagePermission.CanAdd === 1 && <Link className={styles.addButton} href="/legacy-of-marwar-admin/addupd-occasion">Add Occasion</Link>}
        </div>
        <div className={styles.tableFrame}>
          <div className={styles.toolbar}>
            <span>{filteredOccasions.length} occasion{filteredOccasions.length === 1 ? "" : "s"}</span>
            <input
              className={styles.search}
              type="search"
              aria-label="Search occasions"
              placeholder="Search occasions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isError ? (
            <p className={styles.error}>Unable to load occasions. Please refresh and try again.</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredOccasions}
              keyField="OccasionID"
              striped
              pagination
              highlightOnHover
              responsive
              progressPending={isLoading}
              noDataComponent="No occasions found."
              paginationRowsPerPageOptions={[10, 25, 50]}
              customStyles={{
                headRow: { style: { backgroundColor: "#f8fafc", minHeight: "46px" } },
                headCells: { style: { color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" } },
                rows: { style: { minHeight: "68px", fontSize: "13px" } },
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
