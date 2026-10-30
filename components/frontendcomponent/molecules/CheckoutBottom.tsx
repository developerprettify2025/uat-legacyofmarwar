import Image from "next/image";
import Link from "next/link";

interface BankList {
  imgSrc: string;
}

export default function CheckoutBottom({ data }: { data: BankList[] }) {
  return (
    <div className="bottom-wrapper">
      <ul className="bank-list">
        {data.map((item, index) => (
          <li key={index}>
            <Image
              src={item.imgSrc}
              width={80}
              height={40}
              alt="payment-icon"
            />
          </li>
        ))}
      </ul>
      <Link href="/contact-us" className="need-help">
        Need Help? Contact Us
      </Link>
    </div>
  );
}
