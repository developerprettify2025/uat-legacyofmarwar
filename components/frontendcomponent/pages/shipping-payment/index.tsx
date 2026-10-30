import CheckoutHeader from "../../organisms/CheckoutHeader";
import PaymentDetails from "./PaymentDetails";
import "@/uploads/sass/checkout/checkout.css";

export default function ShippingPaymentPage() {
  return (
    <main>
      <CheckoutHeader />
      <PaymentDetails />
    </main>
  );
}
