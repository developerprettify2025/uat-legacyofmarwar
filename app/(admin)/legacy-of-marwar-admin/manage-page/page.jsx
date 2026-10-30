'use client';
import { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import DataTable from "react-data-table-component";
import Link from "next/link";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ServiceSkeleton from "@/components/backendcomponents/listskeleton";
import { useCheckLoginQuery } from "@/store/backendSlice/authAPISlice";
import { useGetStaticsQuery } from "@/store/backendSlice/staticAPISlice";
import { usePagePermission } from "../usePagePermission";
import styles from "../content-list.module.css";

const PAGE_STORAGE_KEY = 'current_page_name';
const PAGINATION_PREFIX = 'pagination_';

const getStorageKey = (pathname) => {
  const [path] = pathname.split('?');
  const match = path.match(/\/legacy-of-marwar-admin\/(manage-[^\/]+|addupd-[^\/]+)/);
  if (match) {
    const pageIdentifier = match[1];
    const normalizedKey = pageIdentifier.replace('addupd-', 'manage-');
    return `${PAGINATION_PREFIX}${normalizedKey}`;
  }

  const tableStyles = {
    table: { style: { backgroundColor: "transparent" } },
    headRow: {
      style: {
        minHeight: "44px",
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
        paddingLeft: "14px",
        paddingRight: "14px",
      },
    },
    rows: {
      style: {
        minHeight: "66px",
        color: "#334155",
        fontSize: "13px",
        borderBottom: "1px solid #edf1f5",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f8fbff",
        outline: "none",
      },
    },
    cells: { style: { paddingLeft: "14px", paddingRight: "14px" } },
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
  return null;
};

export default function ManageStaticData() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 180000, // 3 minutes
    skipPollingIfUnfocused: true,
  });
  const pagePermission = usePagePermission(checkData);
  const [filterText, setFilterText] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const { data: staticData = [], isLoading } = useGetStaticsQuery();

  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const storageKey = getStorageKey(currentPath);
      if (storageKey) {
        const stored = localStorage.getItem(storageKey);
        return stored ? parseInt(stored, 25) : 25;
      }
    }
    return 3;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const currentStorageKey = getStorageKey(currentPath);
      if (currentStorageKey) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(PAGINATION_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem(PAGE_STORAGE_KEY, currentStorageKey);
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const storageKey = getStorageKey(currentPath);
        if (!storageKey) {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(PAGINATION_PREFIX) || key === PAGE_STORAGE_KEY) {
              localStorage.removeItem(key);
            }
          });
        }
      }
    };
  }, []);

  const handlePerRowsChange = (newPerPage) => {
    setRowsPerPage(newPerPage);
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const storageKey = getStorageKey(currentPath);
      if (storageKey) {
        localStorage.setItem(storageKey, newPerPage.toString());
      }
    }
  };

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isSuccess, checkData, router]);

  useEffect(() => {
    if (checkData?.loggedIn && pagePermission && pagePermission.CanRead !== 1) {
      toast.error("You do not have permission to view this page");
      router.push("/legacy-of-marwar-admin/dashboard");
    }
  }, [checkData, pagePermission, router]);

  const columns = [
    {
      name: "S.No Name",
      sortable: true,
      cell: (row) =>
        isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Skeleton circle width={40} height={40} />
            <Skeleton width={200} />
          </div>
        ) : (
          <div className={styles.nameCell}>
            <span className={styles.serial}>{row.SerialNo}</span>
            {row.StaticName}
          </div>
        ),
      width: pagePermission?.CanWrite === 1 ? "65%" : "75%",
    },
    {
      name: "Date",
      selector: (row) => row.PostedDate,
      cell: (row) => (isLoading ? <Skeleton width={100} /> : row.PostedDate),
      width: "145px",
    },
    {
      name: "Status",
      cell: (row) =>
        isLoading ? (
          <Skeleton width={75} />
        ) : (
          <span className={`${styles.statusBadge} ${Number(row.ActiveStatus) === 1 ? "" : styles.inactive}`}>
            <span className={styles.statusDot} />
            {Number(row.ActiveStatus) === 1 ? "Active" : "Inactive"}
          </span>
        ),
      width: "120px",
    },
    ...(pagePermission?.CanWrite === 1
      ? [
        {
          name: "Action",
          cell: (row) =>
            isLoading ? (
              <Skeleton circle width={24} height={24} />
            ) : (
              <Link
                href={`/legacy-of-marwar-admin/addupd-page?ID=${row.StaticID}`}
                className={styles.iconButton}
                aria-label={`Edit ${row.StaticName}`}
                title={`Edit ${row.StaticName}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                  <g fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M13.198 1.22L3.12 11.298a1 1 0 0 0-.282.555l-.705 4.594a1 1 0 0 0 1.14 1.14l4.595-.705a1 1 0 0 0 .555-.281L18.501 6.523a1 1 0 0 0 0-1.414l-3.89-3.89a1 1 0 0 0-1.413 0M4.317 15.404l.448-2.924l9.14-9.14l2.475 2.476l-9.14 9.14z"
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
  ];

  const filteredData = useMemo(() => {
    return (staticData || []).filter((item) => {
      const searchText = filterText.toLowerCase();
      const fullName = item.StaticName?.toLowerCase() || "";
      const matchesText = fullName.includes(searchText);
      const matchesOption = !selectedOption || item.ActiveStatus.toString() === selectedOption;
      return matchesText && matchesOption;
    });
  }, [staticData, filterText, selectedOption]);

  const subHeaderComponent = (
    <div className={styles.toolbar} style={{ display: "flex" }}>
      <div className={styles.filters}>
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
          className={styles.filter}
          aria-label="Filter pages by status"
        >
          <option value="">All statuses</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
        <input
          type="text"
          placeholder="Search page titles..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className={styles.search}
          aria-label="Search page titles"
        />
      </div>
      <div className={styles.actions}>
        {pagePermission?.CanAdd === 1 && (
          <Link href="/legacy-of-marwar-admin/addupd-page" className={styles.addButton}>
            <span aria-hidden="true">+</span> New page
          </Link>
        )}
      </div>
    </div>
  );

  const SkeletonLoader = () => (
    <div>{[...Array(10)].map((_, i) => (<ServiceSkeleton key={i} />))}</div>
  );

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>Manage Page Data</h1>
        <div className={styles.tableFrame}>
          <DataTable
            columns={columns}
            data={filteredData}
            striped
            pagination
            highlightOnHover
            selectableRowsHighlight
            subHeader
            progressPending={isLoading}
            progressComponent={<SkeletonLoader />}
            //subHeaderComponent={subHeaderComponent}
            customStyles={tableStyles}
            paginationRowsPerPageOptions={[25, 50, 75, 100]}
            paginationPerPage={rowsPerPage}
            onChangeRowsPerPage={handlePerRowsChange}
            subHeaderWrap
            responsive
          />
        </div>
      </section>
    </main>
  );
}

const tableStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      minHeight: "44px",
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
      paddingLeft: "14px",
      paddingRight: "14px",
    },
  },
  rows: {
    style: {
      minHeight: "66px",
      color: "#334155",
      fontSize: "13px",
      borderBottom: "1px solid #edf1f5",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#f8fbff",
      outline: "none",
    },
  },
  cells: { style: { paddingLeft: "14px", paddingRight: "14px" } },
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
