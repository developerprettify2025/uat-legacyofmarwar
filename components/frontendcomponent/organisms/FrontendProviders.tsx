"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import GoogleAuthSync from "./GoogleAuthSync";

export default function FrontendProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <GoogleAuthSync />
      {children}
    </SessionProvider>
  );
}
