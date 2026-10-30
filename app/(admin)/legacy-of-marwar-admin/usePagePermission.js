const BYPASS_PERMISSION = true;
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import AdminStaticData from "../../../components/backendcomponents/AdminStaticData.json";

export function usePagePermission(checkData) {
    const pathname = usePathname();
    const pagePermission = useMemo(() => {
        if (BYPASS_PERMISSION) {
            return { PageID: 0, CanRead: 1, CanWrite: 1, CanDelete: 1, CanAdd: 1 };
        }
        const defaultPermission = {
            PageID: 0,
            CanRead: 0,
            CanWrite: 0,
            CanDelete: 0,
            CanAdd: 0,
        };
        if (!checkData || !checkData.loggedIn) {
            return defaultPermission;
        }
        const { user, permissions } = checkData;
        const Menu = AdminStaticData.Menu.items;
        const slug = pathname.split("/").pop();
        const findPage = (items) => {
            for (const item of items) {
                if (
                    item.url?.endsWith(slug) ||
                    item.addurl?.endsWith(slug)
                ) {
                    return item;
                }
                if (item.MoreItem) {
                    const subPage = findPage(item.MoreItem);
                    if (subPage) return subPage;
                }
            }
            return null;
        };

        const currentPage = findPage(Menu);
        if (!currentPage) {
            return defaultPermission;
        }
        if (user?.Role === "Super Admin") {
            return {
                PageID: currentPage.PageID,
                CanRead: 1,
                CanWrite: 1,
                CanDelete: 1,
                CanAdd: 1,
            };
        }
        const perm = permissions?.find((p) => p.PageID === currentPage.PageID);
        if (perm) {
            return {
                PageID: currentPage.PageID,
                CanRead: perm.CanRead || 0,
                CanWrite: perm.CanWrite || 0,
                CanDelete: perm.CanDelete || 0,
                CanAdd: perm.CanAdd || 0,
            };
        }
        return {
            PageID: currentPage.PageID,
            CanRead: 0,
            CanWrite: 0,
            CanDelete: 0,
            CanAdd: 0,
        };
    }, [pathname, checkData]);

    return pagePermission;
}