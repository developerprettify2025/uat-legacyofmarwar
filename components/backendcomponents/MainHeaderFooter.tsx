'use client';
import Header from "./Header";
import SideNav from "./SideNav";
import { usePathname } from 'next/navigation';

export default function MainHeaderFooter() {
  const pathname = usePathname();
  const hideLayout = ['/legacy-of-marwar-admin/login'];
  const shouldHideLayout = hideLayout.some(path => pathname.startsWith(path));

  return (
    <>
      {!shouldHideLayout && (
        <>
          <Header />
          <SideNav />
        </>
      )}
    </>
  );
}

