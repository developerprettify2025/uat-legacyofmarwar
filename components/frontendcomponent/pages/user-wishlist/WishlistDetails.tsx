
import ListingCard from "../../molecules/ListingCard";

interface WishlistDetailsProps {
  wishlistdata: any[];
}

export default function WishlistDetails({
  wishlistdata,
}: WishlistDetailsProps) {
  const productItem = (wishlistdata ?? []).map((item: any) => ({
    sno: item.ProductID,
    ProductID: item.ProductID,
    linkHref: `/${item.ProductNameURL}`,

    imgSrc: item.ProductImage
      ? `/OnlineImages/ProductImages/${item.ProductImage}`
      : "/images/other/ring1.png",

    imghoverSrc: item.ProductBannerImage4
      ? `/OnlineImages/ProductImages/${item.ProductBannerImage4}`
      : "/images/other/ring1.png",

    title: item.ProductName,

    sp: `INR ${Number(
      item.ProductSalePrice ?? 0
    ).toLocaleString("en-IN")}`,

    mrp: `INR ${Number(
      item.ProductMRP ?? item.ProductSalePrice ?? 0
    ).toLocaleString("en-IN")}`,

    isWishlisted: Number(item.IsWishlist ?? 0),
    itemID: Number(item.ItemID ?? 0),

    // Extra fields used for filtering and sorting.
    _price: Number(item.ProductSalePrice ?? 0),
    _category: item.CategoryName ?? "",
    _color: String(item.ColorName ?? "")
      .trim()
      .toLowerCase(),
  }));

  return (
    <div className="aside-right">
      <div className="aside-right-wrap wish-grid">
        {productItem.map((item: any) => (
          <ListingCard
            key={item.sno}
            data={item}
          />
        ))}
      </div>
    </div>
  );
}
