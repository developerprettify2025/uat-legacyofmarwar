'use client';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import { useCheckLoginQuery } from "@/store/backendSlice/authAPISlice";
import {
  useGetAllLeadsQuery,
  useDeleteEnquiryMutation,
  useUpdateLeadStatusMutation,
} from "@/store/backendSlice/contactUsAPISlice";
import ServiceSkeleton from "@/components/backendcomponents/listskeleton";
import styles from "./page.module.css";

const PAGE_STORAGE_KEY = 'current_page_name';
const PAGINATION_PREFIX = 'pagination_';
const LEAD_STATUSES = ["New", "Open", "Closed", "Fake"];
// Once a lead is Closed or Fake, its status can no longer be changed from this page
const LOCKED_STATUSES = ["Closed", "Fake"];

const getStorageKey = (pathname) => {
  const [path] = pathname.split('?');
  const match = path.match(/\/legacy-of-marwar-admin\/(manage-[^\/]+|addupd-[^\/]+)/);
  if (match) {
    const pageIdentifier = match[1];
    const normalizedKey = pageIdentifier.replace('addupd-', 'manage-');
    return `${PAGINATION_PREFIX}${normalizedKey}`;
  }
  return null;
};

const escapeHtml = (str = "") =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatDateTime = (date = new Date()) =>
  date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// Returns EnquiryFor only when it is different from EnquiryType (and not empty)
const getDistinctEnquiryFor = (item) => {
  const type = (item?.EnquiryType || "").trim();
  const enquiryFor = (item?.EnquiryFor || "").trim();
  if (!enquiryFor) return "";
  if (enquiryFor.toLowerCase() === type.toLowerCase()) return "";
  return enquiryFor;
};

export default function ManageVisitorEnquiry() {
  const router = useRouter();
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [filterText, setFilterText] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedEnquiryFor, setSelectedEnquiryFor] = useState(""); // NEW
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { data: leadData = [], isLoading, refetch } = useGetAllLeadsQuery();
  const [deleteEnquiry] = useDeleteEnquiryMutation();
  const [updateLeadStatus, { isLoading: isUpdatingLeadStatus }] = useUpdateLeadStatusMutation();
  const [leadStatusFilter, setLeadStatusFilter] = useState("");

  // Remark popup state
  const [statusChange, setStatusChange] = useState(null); // { row, newStatus }
  const [remarkText, setRemarkText] = useState("");

  // Change this to wherever your login API returns the admin's name
  const adminName =
    checkData?.adminName ||
    checkData?.user?.name ||
    checkData?.user?.FullName ||
    checkData?.name ||
    "Admin";

  const openMessagePopup = (user) => {
    setSelectedUser(user);
    setIsPopupOpen(true);
  };

  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const storageKey = getStorageKey(currentPath);
      if (storageKey) {
        const stored = localStorage.getItem(storageKey);
        return stored ? parseInt(stored, 10) : 10;
      }
    }
    return 10;
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

  // Escape closes whichever popup is open
  useEffect(() => {
    if (!isPopupOpen && !statusChange) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (statusChange) closeRemarkPopup();
        else setIsPopupOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPopupOpen, statusChange]);

  // Dropdown selected -> open remark popup (no API call yet)
  const handleLeadStatusSelect = (row, newStatus) => {
    const currentStatus = row.LeadStatus || "New";

    // Closed / Fake leads cannot be changed
    if (LOCKED_STATUSES.includes(currentStatus)) {
      toast.error(`${currentStatus} leads cannot be changed.`);
      return;
    }
    if (newStatus === currentStatus) return;

    setRemarkText("");
    setStatusChange({ row, newStatus });
  };

  const closeRemarkPopup = () => {
    setStatusChange(null);
    setRemarkText("");
  };

  // Save status + remark
  const handleRemarkSubmit = async () => {
    if (!statusChange) return;

    // Extra safety: never submit a change for a locked lead
    if (LOCKED_STATUSES.includes(statusChange.row.LeadStatus || "New")) {
      toast.error("This lead cannot be changed.");
      closeRemarkPopup();
      return;
    }

    const cleanRemark = remarkText.trim();
    if (!cleanRemark) {
      toast.error("Please enter a remark.");
      return;
    }

    // Result: Reply:<text><br/>Reply BY:Admin Name On datetime
    const Remark = `<hr />Status:${escapeHtml(statusChange.newStatus).replace(/\n/g, "<br/>")}<br/>Reply:${escapeHtml(cleanRemark).replace(/\n/g, "<br/>")}<br/>Reply BY:${escapeHtml(adminName)} On ${formatDateTime()}`;

    try {
      const result = await updateLeadStatus({
        ContactID: statusChange.row.ContactID,
        LeadStatus: statusChange.newStatus,
        Remark,
      }).unwrap();
      toast.success(result.message || "Lead status updated.");
      closeRemarkPopup();
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Could not update lead status.");
    }
  };

  const leadStatusCounts = LEAD_STATUSES.reduce((counts, status) => {
    counts[status] = (leadData || []).filter((lead) => (lead.LeadStatus || "New") === status).length;
    return counts;
  }, {});

  const columns = [
    {
      name: "S.No.",
      sortable: true,
      selector: (row) => row.SerialNo,
      cell: (row) => <span className={styles.serial}>{row.SerialNo}</span>,
      width: "100px",
    },
    {
      name: "Name",
      selector: (row) => row.FullName,
      sortable: true,
      width: "190px"
    },
    {
      name: "Phone",
      selector: (row) => row.PhoneNo,
      sortable: true,
      width: "130px"
    },
    {
      name: "Email",
      selector: (row) => row.EmailID,
      sortable: true,
      width: "250px"
    },
    {
      name: "Enquiry Type",
      selector: (row) => row.EnquiryType,
      sortable: true,
      width: "190px",
    },
    {
      // NEW: shows EnquiryFor only when it differs from EnquiryType
      name: "Enquiry For",
      selector: (row) => getDistinctEnquiryFor(row) || "--",
      sortable: true,
      width: "170px",
    },
    {
      name: "Message",
      cell: (row) => (
        <button
          type="button"
          onClick={() => openMessagePopup(row)}
          className={styles.messageButton}
          aria-label={`Show enquiry from ${row.FullName}`}
        >
          Show
        </button>
      ),
      width: "100px",
    },
    {
      name: "Status",
      selector: (row) => row.LeadStatus || "New",
      sortable: true,
      cell: (row) => {
        const currentStatus = row.LeadStatus || "New";
        const isLocked = LOCKED_STATUSES.includes(currentStatus);

        return (
          <select
            className={`${styles.leadStatusSelect} ${styles[`leadStatus${currentStatus.replace(/\s/g, "")}`] || ""}`}
            value={currentStatus}
            disabled={isUpdatingLeadStatus || isLocked}
            title={isLocked ? `${currentStatus} leads cannot be changed` : undefined}
            style={isLocked ? { cursor: "not-allowed", opacity: 0.75 } : undefined}
            aria-label={`Lead status for ${row.FullName || "enquiry"}`}
            onChange={(event) => handleLeadStatusSelect(row, event.target.value)}
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        );
      },
      width: "130px",
    },
    {
      name: "Date",
      selector: (row) => row.PostedDate,
      sortable: true,
      width: "135px",
    },
  ];

  // NEW: unique EnquiryFor values inside the selected EnquiryType.
  // Values equal to EnquiryType (or empty) are ignored.
  const enquiryForOptions = selectedOption
    ? Array.from(
        new Set(
          (leadData || [])
            .filter((item) => item.EnquiryType === selectedOption)
            .map((item) => getDistinctEnquiryFor(item))
            .filter(Boolean)
        )
      ).sort()
    : [];

  // Dropdown shows only if at least one EnquiryFor differs from EnquiryType
  const showEnquiryForFilter = enquiryForOptions.length > 0;

  const filteredData = (leadData || []).filter((item) => {
    const searchText = filterText.toLowerCase();
    const fullName = item.FullName?.toLowerCase() || "";

    const matchesText =
      fullName.includes(searchText) ||
      item.EmailID?.toLowerCase().includes(searchText) ||
      item.PhoneNo?.toLowerCase().includes(searchText) ||
      item.EnquiryType?.toLowerCase().includes(searchText) ||
      item.EnquiryFor?.toLowerCase().includes(searchText) ||
      item.Message?.toLowerCase().includes(searchText);

    const matchesOption = !selectedOption || item.EnquiryType === selectedOption;

    // NEW
    const matchesEnquiryFor =
      !selectedEnquiryFor || getDistinctEnquiryFor(item) === selectedEnquiryFor;

    const matchesLeadStatus =
      !leadStatusFilter || (item.LeadStatus || "New") === leadStatusFilter;

    return matchesText && matchesOption && matchesEnquiryFor && matchesLeadStatus;
  });

  const handleDelete = async (ContactID) => {
    const confirmed = confirm("Are you sure you want to delete this enquiry?");
    if (!confirmed) return;
    try {
      const res = await deleteEnquiry(ContactID).unwrap();
      if (res.success) {
        toast.success("Visitor Enquiry deleted successfully");
        refetch();
      } else {
        toast.error("Error deleting Enquiry.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    }
  };

  const SkeletonLoader = () => (
    <div>
      {[...Array(10)].map((_, i) => (
        <ServiceSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <>
      <main className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.heading}>
            <div className={styles.headingIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 5.75h16a1.25 1.25 0 0 1 1.25 1.25v10A1.25 1.25 0 0 1 20 18.25H4A1.25 1.25 0 0 1 2.75 17V7A1.25 1.25 0 0 1 4 5.75Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className={styles.title}>Manage Visitor Enquiry</h1>
              <p className={styles.subtitle}>Review and manage messages submitted by your visitors.</p>
            </div>
          </div>
          <div className={styles.tableToolbar}>
            <div className={styles.statusSummary} aria-label="Enquiry totals by lead status">
              <button
                type="button"
                className={`${styles.statusSummaryButton} ${styles.statusSummaryTotal} ${!leadStatusFilter ? styles.statusSummaryActive : ""}`}
                onClick={() => setLeadStatusFilter("")}
                aria-pressed={!leadStatusFilter}
              >
                Total Enquiry <strong>{leadData.length}</strong>
              </button>
              {LEAD_STATUSES.map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`${styles.statusSummaryButton} ${styles[`statusSummary${status}`]} ${leadStatusFilter === status ? styles.statusSummaryActive : ""}`}
                  onClick={() => setLeadStatusFilter((current) => current === status ? "" : status)}
                  aria-pressed={leadStatusFilter === status}
                >
                  {status} <strong>{leadStatusCounts[status]}</strong>
                </button>
              ))}
            </div>
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                {/* Enquiry Type */}
                <select
                  value={selectedOption}
                  onChange={(e) => {
                    setSelectedOption(e.target.value);
                    setSelectedEnquiryFor(""); // reset Enquiry For when type changes
                  }}
                  className={styles.filter}
                  aria-label="Filter enquiries by type"
                >
                  <option value="">All lead types</option>
                  {Array.from(new Set((leadData || []).map(item => item.EnquiryType || "")))
                    .filter((type) => type)
                    .sort()
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>

                {/* Enquiry For (only when different from Enquiry Type) */}
                {showEnquiryForFilter && (
                  <select
                    value={selectedEnquiryFor}
                    onChange={(e) => setSelectedEnquiryFor(e.target.value)}
                    className={styles.filter}
                    aria-label="Filter enquiries by enquiry for"
                  >
                    <option value="">All {selectedOption}</option>
                    {enquiryForOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Search names, contact details, messages..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className={styles.search}
                  aria-label="Search visitor enquiries"
                />
              </div>
              <span className={styles.resultCount}>
                {filteredData.length} {filteredData.length === 1 ? "enquiry" : "enquiries"}
              </span>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredData}
            striped
            pagination
            highlightOnHover
            selectableRowsHighlight
            paginationRowsPerPageOptions={[10, 30, 50, 100]}
            paginationPerPage={rowsPerPage}
            onChangeRowsPerPage={handlePerRowsChange}
            responsive
            customStyles={tableStyles}
            conditionalRowStyles={[
              {
                when: (row) => row.LeadStatus === "Open",
                style: { backgroundColor: "#ff8a00", color: "#fff" },
              },
              {
                when: (row) => row.LeadStatus === "Closed",
                style: { backgroundColor: "#79bf62", color: "#fff" },
              },
              {
                when: (row) => row.LeadStatus === "Fake",
                style: { backgroundColor: "#ff3b22", color: "#fff" },
              },
            ]}
            progressPending={isLoading}
            progressComponent={<SkeletonLoader />}
          />
        </section>
      </main>

      {/* Enquiry details popup */}
      {isPopupOpen && selectedUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsPopupOpen(false)}
          role="presentation"
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsPopupOpen(false)}
              aria-label="Close enquiry details"
            >
              &times;
            </button>
            <span className={styles.modalEyebrow}>Visitor enquiry</span>
            <h2 className={styles.modalTitle} id="enquiry-modal-title">
              {selectedUser.EnquiryType || "Enquiry details"}
            </h2>
            <p className={styles.modalDate}>Received {selectedUser.PostedDate || "date unavailable"}</p>
            <dl className={styles.details}>
              <div><dt>Name</dt><dd>{selectedUser.FullName || "N/A"}</dd></div>
              <div><dt>Email</dt><dd>{selectedUser.EmailID || "N/A"}</dd></div>
              <div><dt>Phone</dt><dd>{selectedUser.PhoneNo || "N/A"}</dd></div>
              <div><dt>Enquiry For</dt><dd>{selectedUser.EnquiryFor || "--"}</dd></div>
              <div className={styles.messageDetail}><dt>Message</dt><dd>{selectedUser.Message || "N/A"}</dd></div>
              <div><dt>Enquiry Type</dt><dd>{selectedUser.EnquiryType || "N/A"}</dd></div>
              <div><dt>Page URL</dt><dd>{selectedUser.PageName || "N/A"}</dd></div>
              {selectedUser.LeadReply && (
                <div className={styles.messageDetail}>
                  <dt>Remarks</dt>
                  <dd dangerouslySetInnerHTML={{ __html: selectedUser.LeadReply }} />
                </div>
              )}
            </dl>
          </section>
        </div>
      )}

      {/* Remark popup (opens when a status is selected) */}
      {statusChange && (
        <div
          className={styles.modalOverlay}
          onClick={closeRemarkPopup}
          role="presentation"
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remark-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeRemarkPopup}
              aria-label="Close remark popup"
            >
              &times;
            </button>
            <span className={styles.modalEyebrow}>Update lead status</span>
            <h2 className={styles.modalTitle} id="remark-modal-title">
              {statusChange.row.LeadStatus || "New"} &rarr; {statusChange.newStatus}
            </h2>
            <p className={styles.modalDate}>
              {statusChange.row.FullName || "Enquiry"} &middot; Please add a remark to continue
            </p>

            <label className={styles.remarkField}>
              <span className={styles.remarkLabel}>Remark *</span>
              <textarea
                className={styles.remarkTextarea}
                rows={5}
                maxLength={4000}
                autoFocus
                placeholder="Write your remark..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
              />
              <div className={styles.remarkCount}>{remarkText.length} / 4000</div>
            </label>
            <div className={styles.remarkActions}>
              <button
                type="button"
                className={styles.remarkCancel}
                onClick={closeRemarkPopup}
                disabled={isUpdatingLeadStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.remarkSave}
                onClick={handleRemarkSubmit}
                disabled={isUpdatingLeadStatus}
              >
                {isUpdatingLeadStatus ? "Saving..." : "Save"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const tableStyles = {
  table: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      minHeight: "46px",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #e8edf3",
    },
  },
  headCells: {
    style: {
      color: "#64748b",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      paddingLeft: "14px",
      paddingRight: "14px",
    },
  },
  rows: {
    style: {
      minHeight: "64px",
      borderBottom: "1px solid #edf1f5",
      color: "#334155",
      fontSize: "13px",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#f8fbff",
      transitionDuration: "150ms",
      transitionProperty: "background-color",
    },
  },
  cells: {
    style: {
      paddingLeft: "14px",
      paddingRight: "14px",
    },
  },
  subHeader: {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: "12px",
      minHeight: "auto",
      width: "100%",
      padding: "14px 0 18px",
      backgroundColor: "transparent",
    },
  },
  pagination: {
    style: {
      minHeight: "54px",
      borderTop: "1px solid #edf1f5",
      color: "#64748b",
      fontSize: "12px",
    },
  },
};
