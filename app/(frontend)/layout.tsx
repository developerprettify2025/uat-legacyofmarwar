import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import MainTemplate from "@/components/frontendcomponent/templates/MainTemplate";
import { ReduxProvider } from "@/store/ReduxProvider";
import PageLoader from "@/components/frontendcomponent/organisms/PageLoader";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";

const antiga = localFont({
  src: "../../public/font/Antiga-Regular.woff",
  weight: "400",
  style: "normal",
  variable: "--antiga",
});

const louizeTrial = localFont({
  src: "../../public/font/Louizetrial.woff",
  weight: "400",
  style: "normal",
  variable: "--louize",
});
const sweetSans = localFont({
  src: [
    {
      path: "../../public/font/SweetSansPro-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/SweetSansPro-Medium.woff",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--sweetsans",
  display: "swap",
});

const euclidflex = localFont({
  src: [
    {
      path: "../../public/font/EuclidFlex-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/EuclidFlex-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/font/EuclidFlex-SemiBold.woff",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--euclidflex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Legacy of Marwar",
  description: "Legacy of Marwar website",

  // Global SEO settings
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${louizeTrial.variable} ${sweetSans.variable} ${antiga.variable} ${euclidflex.variable}`}
        suppressHydrationWarning
      >
        <ReduxProvider>
          <Toaster
            position="top-center"
            reverseOrder={true}
            toastOptions={{
              duration: 2000,
              style: {
                background: "rgba(0,0,0,0.85)",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                backdropFilter: "blur(6px)",
              },
              success: {
                style: {
                  background: "rgba(34, 197, 94, 0.9)",
                  borderRadius: "4px",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#15803d",
                },
              },
              error: {
                style: {
                  background: "rgba(239, 68, 68, 0.9)",
                  borderRadius: "4px",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#b91c1c",
                },
              },
            }}
          />
          <CartProvider>
            <MainTemplate>
              <PageLoader>{children}</PageLoader>
            </MainTemplate>
          </CartProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
