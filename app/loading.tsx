"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const Loading = () => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        height: "100vh",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Image src="/images/logo.svg" width={150} height={40} alt="Mohit Minerals" />
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{fontSize: "0.75rem", color: "#1a3a6b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "5px", }}>
          Please wait...
        </motion.p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                scale: [1, 1.2, 1],
                backgroundColor: ["#1a3a6b", "#c8a84b", "#1a3a6b"],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
              style={{
                height: "0.5rem",
                width: "0.5rem",
                borderRadius: "9999px",
                backgroundColor: "#1a3a6b",
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          left: 0,
          height: "4px",
          background: "linear-gradient(to right, #1a3a6b, #c8a84b, #1a3a6b)",
          opacity: 0.6,
        }}
      />
    </div>
  );
};

export default Loading;
