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
              We at Legacy of Marwar (by Anaayah Creatives & Designs) strive to
              provide exceptional quality and the best possible experience while
              you shop with us. As each piece is handcrafted and one of a kind,
              we do not accept returns.
            </p>
            <p>
              However, if you receive a piece with a manufacturing defect, or if
              it arrives damaged, we will provide complete assistance to resolve
              it.
            </p>

            <h3>Exchange Policy</h3>
            <p>Exchanges will be processed under the following conditions:</p>
            <ul>
              <li>You receive a different piece from the one you ordered.</li>
              <li>The piece has a manufacturing defect.</li>
              <li>The piece arrives damaged in transit.</li>
              <li>
                The issue must be reported within 24 Hrs of delivery, along with
                an unboxing video and photos of the product and packaging.
              </li>
              <li>
                The piece must be unused and in its original condition, with its
                original packaging, tags and invoice.
              </li>
            </ul>
            <p>
              As every piece is one of a kind, an identical replacement may not
              always be possible. In such cases, you may choose another piece of
              equal value, a store credit valid for 6 months, or a full refund
              to your original payment method.
            </p>
            <p>
              Exchanges will not be processed under the following conditions:
            </p>
            <ul>
              <li>
                Pieces that have been worn, altered, resized or damaged after
                delivery.
              </li>
              <li>
                Natural tarnishing of silver, or minor variations in finish,
                stones or colour, which are characteristic of handcrafted
                jewellery.
              </li>
              <li>Change of mind after purchase.</li>
              <li>
                Delays in delivery due to unforeseen events such as natural
                disasters, courier strikes or similar circumstances.
              </li>
            </ul>
            <p>
              For any other queries, please call us at{" "}
              <Link href="tel:+919811887651">+919811887651</Link> or email{" "}
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
