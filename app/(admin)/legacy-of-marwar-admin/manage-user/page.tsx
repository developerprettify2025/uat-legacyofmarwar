"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import DataTable, { TableColumn } from "react-data-table-component";
import Link from "next/link";
import toast from "react-hot-toast";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import AdminStaticData from "@/components/backendcomponents/AdminStaticData.json";
import { useCheckLoginQuery } from "@/store/backendSlice/authAPISlice";
import { useGetUsersQuery, useGetUserByIdQuery, useSignInMutation } from "../../../../store/backendSlice/authAPISlice";
import { usePagePermission } from "../usePagePermission";

type User = {
  loginID: number;
  FullName: string;
  Role: string;
  EmailID: string;
  PhoneNumber: string;
  ProfileImage: string;
  UserName: string;
  Passwords: string;
  ActiveStatus: number;
  Permissions?: { [pageId: string]: Permissions };
};

type Permissions = {
  CanRead: number;
  CanWrite: number;
  CanDelete: number;
  CanAdd: number;
};

type Page = {
  PageID: string | number;
  Header: string;
  PageName: string;
  PageIcon: string;
  PageRoute: string;
};



export default function ManageUserData() {
  const router = useRouter();
  const Menu = AdminStaticData.Menu.items;
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [UserData, setUserData] = useState<User[]>([]);
  const [filterText, setFilterText] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<{ [pageId: string]: Permissions }>({});
  const [register, { isLoading: isSigningIn }] = useSignInMutation();
  const loginID = selectedUser?.loginID ?? null;
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,

  });
  const pagePermission = usePagePermission(checkData);
  const { data: users, refetch } = useGetUsersQuery(undefined);
  const { data: userData } = useGetUserByIdQuery(loginID, {
    skip: !loginID,
  });

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

  useEffect(() => {
    if (loginID) {
      if (userData?.success) {
        const data = userData.data;
        let perms: { [pageId: string]: Permissions } = {};
        if (data.Permissions) {
          try {
            perms = JSON.parse(data.Permissions) as { [pageId: string]: Permissions };
          } catch {
            perms = {};
          }
        }
        setUserPermissions(perms);
      } else if (userData && !userData.success) {
        toast.error("Failed to fetch user details.");
      }
    }
  }, [loginID, userData]);

  useEffect(() => {
    const mappedPages: Page[] = Menu.flatMap((item) => {
      const basePage: Page = {
        PageID: item.PageID,
        Header: "",
        PageName: item.title,
        PageIcon: item.icon,
        PageRoute: item.url,
      };

      const childPages: Page[] =
        item.MoreItem?.map((sub: any) => ({
          PageID: sub.PageID,
          Header: item.title,
          PageName: sub.title,
          PageIcon: sub.icon,
          PageRoute: sub.url,
        })) || [];

      return [basePage, ...childPages];
    });
    setPages(mappedPages);
    setLoading(false);
  }, [Menu]);

  useEffect(() => {
    if (users) {
      setUserData(users);
    }
  }, [users]);

  const handlePermissionChange = (pageId: string, perm: keyof Permissions, checked: boolean) => {
    setUserPermissions((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId] || { CanRead: 0, CanWrite: 0, CanDelete: 0, CanAdd: 0 },
        [perm]: checked ? 1 : 0,
      },
    }));
  };

  const handleDelete = async (loginID: number) => {
    if (pagePermission?.CanDelete !== 1) {
      toast.error("You do not have permission to delete users");
      return;
    }
    const confirmed = confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;
    try {
      const response = await fetch(`${apiUrl}/auth/delete-user/${loginID}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("User deleted successfully");
        await refetch();
      } else {
        toast.error(result.message || "Error deleting user.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    if (pagePermission?.CanWrite !== 1) {
      toast.error("You do not have permission to update permissions");
      return;
    }
    try {
      const result = await register({
        LoginID: selectedUser.loginID,
        FullName: selectedUser.FullName,
        EmailID: selectedUser.EmailID,
        PhoneNumber: selectedUser.PhoneNumber,
        UserName: selectedUser.UserName,
        Role: selectedUser.Role,
        Passwords: selectedUser.Passwords,
        ActiveStatus: selectedUser.ActiveStatus,
        ProfileImage: selectedUser.ProfileImage,
        UpdatedBy: "admin",
        permissions: JSON.stringify(userPermissions),
      }).unwrap();

      if (result.success) {
        toast.success("Permissions updated successfully");
        await refetch();
        setIsPopupOpen(false);
      } else {
        toast.error(result.message || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Error updating permissions");
    }
  };

  const openMessagePopup = (user: User) => {
    setSelectedUser(user);
    setIsPopupOpen(true);
  };

  const handleApprove = async (id: number, currentStatus: number) => {
    if (pagePermission?.CanWrite !== 1) {
      toast.error("You do not have permission to update status");
      return;
    }
    const confirmed = confirm("Are you sure you want to update this status?");
    if (!confirmed) return;
    try {
      const updatedStatus = currentStatus === 1 ? 0 : 1;
      const response = await axios.post(
        `${apiUrl}/auth/update-status`,
        {
          loginID: id,
          ActiveStatus: updatedStatus,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Status updated successfully");
        await refetch();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    }
  };

  const columns: TableColumn<User>[] = [
    {
      name: "User Details",
      selector: (row) => row.FullName,
      sortable: true,
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {row.ProfileImage ? (
            <img src={`/OnlineImages/AuthImages/${row.ProfileImage}`} alt={row.UserName} className="user-image" />
          ) : (
            <div className="user-image-none">{row.UserName ? row.UserName[0].toUpperCase() : "U"}</div>
          )}
          <span>{row.FullName}</span>
        </div>
      ),
      width: "55%",
    },
    {
      name: "User Type",
      selector: (row) => row.Role,
      sortable: true,
      width: "120px",
    },
    {
      name: "UserName",
      selector: (row) => row.UserName,
      sortable: true,
      width: "170px",
    },
    {
      name: "Permissions",
      cell: (row) => (
        <button onClick={() => openMessagePopup(row)} className="message-btn">
          View/Edit
        </button>
      ),
      width: "140px",
    },
    {
      name: "Status",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: row.ActiveStatus ? "green" : "red" }}>{row.ActiveStatus ? "Active" : "Inactive"}</span>
          {pagePermission?.CanWrite === 1 && (
            <button
              className="approve-btn"
              style={{ color: row.ActiveStatus ? "red" : "green" }}
              onClick={() => handleApprove(row.loginID, row.ActiveStatus)}
            >
              {row.ActiveStatus ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15l-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152l2.758 3.15a1.2 1.2 0 0 1 0 1.698" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 7L9 19l-5.5-5.5l1.41-1.41L9 16.17L19.59 5.59z" />
                </svg>
              )}
            </button>
          )}
        </div>
      ),
      width: "140px",
    },
    ...(pagePermission?.CanWrite === 1
      ? [{
        name: "Edit",
        cell: (row: User) => (
          <Link href={`/legacy-of-marwar-admin/addupd-user?loginID=${row.loginID}`} className="edit-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
              <g fill="currentColor">
                <path fillRule="evenodd" d="M13.198 1.22L3.12 11.298a1 1 0 0 0-.282.555l-.705 4.594a1 1 0 0 0 1.14 1.14l4.595-.705a1 1 0 0 0 .555-.281L18.501 6.523a1 1 0 0 0 0-1.414l-3.89-3.89a1 1 0 0 0-1.413 0M4.317 15.404l.448-2.924l9.14-9.14l2.475 2.476l-9.14 9.14z" clipRule="evenodd" />
                <path d="m11.442 5.247l1.06-1.061l3.242 3.24l-1.061 1.061z" />
              </g>
            </svg>
          </Link>
        ),
        width: "80px",
      }]
      : []),
    ...(pagePermission?.CanDelete === 1
      ? [{
        name: "Delete",
        cell: (row: User) => (
          <button onClick={() => handleDelete(row.loginID)} className="edit-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z" />
            </svg>
          </button>
        ),
        width: "80px",
      }]
      : []),
  ];

  const filteredData = UserData.filter((item) => {
    const searchText = filterText.toLowerCase();
    const matchesText = item.FullName?.toLowerCase().includes(searchText) || item.UserName?.toLowerCase().includes(searchText);
    const matchesOption = !selectedOption || item.ActiveStatus.toString() === selectedOption;
    return matchesText && matchesOption;
  });

  const subHeaderComponent = (
    <div className="subheader-container">
      <div className="colA">
        <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} className="dropdown">
          <option value="">Select Status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
        <input type="text" placeholder="Search Users..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="searchinput" />
      </div>
      <div className="colB">
        {pagePermission?.CanAdd === 1 && (
          <Link href={"/legacy-of-marwar-admin/addupd-user"} className="addnew-btn" style={{ width: "110px" }}>
            <span>+</span> Add New
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <main style={{ padding: "24px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "24px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "24px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
          Manage User Access
        </h1>
        <DataTable
          columns={columns}
          data={filteredData}
          striped
          pagination
          highlightOnHover
          selectableRowsHighlight
          subHeader
          subHeaderComponent={subHeaderComponent}
          paginationRowsPerPageOptions={[10, 30, 50, 100]}
          subHeaderWrap
          responsive
        />
      </div>
      {isPopupOpen && selectedUser && (
        <div className="popup-overlay manage_user_pop">
          <div className="popup-box">
            <button className="close-btn" onClick={() => setIsPopupOpen(false)}>×</button>
            <h2>User Details</h2>
            <div style={{ marginBottom: "5px" }}>
              <p><strong>Name:</strong> {selectedUser.FullName}</p>
              <p><strong>Role:</strong> {selectedUser.Role}</p>
              <p><strong>Email:</strong> {selectedUser.EmailID}</p>
              <p><strong>Phone:</strong> {selectedUser.PhoneNumber}</p>
              <p><strong>UserName:</strong> {selectedUser.UserName}</p>
              <p><strong>Password:</strong> {selectedUser.Passwords}</p>
            </div>
            <h2 style={{ marginTop: "2rem" }}>Pages Permission</h2>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="inputTable" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
                <thead>
                  <tr>
                    <th>Page Name</th>
                    <th>Read</th>
                    <th>Write</th>
                    <th>Delete</th>
                    <th>Add</th>
                  </tr>
                </thead>
                <tbody>
                  {pages
                    .filter((page) => page.PageRoute !== "#")
                    .map((page) => {
                      const perms = userPermissions[page.PageID.toString()] || {
                        CanRead: 0,
                        CanWrite: 0,
                        CanDelete: 0,
                        CanAdd: 0,
                      };
                      return (
                        <tr key={`${page.PageID}`}>
                          <td style={{ border: "1px solid #ccc", padding: "8px" }}>{page.PageName}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                            <input type="checkbox" checked={perms.CanRead === 1} onChange={(e) => handlePermissionChange(page.PageID.toString(), "CanRead", e.target.checked)} disabled={pagePermission?.CanWrite !== 1} />
                          </td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                            <input type="checkbox" checked={perms.CanWrite === 1} onChange={(e) => handlePermissionChange(page.PageID.toString(), "CanWrite", e.target.checked)} disabled={pagePermission?.CanWrite !== 1} />
                          </td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                            <input type="checkbox" checked={perms.CanDelete === 1} onChange={(e) => handlePermissionChange(page.PageID.toString(), "CanDelete", e.target.checked)} disabled={pagePermission?.CanWrite !== 1} />
                          </td>
                          <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                            <input type="checkbox" checked={perms.CanAdd === 1} onChange={(e) => handlePermissionChange(page.PageID.toString(), "CanAdd", e.target.checked)} disabled={pagePermission?.CanWrite !== 1} />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <div className="colB" style={{ marginTop: "1rem" }}>
              {pagePermission?.CanWrite === 1 && (
                <button className="message-btn" style={{ width: "110px" }} onClick={handleSavePermissions} disabled={isSigningIn}>
                  {isSigningIn ? "Saving..." : "Update"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
