import React from "react";

const ServiceSkeleton = () => {
    const skeletonStyle = {
        backgroundColor: "#e2e2e2",
        borderRadius: "4px",
        animation: "pulse 1.5s infinite",
    };
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            width: "80vw",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #ddd",
            minHeight: "70px"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <div style={{
                    ...skeletonStyle,
                    height: "50px",
                    width: "50px",
                    borderRadius: "8px"
                }} />
                <div style={{ flex: 1 }}>
                    <div style={{ ...skeletonStyle, height: "16px", width: "150px", marginBottom: "10px" }} />
                    <div style={{ ...skeletonStyle, height: "16px", width: "120px" }} />
                </div>
            </div>
            <div style={{ ...skeletonStyle, height: "36px", width: "60px", borderRadius: "6px", marginRight: "20px" }} /> {/* Display order */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ ...skeletonStyle, height: "20px", width: "60px" }} /> {/* Status */}
                <div style={{ ...skeletonStyle, height: "24px", width: "24px", borderRadius: "4px" }} /> {/* Edit */}
                <div style={{ ...skeletonStyle, height: "24px", width: "24px", borderRadius: "4px" }} /> {/* Delete */}
            </div>
            <style>
                {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
            </style>
        </div>
    );
};

export default ServiceSkeleton;
