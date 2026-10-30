import { Suspense } from "react";
import "../../../public/admin-assets/styles/style.css";
import MainHeaderFooter from "@/components/backendcomponents/MainHeaderFooter";
import NextTopLoader from "nextjs-toploader";
import "../../../public/admin-assets/fonts/font.css";
import { Toaster } from "react-hot-toast";
import { ReduxProvider } from "../../../store/ReduxProvider";
import Loader from "@/app/loading";
import PageLoader from "./PageLoader";

export const metadata = {
  title: "Legacy Of Marwar Admin Panel",
  description: "Admin Panel for Legacy Of Marwar",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <NextTopLoader color="#243b56" showSpinner={false} />

          <MainHeaderFooter />

          <Suspense fallback={<Loader />}>
            <PageLoader>{children}</PageLoader>
          </Suspense>

          <Toaster
            position="top-center"
            reverseOrder={true}
            toastOptions={{
              duration: 2000,
            }}
          />
        </ReduxProvider>
      </body>
    </html>
  );
}