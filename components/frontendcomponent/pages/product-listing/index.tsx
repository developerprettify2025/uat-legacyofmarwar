import HeroBanner from "../../organisms/HeroBanner";
import ListingWrapper from "./ListingWrapper";
import "@/uploads/sass/product/product.css";
interface ProductListingPageProps {
  id: any;
  heading: string;
  tagLine: string;
  image: string;
  url: string;
}
export default function ProductListingPage({ id, heading, tagLine, image, url, }: ProductListingPageProps) {
  return (
    <main>
      <HeroBanner classname="product-listing-banner" heading={heading} desc={tagLine} mediaSrc={image}/>
      <ListingWrapper categoryName={id == "0" ? "":heading} />
    </main>
  );
}
