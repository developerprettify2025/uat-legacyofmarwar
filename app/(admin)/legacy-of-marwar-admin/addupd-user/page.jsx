"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import AdminStaticData from "@/components/backendcomponents/AdminStaticData.json";
import { useSignInMutation, useGetUserByIdQuery } from "../../../../store/backendSlice/authAPISlice";
import { usePagePermission } from "../usePagePermission";
import { useCheckLoginQuery } from "../../../../store/backendSlice/authAPISlice";
const defaultPermissions = {};

export default function AddUpdUser() {
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const Menu = AdminStaticData.Menu.items;
  const searchParams = useSearchParams();
  const loginID = searchParams ? searchParams.get("loginID") : null;
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useSignInMutation();
  const [previewImage, setPreviewImage] = useState("");
  const { data: userData, isLoading: isUserLoading, isError } = useGetUserByIdQuery(loginID, {
    skip: !loginID,
  });
  const { data: checkData, isSuccess } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 180000, // 3 minutes
    skipPollingIfUnfocused: true,
  });
  const pagePermission = usePagePermission(checkData);
  const isPermissionsReady = checkData?.loggedIn && pagePermission?.PageID !== 0;
  const [formData, setFormData] = useState({
    FullName: "",
    EmailID: "",
    PhoneNumber: "",
    Role: "",
    ProfileImage: "",
    UserName: "",
    Passwords: "",
    ActiveStatus: false,
    permissions: defaultPermissions,
  });
  const [formErrors, setFormErrors] = useState({});
  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isSuccess, checkData, router]);

  useEffect(() => {
    if (isPermissionsReady) {
      const requiredPermission = loginID ? pagePermission.CanWrite : pagePermission.CanAdd;
      if (requiredPermission !== 1) {
        toast.error(`You do not have permission to ${loginID ? 'edit' : 'add'} user`);
        router.push("/legacy-of-marwar-admin/manage-user");
      }
    }
  }, [isPermissionsReady, pagePermission, loginID, router]);

  useEffect(() => {
    if (loginID && userData) {
      if (userData.success) {
        const data = userData.data;
        let perms = {};
        if (data.Permissions) {
          try {
            perms = JSON.parse(data.Permissions);
          } catch {
            perms = {};
          }
        }
        setFormData({
          FullName: data.FullName || "",
          EmailID: data.EmailID || "",
          PhoneNumber: data.PhoneNumber || "",
          Role: data.Role || "",
          ProfileImage: data.ProfileImage || "",
          UserName: data.UserName || "",
          Passwords: data.Passwords || "",
          ActiveStatus: data.ActiveStatus === 1,
          permissions: perms,
        });
        if (data.ProfileImage) {
          setPreviewImage(`/OnlineImages/AuthImages/${data.ProfileImage}`);
        }
      } else {
        toast.error("Failed to fetch user details.");
      }
    }
  }, [loginID, userData]);



  useEffect(() => {
    const mappedPages = Menu.flatMap((item) => {
      const basePage = {
        PageID: item.PageID,
        Header: "",
        PageName: item.title,
        PageIcon: item.icon,
        PageRoute: item.url,
      };
      const childPages = item.MoreItem?.map((sub) => ({
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

  const handleInput = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePermissionChange = (pageId, perm, checked) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [pageId]: {
          ...prev.permissions[pageId],
          [perm]: checked ? 1 : 0,
        },
      },
    }));
  };

  const generatePassword = () => {
    const name = formData.FullName.trim().replace(/\s+/g, "");
    const role = formData.Role.trim().replace(/\s+/g, "");
    return name && role ? `${name}@${role}` : "";
  };



  const validateForm = () => {
    const errors = {};
    if (!formData.Role.trim()) {
      errors.Role = "Please select user type.";
    }
    if (!formData.FullName.trim()) {
      errors.FullName = "Please enter full name.";
    } else if (formData.FullName.trim().length < 2) {
      errors.FullName = "Full name must be at least 2 characters.";
    }
    if (!formData.EmailID.trim()) {
      errors.EmailID = "Please enter email.";
    } else {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.EmailID.trim())) {
        errors.EmailID = "Please enter a valid email address.";
      }
    }
    if (!formData.PhoneNumber.trim()) {
      errors.PhoneNumber = "Please enter phone number.";
    } else {
      const digitsOnly = formData.PhoneNumber.replace(/\D/g, "");
      if (digitsOnly.length < 8) {
        errors.PhoneNumber = "Phone number must be at least 8 digits.";
      } else if (digitsOnly.length > 14) {
        errors.PhoneNumber = "Phone number cannot exceed 14 digits.";
      } else if (!/^[0-9+\s()-]+$/.test(formData.PhoneNumber.trim())) {
        errors.PhoneNumber = "Phone number contains invalid characters.";
      }
    }
    if (!loginID && !formData.Passwords.trim()) {
    } else if (formData.Passwords.trim() && formData.Passwords.length < 6) {
      errors.Passwords = "Password must be at least 6 characters.";
    }
    return errors;
  };
  const handleSubmit = async () => {
    const requiredPermission = loginID ? pagePermission.CanWrite : pagePermission.CanAdd;
    if (requiredPermission !== 1) {
      toast.error(`You do not have permission to ${loginID ? 'edit' : 'add'} user`);
      return;
    }
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const normalizedPermissions = {};
    Object.entries(formData.permissions).forEach(([pageId, p]) => {
      normalizedPermissions[pageId] = {
        CanRead: p.CanRead ?? 0,
        CanWrite: p.CanWrite ?? 0,
        CanDelete: p.CanDelete ?? 0,
        CanAdd: p.CanAdd ?? 0,
      };
    });
    let finalPassword = formData.Passwords;
    if (!loginID && !finalPassword.trim()) {
      finalPassword = generatePassword();
    }
    const formDataToSend = new FormData();
    formDataToSend.append("FullName", formData.FullName);
    formDataToSend.append("EmailID", formData.EmailID);
    formDataToSend.append("PhoneNumber", formData.PhoneNumber);
    formDataToSend.append("Role", formData.Role);
    formDataToSend.append(
      "UserName",
      formData.FullName
        ? `${formData.FullName.trim().replace(/\s+/g, ".")}.NAVAYU`
        : ""
    );
    formDataToSend.append("Passwords", finalPassword);
    formDataToSend.append("ActiveStatus", formData.ActiveStatus ? "1" : "0");
    formDataToSend.append("UpdatedBy", "Admin Panel");
    formDataToSend.append("permissions", JSON.stringify(normalizedPermissions));
    if (formData.ProfileImage && typeof formData.ProfileImage !== 'string') {
      formDataToSend.append("ProfileImage", formData.ProfileImage);
    }
    if (loginID) {
      formDataToSend.append("LoginID", loginID);
    }

    try {
      const result = await register(formDataToSend).unwrap();
      if (result.success) {
        toast.success(result.message || "User saved successfully");
        setFormData({
          FullName: "",
          EmailID: "",
          PhoneNumber: "",
          Role: "",
          ProfileImage: "",
          UserName: "",
          Passwords: "",
          ActiveStatus: true,
          permissions: {},
        });
        router.push("/legacy-of-marwar-admin/manage-user");
      } else {
        toast.error(result.message || "Save failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  if (isUserLoading && loginID) {
    return (
      <main className="add_update container" style={{ padding: "24px" }}>
        <div className="form-box">
          <p>Loading user data...</p>
        </div>
      </main>
    );
  }


  return (
    <main className="add_update container" style={{ padding: "24px" }}>
      <div className="form-box">
        <h1>{loginID ? "Edit User" : "Add User"}</h1>
        <div className="form-group-row" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>User Role*</label>
            <select
              value={formData.Role}
              onChange={(e) => handleInput("Role", e.target.value)}
              className="form-group"
              style={{ marginBottom: "4px" }}
            >
              <option value="">Select User Type</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Sub Agent">Sub Agent</option>
              <option value="Corporate">Corporate Client</option>
            </select>
            {formErrors.Role && <p className="error">{formErrors.Role}</p>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Full Name*</label>
            <input
              type="text"
              value={formData.FullName}
              onChange={(e) => handleInput("FullName", e.target.value)}
              placeholder="e.g. Dr. Ananya Sharma"
            />
            {formErrors.FullName && <p className="error">{formErrors.FullName}</p>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Email ID*</label>
            <input
              type="email"
              value={formData.EmailID}
              onChange={(e) => handleInput("EmailID", e.target.value)}
              placeholder="e.g. admin@navayu.com"
            />
            {formErrors.EmailID && <p className="error">{formErrors.EmailID}</p>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Phone Number*</label>
            <input
              type="tel"
              value={formData.PhoneNumber}
              onChange={(e) => handleInput("PhoneNumber", e.target.value)}
              placeholder="e.g. +91 9876543210"
              maxLength={14}
            />
            {formErrors.PhoneNumber && <p className="error">{formErrors.PhoneNumber}</p>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleInput("ProfileImage", e.target.files?.[0])}
            />
          </div>
          {previewImage && <img src={previewImage} alt="user" width={70} height={70} />}
        </div>
        <div className="form-group-row" style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
          {loginID && (
            <div className="form-group" style={{ flex: 1 }}>
              <label>
                Username* <span className="hint-text">(auto generated)</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                value={formData.UserName}
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>
          )}
          {loginID && (
            <div className="form-group" style={{ flex: 1 }}>
              <label>New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={6}
                value={formData.Passwords}
                onChange={(e) => handleInput("Passwords", e.target.value)}
                placeholder="Leave blank to keep current"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "27px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px"
                }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
              {formErrors.Passwords && <p className="error">{formErrors.Passwords}</p>}
            </div>
          )}
          <div className="form-group-row statusac" style={{ marginBottom: "0" }}>
            <input
              type="checkbox"
              id="chkActiveStatus"
              checked={formData.ActiveStatus}
              onChange={(e) => handleInput("ActiveStatus", e.target.checked)}
              style={{ marginRight: "0.5rem" }}
            />
            <label htmlFor="chkActiveStatus">Active Status</label>
          </div>
        </div>
        <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Page Permissions</h2>
        <table className="inputTable" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Page Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>Read</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>Add</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>Update</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {pages
              .filter((page) => page.PageRoute !== "#")
              .map((page) => {
                const perms = formData.permissions[page.PageID.toString()] || {
                  CanRead: 0,
                  CanWrite: 0,
                  CanDelete: 0,
                  CanAdd: 0
                };
                return (
                  <tr key={`${page.PageID}-${Math.random()}`}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{page.PageName}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={perms.CanRead === 1}
                        onChange={(e) =>
                          handlePermissionChange(page.PageID.toString(), "CanRead", e.target.checked)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={perms.CanAdd === 1}
                        onChange={(e) =>
                          handlePermissionChange(page.PageID.toString(), "CanAdd", e.target.checked)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={perms.CanWrite === 1}
                        onChange={(e) =>
                          handlePermissionChange(page.PageID.toString(), "CanWrite", e.target.checked)
                        }
                      />
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={perms.CanDelete === 1}
                        onChange={(e) =>
                          handlePermissionChange(page.PageID.toString(), "CanDelete", e.target.checked)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <div>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Submit"}
          </button>
          <Link href="/legacy-of-marwar-admin/manage-user" className="back-btn">
            Back
          </Link>
        </div>
      </div>
    </main>
  );
}