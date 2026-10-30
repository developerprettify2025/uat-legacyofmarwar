export interface ProductItem {
  sno: string;
  linkHref: string;
  imgSrc: string;
  imghoverSrc?: string;
  title: string;
  desc?: string;
  sp: string;
  mrp?: string;
  isWishlisted?: string;
  itemID?: string;
}

export interface Category {
  label: string;
  productItem: ProductItem[];
}
