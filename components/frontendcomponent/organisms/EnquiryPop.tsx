"use client";
import Link from "next/link";
import Image from "next/image";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import DetailForm from "./DetailForm";

export default function EnquiryPop() {
  const { closeModal } = useModal();
  const { isModal, modalData } = useAppSelector((state) => state.modal);

  const enquiryData = modalData as {
    productName?: string;
    enquiryFor?: string;
    enquiryType?: string;
  } | null;

  const enquiryFor = enquiryData?.productName || enquiryData?.enquiryFor || "";
  const enquiryType = enquiryData?.enquiryType || "Product Enquiry";

  return (
    <div
      className={`model login-pop enquire-pop-up ${isModal === "enquiryPop" ? "is-open" : ""}`}
    >
      <button
        type="button"
        className="close"
        aria-label="Close menu"
        onClick={closeModal}
      >
        <svg
          width={26}
          height={26}
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.5 0.5L25.5 25.5M0.5 25.5L25.5 0.5"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="model-body active" id="enquiryModalBody">
        <div className="title">
          <Link className="icon" href="/">
            <Image
              src="/images/home/discover-elephant.png"
              width={43}
              height={37}
              alt="Legacy of Marwar logo"
            />
          </Link>
          <h4>Make It Yours </h4>
        </div>
        <DetailForm
          isPopup={true}
          enquiryFor={enquiryFor}
          enquiryType={enquiryType}
          onSuccess={closeModal}
        />
      </div>
    </div>
  );
}
