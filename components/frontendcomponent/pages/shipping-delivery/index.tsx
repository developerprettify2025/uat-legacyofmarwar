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
              At Legacy Of Marwar(By ANAAYAH CREATIVES & DESIGNS), we are
              committed to delivering your orders quickly and securely. We
              understand the importance of receiving your uniforms on time, and
              we work diligently to provide a smooth, efficient delivery
              experience for all our customers.
            </p>

            <h3>Order Processing Time</h3>
            <p>
              Once your order is placed, our team will work efficiently to
              process it. Processing time depends on the order quantity and
              customization requirements. If there are any delays, we will
              notify you promptly. During the order processing, you will also
              see your estimated delivery time.
            </p>

            <h3>Shipping Costs</h3>
            <p>
              Shipping charges are based on the weight, dimensions of your
              order, and the delivery location. The exact shipping cost will be
              displayed at checkout before you finalize your order.
              Occasionally, we offer promotions such as free shipping or
              discounted rates—be sure to check our website for current offers.
            </p>

            <h3>Delivery Time</h3>
            <p>
              We make every effort to meet the estimated delivery times.
              However, factors such as weather conditions, carrier delays, or
              unforeseen circumstances may affect delivery. We recommend placing
              your order well in advance to avoid any potential delays,
              especially during peak seasons.
            </p>

            <h3>Our Delivery Partners</h3>
            <p>
              We are proud to work with reputable delivery partners, including
              DTCT, Delhivery, and Safex, to ensure your orders reach you on
              time and with care.
            </p>

            <h3>Address Accuracy</h3>
            <p>
              Please ensure that the delivery address you provide is accurate
              and complete. Legacy Of Marwar(By ANAAYAH CREATIVES & DESIGNS) is
              not responsible for delays or non-delivery due to incorrect or
              incomplete shipping information. If you realize there is an error
              in your address after placing the order, please contact our
              customer support team immediately to update the details.
            </p>

            <h3>Packaging</h3>
            <p>
              All orders are carefully packaged to ensure that your items arrive
              in perfect condition.
            </p>

            <h3>Contact Us</h3>
            <p>
              If you have any questions about shipping, delivery times, or need
              assistance tracking your order, please don’t hesitate to reach out
              to our customer service team at{" "}
              <Link href="tel:+919811887651">9811887651</Link>. We are here to
              help!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
