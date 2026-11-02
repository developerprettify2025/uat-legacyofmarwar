import Link from "next/link";
import "@/uploads/sass/privacy/privacy.css";

export default function PrivacyPolicyPage() {
  return (
    <main>
      <section>
        <div className="privacy-secA mt-hdrfix sec-pad-all">
          <div className="container">
            <div className="website-content">
              <h1>Privacy Policy</h1>
              <p>Effective date: 20th Oct 2026</p>
              <h3>Introduction</h3>
              <p>
                At Legacy of Marwar (by Anaayah Creatives & Designs), we value
                your trust and are committed to protecting your privacy. This
                policy explains what information we collect, how we use it and
                how we keep it safe when you visit our website or shop with us.
              </p>
              <h3>Information We Collect</h3>
              <p>
                When you interact with us, we may collect the following personal
                information:
              </p>
              <ul>
                <li>
                  <b>Contact Information:</b> Name, email address, phone number,
                  and billing and shipping address.
                </li>
                <li>
                  <b>Order Information:</b> Details of the pieces you purchase,
                  order history and preferences.
                </li>
                <li>
                  <b>Communication Information:</b> Messages, feedback and
                  enquiries you send us, including via WhatsApp, email or
                  Instagram.
                </li>
              </ul>
              <h3>Payment Information</h3>
              <p>
                Payments are processed securely through trusted third-party
                payment gateways. We do not store your card, UPI or bank details
                on our systems.
              </p>
              <h4>Non-Personal Information</h4>
              <p>
                We also collect non-personal information that does not directly
                identify you, such as:
              </p>
              <ul>
                <li>
                  <b>Usage Data:</b> How you use our website, including pages
                  visited and time spent on them.
                </li>
                <li>
                  <b>Device Information:</b> IP address, browser type and
                  operating system.
                </li>
              </ul>
              <h3>Cookies</h3>
              <p>
                Our website uses cookies to improve your browsing experience,
                remember your preferences and understand how our website is
                used. You can choose to disable cookies in your browser
                settings, though some features of the website may not work as
                intended.
              </p>
              <h3>How We Use Your Information</h3>
              <p>
                Legacy of Marwar (by Anaayah Creatives & Designs) uses the
                information collected to:
              </p>
              <ul>
                <li>Process, ship and deliver your orders.</li>
                <li>
                  Communicate with you about your orders, enquiries and
                  appointments.
                </li>
                <li>
                  Send you updates about new collections and offers, only if you
                  have chosen to receive them.
                </li>
                <li>Improve our website, products and customer experience.</li>
                <li>
                  Comply with legal obligations and enforce our terms and
                  policies.
                </li>
              </ul>
              <h3>Sharing Your Information</h3>
              <p>
                We do not sell or rent your personal information. We may share
                it only in the following situations:
              </p>
              <ul>
                <li>
                  <b>With Service Providers:</b> Trusted partners who help us
                  run our business, such as payment gateways, shipping and
                  courier partners, and website and email service providers,
                  only to the extent needed to serve you.
                </li>
                <li>
                  <b>For Legal Reasons:</b> If required by law or in response to
                  valid requests by public authorities.
                </li>
                <li>
                  <b>With Your Consent:</b> With other parties, only when you
                  have given us explicit permission.
                </li>
              </ul>
              <h3>Security of Your Information</h3>
              <p>
                We take reasonable measures to protect your information from
                unauthorised access, use or disclosure. However, no method of
                transmission over the internet or electronic storage is 100%
                secure, and we cannot guarantee absolute security.
              </p>
              <h3>Your Privacy Rights</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access, correct or update your personal information.</li>
                <li>
                  Request deletion of your personal information, subject to
                  legal requirements.
                </li>
                <li>
                  Withdraw your consent at any time, including unsubscribing
                  from marketing messages.
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us using the
                details below.
              </p>
              <h3>Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices or for legal or regulatory reasons. Any
                changes will be posted on this page with an updated effective
                date.
              </p>
              <h3>Contact Us</h3>
              <p>
                For any questions or concerns about your privacy, please
                contact: <Link href="tel:+919811887651">+919811887651</Link> or
                email{" "}
                <Link href="mailto:trishla@legacyofmarwar.com">
                  trishla@legacyofmarwar.com
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
