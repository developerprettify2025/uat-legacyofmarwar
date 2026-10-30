"use client";
import Image from "next/image";
import { useModal } from "@/hooks/useModal";
import "@/uploads/sass/component/component.css";

interface TeamColProps {
  imgSrc: string;
  name: string;
  designation: string;
  bio: string;
}

interface TeamColItem {
  data: TeamColProps;
}

export default function TeamCol({ data }: TeamColItem) {
  const { openModal } = useModal();
  const { imgSrc = "", name = "", designation = "", bio = "" } = data;
  return (
    <div className={`team_col`} onClick={() => openModal("team", data)}>
      <figure>
        <Image src={imgSrc} width={320} height={360} alt="Team Image" />
      </figure>
      <figcaption>
        <div className="mem_details">
          <h6 className="name">{name}</h6>
          <p className="desg">{designation}</p>
        </div>
        {bio && bio.trim() !== "" && (
          <button type="button" className="moreBtn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18px"
              height="18px"
              viewBox="0 0 1024 1024"
            >
              <path
                fill="currentColor"
                d="M768 256H353.6a32 32 0 1 1 0-64H800a32 32 0 0 1 32 32v448a32 32 0 0 1-64 0z"
              ></path>
              <path
                fill="currentColor"
                d="M777.344 201.344a32 32 0 0 1 45.312 45.312l-544 544a32 32 0 0 1-45.312-45.312z"
              ></path>
            </svg>
          </button>
        )}
      </figcaption>
    </div>
  );
}
