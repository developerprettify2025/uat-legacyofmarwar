import CheckoutHeader from "../../organisms/CheckoutHeader";
import CartDetails from "./CartDetails";
import "@/uploads/sass/checkout/checkout.css";

export default function ShoppingCartPage() {
  return (
    <main>
      <CheckoutHeader />
      <CartDetails />
    </main>
  );
}
