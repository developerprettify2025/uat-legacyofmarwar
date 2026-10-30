"use client";
import MoreProducts from "./MoreProducts";
import ProductInfo from "./ProductInfo";
import "@/uploads/sass/product/product.css";
import ListingCard from "../../molecules/ListingCard";
import { useGetProductDetailsQuery } from "@/store/frontendSlice/homePageAPISlice";
import { useSelector } from "react-redux";
interface ProductDetailsPageProps {
  meta: any;
  slug: string;
}
export default function ProductDetailsPage({ meta, slug }: ProductDetailsPageProps) {
  const ProductID = meta.StaticID
  const { user, isLoggedIn = false, accounts = [], } = useSelector((state: any) => state.auth ?? {});
  const CustomerID = Number(user?.CustomerID ?? user?.customerID ?? user?.CustomerId ?? accounts?.[0]?.CustomerID ?? accounts?.[0]?.customerID ?? accounts?.[0]?.CustomerId ?? 0);
  const { data, isLoading, isError } = useGetProductDetailsQuery({ ProductID, CustomerID }, { skip: !ProductID, refetchOnMountOrArgChange: true });
  const productInfo = data ?? {};
  const relatedProducts = data?.relatedProducts ?? [];
  if (isLoading) return null; // or your loader
  if (isError || !data?.product) return <p>Product not found.</p>;
  return (
    <main>
      <ProductInfo productInfo={productInfo} id={CustomerID} />
      <MoreProducts relatedProducts={relatedProducts} />
    </main>
  );
}
