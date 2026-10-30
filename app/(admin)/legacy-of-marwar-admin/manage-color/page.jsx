"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useDeleteColorMutation,
  useGetAllColorsQuery,
} from "../../../../store/backendSlice/colorAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

export default function ManageColorPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data, isLoading, isError } = useGetAllColorsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteColor, { isLoading: isDeleting }] = useDeleteColorMutation();
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

  const colors = Array.isArray(data?.data) ? data.data : [];
  const filteredColors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return colors;
    return colors.filter((color) =>
      [color.ColorID, color.ColorName, color.ColorCode]
        .some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [colors, search]);

  const handleDelete = async (color) => {
    if (pagePermission.CanDelete !== 1) {
      toast.error("You do not have permission to delete colors.");
      return;
    }
    if (!window.confirm(`Delete "${color.ColorName}"?`)) return;
    try {
      const response = await deleteColor(color.ColorID).unwrap();
      if (response.success) toast.success(response.message);
      else toast.error(response.message || "Could not delete color.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete color.");
    }
  };

  const columns = [
    { name: "ID", selector: (row) => row.ColorID, width: "78px", sortable: true },
    {
      name: "Color",
      cell: (row) => (
        <div className={styles.colorCell}>
          <span className={styles.swatch} style={{ backgroundColor: row.ColorCode }} />
          <span>{row.ColorName}</span>
        </div>
      ),
      sortable: true,
      grow: 2,
    },
    { name: "Display Order", selector: (row) => row.DisplayOrder ?? "-", sortable: true, width: "135px" },
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
            <Link className={styles.editButton} href={`/legacy-of-marwar-admin/addupd-color?ID=${row.ColorID}`}>Edit</Link>
          )}
          {/* {pagePermission.CanDelete === 1 && (
            <button className={styles.deleteButton} type="button" disabled={isDeleting} onClick={() => handleDelete(row)}>Delete</button>
          )} */}
        </div>
      ),
      minWidth: "170px",
      ignoreRowClick: true,
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <h1>Manage Colors</h1>
            <p>View and maintain color names and codes.</p>
          </div>
          {pagePermission.CanAdd === 1 && (
            <Link className={styles.addButton} href="/legacy-of-marwar-admin/addupd-color">Add Color</Link>
          )}
        </div>
        <div className={styles.tableFrame}>
          <div className={styles.toolbar}>
            <span>{filteredColors.length} color{filteredColors.length === 1 ? "" : "s"}</span>
            <input
              className={styles.search}
              type="search"
              aria-label="Search colors"
              placeholder="Search colors..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isError ? (
            <p className={styles.error}>Unable to load colors. Please refresh and try again.</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredColors}
              keyField="ColorID"
              striped
              pagination
              highlightOnHover
              responsive
              progressPending={isLoading}
              noDataComponent="No colors found."
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
