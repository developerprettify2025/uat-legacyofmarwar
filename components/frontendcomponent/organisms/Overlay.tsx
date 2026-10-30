"use client";

import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";

export default function Overlay() {
  const { closeModal } = useModal();
  const { isModal } = useAppSelector((state) => state.modal);

  return (
    <div
      className={`overlay ${isModal !== null ? "is-open" : ""}`}
      onClick={closeModal}
    ></div>
  );
}
