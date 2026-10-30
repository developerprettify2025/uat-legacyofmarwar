import Link from "next/link";
import "@/uploads/sass/privacy/privacy.css";

export default function TermsConditionsPage() {
  return (
    <main>
      <div className="privacy-secA mt-hdr">
        <div className="container">
          <div className="website-content">
            <h1>Terms and Conditions</h1>
            <h3>Introduction</h3>
            <p>
              Welcome to Legacy Of Marwar(By ANAAYAH CREATIVES & DESIGNS). By
              accessing or using our website, or by placing an order with us,
              you agree to be bound by these Terms and Conditions. If you do not
              agree with any part of these terms, please do not use our website.
            </p>

            <h3>Use of Our Website</h3>
            <p>When using our website, you agree that you will:</p>
            <ul>
              <li>
                Be at least 18 years old, or use the website under the
                supervision of a parent or guardian.
              </li>
              <li>
                Provide accurate, current, and complete information when
                creating an account or placing an order.
              </li>
              <li>
                Keep your account login details confidential and be responsible
                for all activity under your account.
              </li>
              <li>
                Not use the website for any unlawful, fraudulent, or harmful
                purpose.
              </li>
            </ul>

            <h3>Products and Pricing</h3>
            <h4>Product Information</h4>
            <p>
              We make every effort to display our jewellery, including colours,
              finish, and dimensions, as accurately as possible. However, slight
              variations may occur due to the handcrafted nature of our
              products, photography, and your screen settings.
            </p>
            <h4>Pricing</h4>
            <ul>
              <li>
                <b>Currency:</b> All prices are listed in Indian Rupees (INR)
                and include applicable taxes unless stated otherwise.
              </li>
              <li>
                <b>Price Changes:</b> Prices and product availability may change
                without prior notice.
              </li>
              <li>
                <b>Errors:</b> If a product is listed at an incorrect price, we
                reserve the right to cancel the order and refund any amount
                paid.
              </li>
            </ul>

            <h3>Orders and Payments</h3>
            <ul>
              <li>
                <b>Order Acceptance:</b> Placing an order is an offer to buy. An
                order is accepted only when we confirm it by email or message.
              </li>
              <li>
                <b>Payment:</b> Payments are processed through secure
                third-party payment gateways. We do not store your card or
                banking details.
              </li>
              <li>
                <b>Order Cancellation:</b> We may cancel or refuse an order due
                to stock unavailability, payment failure, suspected fraud, or
                incorrect information.
              </li>
            </ul>

            <h3>Shipping and Delivery</h3>
            <p>
              We aim to dispatch and deliver your order within the timelines
              shown at checkout. Delivery times are estimates and may be
              affected by courier delays, weather, or other circumstances beyond
              our control. For full details, please see our Shipping &amp;
              Delivery policy.
            </p>

            <h3>Returns, Exchanges and Refunds</h3>
            <p>
              Returns, exchanges, and refunds are governed by our Returns &amp;
              Exchanges policy. Items must be unused, in their original
              condition, and returned with their original packaging and invoice
              within the period stated in that policy. Customised or
              personalised items may not be eligible for return.
            </p>

            <h3>Intellectual Property</h3>
            <p>
              All content on this website, including logos, designs, images,
              text, graphics, and videos, is the property of Legacy Of Marwar(By
              ANAAYAH CREATIVES & DESIGNS) and is protected by applicable
              intellectual property laws. You may not copy, reproduce,
              distribute, or use any content without our prior written
              permission.
            </p>

            <h3>Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, Legacy Of Marwar(By
              ANAAYAH CREATIVES & DESIGNS) shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of the
              website or products. Our total liability for any claim shall not
              exceed the amount you paid for the product concerned.
            </p>

            <h3>Third-Party Links</h3>
            <p>
              Our website may contain links to third-party websites. We do not
              control and are not responsible for the content, policies, or
              practices of those websites.
            </p>

            <h3>Governing Law</h3>
            <p>
              These Terms and Conditions are governed by the laws of India. Any
              disputes arising from them shall be subject to the exclusive
              jurisdiction of the courts at Gurugram, Haryana.
            </p>

            <h3>Changes to These Terms</h3>
            <p>
              We may update these Terms and Conditions from time to time. Any
              changes will be posted on this page with an updated effective
              date. Your continued use of the website after changes are posted
              means you accept the revised terms.
            </p>

            <h3>Contact Us</h3>
            <p>If you have any questions about these Terms and Conditions, please contact us at <Link href="mailto:trishla@legacyofmarwar.com">trishla@legacyofmarwar.com</Link> or <Link href="tel:+919811887651">+919811887651</Link>.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
