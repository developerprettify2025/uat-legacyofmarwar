import Link from "next/link";
import "@/uploads/sass/privacy/privacy.css";

export default function ShippingDeliveryPage() {
  return (
    <main>
      <div className="privacy-secA mt-hdr">
        <div className="container">
          <div className="website-content">
            <h1>Delivery & Shipping Information</h1>

            <p>
              At Legacy of Marwar (by Anaayah Creatives & Designs), we are
              committed to delivering your orders safely and securely. We
              understand how special it is to receive a handcrafted piece of
              jewellery, and we work diligently to provide a smooth and seamless
              delivery experience for all our customers.
            </p>

            <h3>Order Processing Time</h3>
            <p>
              Once your order is placed, our team carefully inspects, polishes
              and packs your piece before dispatch. Orders are usually processed
              within 2-3 business days. If there are any delays, we will notify
              you promptly.
            </p>

            <h3>Shipping Costs</h3>
            <p>
              We offer free shipping on all orders across India. There are no
              additional delivery charges at checkout.
            </p>

            <h3>Delivery Time</h3>
            <p>
              Once dispatched, orders are usually delivered within 5-7 business
              days, depending on your location. Tracking details will be shared
              with you so you can follow your order’s journey. We make every
              effort to meet estimated delivery times; however, factors such as
              weather conditions, courier delays or unforeseen circumstances may
              affect delivery. We recommend placing your order in advance,
              especially during festive and peak seasons.
            </p>

            <h3>Our Delivery Partners</h3>
            <p>
              We work with trusted and reputed courier partners to ensure your
              jewellery reaches you safely, securely and with care.
            </p>

            <h3>Address Accuracy</h3>
            <p>
              Please ensure that the delivery address and contact number you
              provide are accurate and complete. Legacy of Marwar (by Anaayah
              Creatives & Designs) is not responsible for delays or non-delivery
              due to incorrect or incomplete shipping information. If you
              realise there is an error in your address after placing the order,
              please contact us immediately so we can update the details before
              dispatch.
            </p>

            <h3>Packaging</h3>
            <p>
              Every piece is carefully packed in our signature Legacy of Marwar
              packaging, so it arrives in perfect condition, ready to be
              treasured or gifted. Please check that your package is sealed and
              intact on delivery. If it appears tampered with or damaged, kindly
              do not accept it and contact us right away.
            </p>

            <h3>Contact Us</h3>
            <p>
              If you have any questions about shipping, delivery times or
              tracking your order, please don’t hesitate to reach out to us at
              <Link href="tel:+919811887651">9811887651</Link>. We are here to
              help!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
