"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useAppDispatch } from "@/store/hooks";
import { useGoogleAuthMutation } from "@/store/backendSlice/customerAPISlice";
import { login } from "@/store/slice/authSlice";
import { useModal } from "@/hooks/useModal";

export default function GoogleAuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { closeModal } = useModal();
  const [googleAuth] = useGoogleAuthMutation();
  const isSyncing = useRef(false);

  useEffect(() => {
    const idToken = session?.user?.idToken;
    if (status !== "authenticated" || !idToken || isSyncing.current) {
      return;
    }

    isSyncing.current = true;

    const syncGoogleAccount = async () => {
      try {
        const result = await googleAuth({ idToken }).unwrap();
        if (!result.success || !result.data) {
          throw new Error(result.message || "Google authentication failed.");
        }

        dispatch(
          login({
            user: result.data,
            accounts: [result.data],
            loginMethod: "google",
          }),
        );
        closeModal();
        toast.success(
          result.message ||
            (result.isNewUser
              ? "Account registered successfully!"
              : "Login successful!"),
        );
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "data" in error &&
          typeof error.data === "object" &&
          error.data !== null &&
          "message" in error.data &&
          typeof error.data.message === "string"
            ? error.data.message
            : error instanceof Error
              ? error.message
              : "Google login failed.";
        console.error("Google authentication sync failed:", error);
        toast.error(message);
      } finally {
        try {
          await signOut({ redirect: false });
        } catch (error) {
          console.error("Could not clear the Google sign-in session:", error);
        }
      }
    };

    void syncGoogleAccount();
  }, [closeModal, dispatch, googleAuth, session, status]);

  return null;
}
