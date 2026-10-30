"use client"
import { useEffect, useState } from "react"
import { useCheckLoginQuery } from "../../store/backendSlice/authAPISlice";

export default function Header() {
    const [userName, setUserName] = useState("Navayu Admin");
    const [userRole, setUserRole] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const { data: checkData} = useCheckLoginQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    useEffect(() => {
        const user = checkData?.user;
        if (user) {
            setUserName(user.FullName || user.UserName || "Navayu Admin");
            setUserRole(user.Role || "");
            setProfileImage(user.ProfileImage || "");
        }
    }, [checkData]);
    const getInitials = (name: any) => {
        if (!name) return "U";
        const words = name.trim().split(" ");
        if (words.length === 1) return words[0][0].toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };
  
    return (
        <>
            <header>
                <div className="header-wrapper">
                    <div className="colA">
                        <a href="/legacy-of-marwar-admin/dashboard" className="logo">
                            <img src="/admin-assets/img/logo.svg" alt="" style={{ maxWidth: "58%" }} />
                        </a>
                    </div>
                    <div className="colB">
                        <ul>
                            <li>
                                <div className="dropdown-wrap inline-flex align-center" style={{ marginRight: "22px" }}>
                                    <div className="user-ico">
                                        {profileImage ? (
                                            <img src={`/OnlineImages/AuthImages/${profileImage}`  || ""} alt={userName || "User"} className="user-image" />
                                        ) : (
                                            <div className="user-ico"><span>{getInitials(userName) || ''}</span></div>
                                        )}
                                    </div>
                                    <div data-dropdown className="admin_de">
                                        <span className="title" style={{ color: "#1c2f63", fontWeight: "600" }}>{userName || "Guest"}</span>
                                        <span className="design-ekgrgb" style={{ color: "#1c2f63" }}>{userRole || "Role"}</span>
                                    </div>
                                </div>
                            </li>

                        </ul>
                    </div>
                </div>
            </header>
        </>
    )
}