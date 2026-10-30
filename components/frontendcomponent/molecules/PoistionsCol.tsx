import { useModal } from "@/hooks/useModal";

export default function PoistionsCol({ positionName = "", positionLoc = "" }) {
  const { openModal } = useModal();
  return (
    <div className="positons_col" onClick={() => openModal("position")}>
      <p className="pos_name">{positionName}</p>
      <p className="pos_loc">{positionLoc}</p>
      <button type="button" className="check_pos">
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
    </div>
  );
}
