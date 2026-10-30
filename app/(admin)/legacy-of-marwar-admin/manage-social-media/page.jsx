"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
import {
  useDeleteMediaMutation,
  useGetAllMediasQuery,
} from "../../../../store/backendSlice/mediaAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "./page.module.css";

const videoUrl = (video) =>
  video ? `/OnlineImages/MediaImages/${encodeURIComponent(video)}` : "";

const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export default function ManageMediaPage() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const pagePermission = usePagePermission(checkData);
  const { data, isLoading, isError } = useGetAllMediasQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteMedia, { isLoading: isDeleting }] = useDeleteMediaMutation();
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

  const medias = Array.isArray(data?.data) ? data.data : [];
  const filteredMedias = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return medias;
    return medias.filter((media) =>
      [media.MediaName, media.MediaURL, media.MediaID]
        .some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [medias, search]);

  const handleDelete = async (media) => {
    if (pagePermission.CanDelete !== 1) {
      toast.error("You do not have permission to delete medias.");
      return;
    }
    if (!window.confirm(`Delete "${media.MediaName}"?`)) return;
    try {
      const response = await deleteMedia(media.MediaID).unwrap();
      if (response.success) toast.success(response.message);
      else toast.error(response.message || "Could not delete media.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete media.");
    }
  };

  const columns = [
    { name: "ID", selector: (row) => row.MediaID, width: "78px", sortable: true },
    {
      name: "Media",
      cell: (row) => (
        <div className={styles.mediaCell}>
          {row.MediaImage ? (
            <video className={styles.mediaImage} src={videoUrl(row.MediaImage)} controls preload="metadata" aria-label={`${row.MediaName} video`} />
          ) : <span className={styles.noImage}>No video</span>}
        </div>
      ),
      width: "125px",
    },
    { name: "Media Name", selector: (row) => row.MediaName, sortable: true, width: "550px" },
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
          {pagePermission.CanWrite === 1 && <Link className={styles.editButton} href={`/legacy-of-marwar-admin/addupd-social-media?ID=${row.MediaID}`}>Edit</Link>}
          {pagePermission.CanDelete === 1 && <button className={styles.deleteButton} type="button" disabled={isDeleting} onClick={() => handleDelete(row)}>Delete</button>}
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
            <h1>Manage Social Media</h1>
            <p>View and maintain the social media records.</p>
          </div>
          {pagePermission.CanAdd === 1 && <Link className={styles.addButton} href="/legacy-of-marwar-admin/addupd-social-media">Add Social Media</Link>}
        </div>
        <div className={styles.tableFrame}>
          <div className={styles.toolbar}>
            <span>{filteredMedias.length} media{filteredMedias.length === 1 ? "" : "s"}</span>
            <input
              className={styles.search}
              type="search"
              aria-label="Search medias"
              placeholder="Search medias..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isError ? (
            <p className={styles.error}>Unable to load medias. Please refresh and try again.</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredMedias}
              keyField="MediaID"
              striped
              pagination
              highlightOnHover
              responsive
              progressPending={isLoading}
              noDataComponent="No medias found."
              paginationRowsPerPageOptions={[10, 25, 50]}
              customStyles={{
                headRow: { style: { backgroundColor: "#f8fafc", minHeight: "46px" } },
                headCells: { style: { color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" } },
                rows: { style: { height: "84px", minHeight: "84px", maxHeight: "84px", fontSize: "13px" } },
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
