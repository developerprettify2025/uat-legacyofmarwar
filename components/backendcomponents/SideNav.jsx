'use client';
import AdminStaticData from './AdminStaticData.json';
import { useEffect, useState } from "react";
import parse from "html-react-parser";
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import toast from "react-hot-toast";
import { useLogoutMutation, authAPISlice, useUpdatePasswordMutation } from "../../store/backendSlice/authAPISlice";
import { useDispatch } from "react-redux";
import { useCheckLoginQuery } from "../../store/backendSlice/authAPISlice";
import Loader from "@/app/loading";
import { validateFields } from "@/utils/validateFields";

const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authHeader = "Basic " + btoa(`${username}:${password}`);



export default function SideNav() {
  const [logout] = useLogoutMutation();
  const [openIndex, setOpenIndex] = useState(null);
  const [isPasswordPopupOpen, setIsPasswordPopupOpen] = useState(false);
  const dispatch = useDispatch();
  const Menu = AdminStaticData.Menu.items;
  const pathname = usePathname();
  const [allowedMenu, setAllowedMenu] = useState([]);
  const router = useRouter();
  const { data: checkData, isSuccess, refetch } = useCheckLoginQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isSuccess && !checkData?.loggedIn) {
      router.push("/legacy-of-marwar-admin/login");
    }
  }, [isSuccess, checkData, router]);



  useEffect(() => {
    let hideBtn = document.querySelector('.hide_menu');
    let sideMenu = document.getElementsByTagName('aside');
    const menuToggle = () => {
      hideBtn?.classList.toggle('collapse');
      Array.from(sideMenu).forEach(item => item.classList.toggle('collapse'));
    };

    hideBtn?.addEventListener('click', menuToggle);

    return () => {
      hideBtn?.removeEventListener('click', menuToggle);
    };
  }, []);



  useEffect(() => {
    const storedPermissions = checkData?.permissions || [];
    const storedUser = checkData?.user || {};
    let filtered = [];

    if (storedUser?.Role === "Super Admin" || storedUser?.loginID === 1) {
      filtered = Menu;
    } else {
      Menu.forEach((item) => {
        if (item.PageID === 1) {
          filtered.push({ ...item, MoreItem: item.MoreItem || [] });
          return;
        }
        const perm = storedPermissions.find((p) => p.PageID === item.PageID);
        const allowedSubItems = item.MoreItem
          ? item.MoreItem.filter((sub) => {
            if (sub.PageID === 1) return true;

            const subPerm = storedPermissions.find((p) => p.PageID === sub.PageID);
            return (
              subPerm &&
              (subPerm.CanRead === 1 ||
                subPerm.CanWrite === 1 ||
                subPerm.CanAdd === 1 ||
                subPerm.CanDelete === 1)
            );
          })
          : [];

        if (
          (perm &&
            (perm.CanRead === 1 ||
              perm.CanWrite === 1 ||
              perm.CanAdd === 1 ||
              perm.CanDelete === 1)) ||
          allowedSubItems.length > 0
        ) {
          filtered.push({ ...item, MoreItem: allowedSubItems });
        }
      });
    }
    setAllowedMenu(filtered);
  }, [isSuccess, checkData, pathname]);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you really want to logout?");
    if (!confirmed) {
      return;
    }
    try {
      await logout().unwrap();
      router.push("/legacy-of-marwar-admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const openPasswordPopup = () => {
    setIsPasswordPopupOpen(true);
  };

  const closePasswordPopup = () => {
    setIsPasswordPopupOpen(false);
  };

  return (
    <>
      <aside className="">
        <div className="aside-wrap">
          <div className="aside-col">
            <ul className="Header_nav_Active">
              {allowedMenu
                .filter((item) => item.Show === "1")
                .map((item, index) => {
                  const subItems =
                    item.MoreItem?.filter((sub) => sub.Show === "1") || [];
                  const subUrls = subItems.flatMap((sub) => [sub.url, sub.addurl]) || [];
                  const isActive =
                    pathname === item.url ||
                    pathname === item.addurl ||
                    subUrls.includes(pathname);
                  const isDropdownOpen = openIndex === index;
                  return (
                    <li
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenIndex(openIndex === index ? null : index);
                      }}
                    >
                      <div
                        className={`nav-item-wrap ${subItems.length > 0 ? "hasDropdown" : ""}`}
                      >
                        <Link href={item.url} className={isActive ? "active" : ""}>
                          {parse(item.icon)} {item.title}
                        </Link>
                      </div>
                      {subItems.length > 0 && (
                        <ul className={`aside-dropdown ${isDropdownOpen ? "open" : ""}`}>
                          {subItems.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <Link
                                href={subItem.url}
                                className={pathname === subItem.url ? "active" : ""}
                              >
                                {subItem.icon && parse(subItem.icon)}
                                {subItem.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              <li>
                <a onClick={openPasswordPopup} style={{ cursor: "pointer" }}>
                  <svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'><path fill='currentColor' d='M7 14q-.825 0-1.412-.587T5 12t.588-1.412T7 10t1.413.588T9 12t-.587 1.413T7 14m0 4q-2.5 0-4.25-1.75T1 12t1.75-4.25T7 6q1.675 0 3.038.825T12.2 9h8.375q.2 0 .388.075t.337.225l2 2q.15.15.212.325t.063.375t-.063.375t-.212.325l-3.175 3.175q-.125.125-.3.2t-.35.1t-.35-.025t-.325-.175L17.5 15l-1.425 1.075q-.125.1-.275.15t-.3.05t-.313-.05t-.287-.15L13.375 15H12.2q-.8 1.35-2.163 2.175T7 18m0-2q1.4 0 2.463-.85T10.875 13H14l1.45 1.025v.013v-.013L17.5 12.5l1.775 1.375L21.15 12h-.012h.012l-1-1v-.012V11h-9.275q-.35-1.3-1.412-2.15T7 8Q5.35 8 4.175 9.175T3 12t1.175 2.825T7 16' /></svg>
                  Password
                </a>
              </li>
              <li>
                <a onClick={handleLogout} style={{ cursor: "pointer" }}>
                  <svg xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' aria-hidden='true' role='img' className='iconify iconify--hugeicons' width='1em' height='1em' preserveAspectRatio='xMidYMid meet' viewBox='0 0 24 24' data-icon='hugeicons:logout-04'><path fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M7.023 5.5a9 9 0 1 0 9.953 0M12 2v8' color='currentColor'></path></svg>
                  Log Out
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {isPasswordPopupOpen && (
        <PasswordChangePopup
          loginID={checkData?.user?.loginID}
          onClose={closePasswordPopup}
          onSuccess={() => {
            closePasswordPopup();
            toast.success("Password changed successfully!");
          }}
        />
      )}
    </>
  );
}





function PasswordChangePopup({ loginID, onClose, onSuccess }) {
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const handleInput = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const validationRules = {
    oldPassword: {
      required: true,
      requiredMessage: "Please enter old password."
    },
    newPassword: {
      required: true,
      requiredMessage: "Please enter new password."
    },
    confirmPassword: {
      required: true,
      requiredMessage: "Please enter confirm password."
    }
  };
  const handleSubmit = async () => {
    const { oldPassword, newPassword, confirmPassword } = formData;
    const errors = validateFields(formData, validationRules);
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = "New password and confirm password do not match.";
    }
    if (oldPassword && newPassword && oldPassword === newPassword) {
      errors.newPassword = "New password must be different from old password.";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    try {
      const res = await updatePassword({
        loginID,
        oldPassword,
        newPassword,
      }).unwrap();

      if (res.success) {
        onSuccess();
      } else {
        toast.error(res.message || "Password change failed");
      }
    } catch (error) {
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const PasswordToggleButton = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "5px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
          <path fill="#666" d="M10.94 6.08A7 7 0 0 1 12 6c3.18 0 6.17 2.29 7.91 6a15 15 0 0 1-.9 1.64a1 1 0 0 0-.16.55a1 1 0 0 0 1.86.5a16 16 0 0 0 1.21-2.3a1 1 0 0 0 0-.79C19.9 6.91 16.1 4 12 4a8 8 0 0 0-1.4.12a1 1 0 1 0 .34 2ZM3.71 2.29a1 1 0 0 0-1.42 1.42l3.1 3.09a14.6 14.6 0 0 0-3.31 4.8a1 1 0 0 0 0 .8C4.1 17.09 7.9 20 12 20a9.26 9.26 0 0 0 5.05-1.54l3.24 3.25a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42Zm6.36 9.19l2.45 2.45A1.8 1.8 0 0 1 12 14a2 2 0 0 1-2-2a1.8 1.8 0 0 1 .07-.52M12 18c-3.18 0-6.17-2.29-7.9-6a12.1 12.1 0 0 1 2.7-3.79L8.57 10A4 4 0 0 0 14 15.43L15.59 17A7.24 7.24 0 0 1 12 18" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
          <g fill="none" stroke="#666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
            <path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7" />
          </g>
        </svg>
      )}
    </button>
  );

  return (
    <div className="popup-overlay">
      <div className="popup-box" style={{ maxWidth: "500px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
        <button className="close-btn" onClick={onClose} style={{ top: "14px", right: "13px" }}>×</button>
        <h2 style={{ marginBottom: "25px", color: "#333", fontSize: "1.5rem" }}>
          Change Password
        </h2>
        <div style={{ marginBottom: "30px" }} className='form-group'>
          <label style={{
            display: "block",
            marginBottom: "6px",
            color: "#555",
            fontSize: "0.9rem"
          }}>
            Old Password*
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPasswords.old ? "text" : "password"}
              placeholder="Please enter old password"
              value={formData.oldPassword}
              onChange={(e) => {
                handleInput("oldPassword", e.target.value)
                setFormErrors(prev => ({ ...prev, oldPassword: "" }));
              }}
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "0.95rem",
                transition: "border-color 0.3s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#4d3664"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            {formErrors.oldPassword && <p className="error">{formErrors.oldPassword}</p>}
            <PasswordToggleButton
              show={showPasswords.old}
              onClick={() => togglePasswordVisibility("old")}
            />
          </div>
        </div>

        <div style={{ marginBottom: "30px" }} className='form-group'>
          <label style={{
            display: "block",
            marginBottom: "6px",
            color: "#555",
            fontSize: "0.9rem"
          }}>
            New Password*
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPasswords.new ? "text" : "password"}
              placeholder="Please enter new password"
              value={formData.newPassword}
              onChange={(e) => {
                handleInput("newPassword", e.target.value)
                setFormErrors(prev => ({ ...prev, newPassword: "" }));
              }}
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "0.95rem",
                transition: "border-color 0.3s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#1c2f63"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            {formErrors.newPassword && <p className="error">{formErrors.newPassword}</p>}
            <PasswordToggleButton
              show={showPasswords.new}
              onClick={() => togglePasswordVisibility("new")}
            />
          </div>
        </div>

        <div style={{ marginBottom: "30px" }} className='form-group'>
          <label style={{
            display: "block",
            marginBottom: "6px",
            color: "#555",
            fontSize: "0.9rem"
          }}>
            Confirm Password*
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              placeholder="Please enter confirm password"
              value={formData.confirmPassword}
              onChange={(e) => {
                handleInput("confirmPassword", e.target.value)
                setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
              }}
              style={{
                width: "100%",
                padding: "10px 40px 10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "0.95rem",
                transition: "border-color 0.3s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#1c2f63"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
            {formErrors.confirmPassword && <p className="error">{formErrors.confirmPassword}</p>}
            <PasswordToggleButton
              show={showPasswords.confirm}
              onClick={() => togglePasswordVisibility("confirm")}
            />
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              flex: "1 1 200px",
              padding: "12px 20px",
              background: isLoading ? "#065e87" : "#065e87",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              transition: "background 0.3s, transform 0.1s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: "1 1 200px",
              padding: "12px 20px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              transition: "background 0.3s, transform 0.1s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
        </div>
        {isLoading && <Loader />}
      </div>
    </div>
  );
}