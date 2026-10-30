"use client";

import Image from "next/image";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import "@/uploads/sass/component/component.css";

interface TeamMemberData {
  imgSrc: string;
  name: string;
  designation: string;
  bio: string;
}

export default function TeamPop() {
  const { closeModal } = useModal();
  const { isModal, modalData } = useAppSelector((state) => state.modal);
  const member = modalData as TeamMemberData | null;

  return (
    <div className={`model team-pop ${isModal === "team" ? "is-open" : ""}`}>
      <button className="close" onClick={closeModal}>
        Close
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.75 0.75L23.25 23.25M0.75 23.25L23.25 0.75"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {member && (
        <div className="model-body">
          <div className="team_wrapper">
            <figure>
              <Image
                src={member.imgSrc}
                width={342}
                height={342}
                alt={member.name}
              />
            </figure>
            <figcaption>
              <div className="heading">
                <h6>{member.name}</h6>
                <p>{member.designation}</p>
              </div>
              <div
                className="team_details"
                dangerouslySetInnerHTML={{ __html: member.bio }}
              ></div>
            </figcaption>
          </div>
        </div>
      )}
    </div>
  );
}
