import { useDispatch } from "react-redux";
import { setIsModal, setModalData } from "@/store/slice/modalSlice";

export const useModal = () => {
  const dispatch = useDispatch();

  const openModal = <T = unknown,>(type: string, data: T | null = null) => {
    dispatch(setIsModal(type));
    dispatch(setModalData(data));
    document.body.classList.add("overflow-hidden");
  };

  const closeModal = () => {
    dispatch(setIsModal(null));
    dispatch(setModalData(null));
    document.body.classList.remove("overflow-hidden");
  };

  return { openModal, closeModal };
};
