import Link from "next/link";
import "@/uploads/sass/privacy/privacy.css";

export default function ReturnExchangePage() {
  return (
    <main>
      <div className="privacy-secA mt-hdr">
        <div className="container">
          <div className="website-content">
            <h1>Return and Exchange Policy</h1>

            <h3>Return Policy</h3>
            <p>
              We at Legacy Of Marwar(By ANAAYAH CREATIVES & DESIGNS) strive to
              provide quality products and the best possible experience while
              you shop with us online. There is no option to return orders as
              the goods are customized according to your specific needs and
              designs, and are non-usable by anyone else.
            </p>
            <p>
              However, if there is a manufacturing defect, complete assistance
              will be provided to you for correcting the same.
            </p>

            <h3>Exchange Policy</h3>
            <p>Exchanges will be processed under the following conditions:</p>
            <ul>
              <li>
                Order confirmation of one size and delivery of another size.
              </li>
              <li>
                Order confirmation of one color and delivery of another color.
              </li>
              <li>Manufacturing defect.</li>
              <li>Exchange must be requested within 15 days of purchase.</li>
              <li>
                The goods must be in their new condition, with original
                packaging, tag, and invoice.
              </li>
            </ul>
            <p>
              Exchanges will not be processed under the following conditions:
            </p>
            <ul>
              <li>Items that have been worn or washed.</li>
              <li>
                Late delivery due to unfortunate events such as natural
                disasters, courier service strikes, or similar circumstances.
              </li>
            </ul>
            <p>
              For any other queries, please drop a call at{" "}
              <Link href="tel:+919811887651">+919811887651</Link> or send an
              email to{" "}
              <Link href="mailto:trishla@legacyofmarwar.com">
                trishla@legacyofmarwar.com
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
