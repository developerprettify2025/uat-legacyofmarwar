import type { ReactNode } from "react";
import Footer from "../organisms/Footer";
import Header from "../organisms/Header";

interface MainTemplateProps {
  children: ReactNode;
}

export default function MainTemplate({ children }: MainTemplateProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}