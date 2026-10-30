"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent, } from "react";
import type { SyntheticEvent, SubmitEvent } from "react";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import { useModal } from "@/hooks/useModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCheckUserLoginMutation, useSignupCustomerMutation, useLoginByOtpMutation, useCheckUserValidMutation, } from "@/store/backendSlice/customerAPISlice";
import { login } from "@/store/slice/authSlice";
import toast from "react-hot-toast";
interface userData {
  user: string;
}

interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
}

export default function LoginPop({ length = 4, onComplete }: OtpInputProps) {

  const nameRegex = /^[A-Za-z\s]{2,}$/;
  const looksLikeEmail = (value : any) => /[a-zA-Z@]/.test(value);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dispatch = useAppDispatch();
  const [checkUserLogin, { isLoading: isCheckingLogin }] = useCheckUserLoginMutation();
  const [signupCustomer, { isLoading: isSigningUp }] = useSignupCustomerMutation();
  const [loginByOtp, { isLoading: isLoggingIn }] = useLoginByOtpMutation();
  const [checkUserValid, { isLoading: isCheckingValid }] = useCheckUserValidMutation();
  const [customerName, setCustomerName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [identifier, setIdentifier] = useState({
    CustomerPhoneNo: "",
    CustomerEmailID: "",
  });
  const isLoading = isCheckingLogin || isSigningUp || isLoggingIn || isCheckingValid;
  
  const { closeModal } = useModal();
  const { isModal } = useAppSelector((state) => state.modal);
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loginActive, setLoginActive] = useState<boolean>(true);
  const [formData, setFormData] = useState<userData>({
    user: "",
  });
  const [mobileNo, setMobileNo] = useState("");
  const handleChange = (
    e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const updateOtp = (newOtp: string[]) => {
    setOtp(newOtp);
    if (newOtp.every((digit) => digit !== "")) {
      onComplete?.(newOtp.join(""));
    }
  };
  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, ""); // digits only

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // keep only the last typed digit
    updateOtp(newOtp);

    // move to the next input after typing a digit
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        // current box has a digit: clear it
        newOtp[index] = "";
        updateOtp(newOtp);
      } else if (index > 0) {
        // current box is empty: clear the previous one and move back
        newOtp[index - 1] = "";
        updateOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1)
      inputRefs.current[index + 1]?.focus();
  };
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });
    updateOtp(newOtp);

    // focus the box after the last pasted digit
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };
  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);
  };

  const USER_EXISTS_CODE = 2; // rename to match your API's meaning
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MOBILE_REGEX = /^[6-9]\d{9}$/;

  const normalizeMobile = (input: string) => {
    let digits = input.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return digits;
  };

  const getErrorMessage = (error: unknown): string => {
    const e = error as { data?: { message?: string }; message?: string };
    return e?.data?.message ?? e?.message ?? "Please try again.";
  };
  const OTP_LENGTH = 4;
  const MOCK_OTP = "1234"; // TODO: remove, verify on the server

  const parseIdentifier = (rawInput: any) => {
    const value = rawInput.trim();
    const rawValue = value.replace(/^\+91\s?/, "");
    if (looksLikeEmail(rawValue)) {
      const email = rawValue.toLowerCase().slice(0, 100);
      if (!emailRegex.test(email)) {
        return {
          type: "email",
          value: email,
          error: "Please enter a valid email address.",
        };
      }
      return { type: "email", value: email, error: null };
    }
    const digits = rawValue.replace(/\D/g, "").slice(0, 10);
    if (digits.length !== 10 || !/^[6-9]\d{9}$/.test(digits)) {
      return {
        type: "phone",
        value: digits,
        error: "Please enter a valid 10-digit mobile number.",
      };
    }
    return { type: "phone", value: `+91 ${digits}`, error: null };
  };

  const handleMobileChange = (e: any) => {
    const { value, error } = parseIdentifier(e.target.value);
    setMobileNo(value);
  };

  const handleContinue = async () => {
    const value = mobileNo;
    if (!value) {
      toast.error("Enter mobile number or email.");
      return;
    }

    const isEmail = value.includes("@");
    const email = value.toLowerCase();
    const mobile = normalizeMobile(value);

    if (isEmail && !EMAIL_REGEX.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (!isEmail && !MOBILE_REGEX.test(mobile)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    const payload = {CustomerPhoneNo: isEmail ? "" : mobile, CustomerEmailID: isEmail ? email : "",};

    try {
      setIdentifier(payload);
      const result = await checkUserLogin(payload).unwrap();
      console.log("result", result)
      if (result.code === USER_EXISTS_CODE) {
        setLoginActive(true);
        setIsNewUser(true); // see note below
      } else {
        setIsNewUser(false); // see note below
      }
      setLoginActive(false);
    } catch (error) {
      toast.error(`Login failed. ${getErrorMessage(error)}`);
    }
  };
  const handleVerifyOtp = async () => {
    const finalOtp = otp.join("").trim();
    setOtpError(false);
    if (!/^\d{4}$/.test(finalOtp)) {
      setOtpError(true);
      toast.error("Please enter the complete 4-digit OTP.");
      return;
    }
    if (finalOtp !== MOCK_OTP) {
      setOtpError(true);
      toast.error("Please enter valid OTP.");
      return;
    }
    try {

      if (isNewUser === true) {
        const name = customerName.trim();
        if (!name) {
          toast.error("Please enter your name.");
          return;
        }
        const result = await signupCustomer({
          CustomerName: name,
          CustomerPhoneNo: identifier.CustomerPhoneNo,
          CustomerEmailID: identifier.CustomerEmailID,
        }).unwrap();
        if (!result.success) {
          toast.error(result.message || "Signup failed.");
          return;
        }

        if (!result.alreadyExists) {
          toast.success("Welcome to the Legacy Of Marwar family! You have signed up successfully.");
        }
      }
      await loginAndDispatch(finalOtp);
      toast.success("OTP verified.");
      closeModal();
      return;
      // close the popup / router.push("/dashboard")
    } catch (error) {
      setOtpError(true);
      toast.error(`Verification failed. ${getErrorMessage(error)}`);
    }
  };

  const loginAndDispatch = async (finalOtp: string) => {
    const loginMethod = identifier.CustomerEmailID ? "email" : "phone";
    const res = await loginByOtp({ ...identifier, Otp: finalOtp }).unwrap();
    if (!res?.success || !res?.data) {
      throw new Error(res?.message || "Login failed. Please try again.");
    }
    const account = res.data;
    if (account.ActiveStatus !== 1) {
      throw new Error("Your account is inactive. Please contact support.");
    }
    // Try to fetch the full profile; fall back to the login data if it fails
    let fullUser = account;
    try {
      const profileRes = await checkUserValid(account.CustomerID).unwrap();
      if (profileRes?.success && profileRes?.data) {
        fullUser = profileRes.data;
      }
    } catch {
      // Non-fatal: continue with the login data
    }
    dispatch(
      login({
        user: fullUser,
        accounts: [account], // use `account` if your slice expects an object
        loginMethod,
      }),
    );
    return fullUser;
  };

  const displayIdentifier = identifier.CustomerEmailID ? identifier.CustomerEmailID : `+91 ${identifier.CustomerPhoneNo}`;

  return (
    <div
      className={`model login-pop ${isModal === "loginPop" ? "is-open" : ""}`}
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
      <div
        className={`model-body ${loginActive ? "active" : ""}`}
        id="loginForm"
      >
        <div className="title">
          <Link className="icon" href="/">
            <Image
              src="/icon/logo-vector.svg"
              width={43}
              height={37}
              alt="Legacy of Marwar logo"
            />
          </Link>
          <h4>Login or Signup</h4>
        </div>
        <div className="form">
          <Input
            type="text"
            name="text"
            value={mobileNo}
            onChange={handleMobileChange}
            placeholder="+91 Mobile Number / Email"
            id="user"
          />          
          <Button
            classname="solid-primary"
            buttonText={isLoading ? "Please wait..." : "Continue"}
            onClick={handleContinue}
            disabled={isLoading}
          />
        </div>
        <div className="split-sec">
          <p>OR</p>
        </div>
        <div className="btm-social-wrp">
          <Link
            href="javascript:void(0);"
            className="btn primary-border google-btn"
          >
            <svg
              width="17"
              height="18"
              viewBox="0 0 17 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.7919 8.24996H9.15023V10.525H14.5752C14.3002 13.7 11.6586 15.0583 9.15856 15.0583C5.96689 15.0583 3.16689 12.5416 3.16689 8.99996C3.16689 5.58329 5.83356 2.94163 9.16689 2.94163C11.7419 2.94163 13.2502 4.58329 13.2502 4.58329L14.8336 2.93329C14.8336 2.93329 12.8002 0.666626 9.08356 0.666626C4.35023 0.666626 0.691895 4.66663 0.691895 8.99996C0.691895 13.2083 4.13356 17.3333 9.20856 17.3333C13.6669 17.3333 16.9169 14.275 16.9169 9.75829C16.9169 8.79996 16.7919 8.24996 16.7919 8.24996Z"
                fill="#000"
              ></path>
            </svg>
            Google
          </Link>
          <Link
            href="javascript:void(0);"
            className="btn primary-border facebook-btn"
          >
            <svg
              width="10"
              height="18"
              viewBox="0 0 10 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.16683 10.25H8.25016L9.0835 6.91663H6.16683V5.24996C6.16683 4.39163 6.16683 3.58329 7.8335 3.58329H9.0835V0.783293C8.81183 0.747459 7.786 0.666626 6.70266 0.666626C4.44016 0.666626 2.8335 2.04746 2.8335 4.58329V6.91663H0.333496V10.25H2.8335V17.3333H6.16683V10.25Z"
                fill="#000"
              ></path>
            </svg>
            Facebook
          </Link>
        </div>
      </div>
      <div className={`model-body ${loginActive ? "" : "active"}`} id="otpForm">
        <Link className="icon" href="/">
          <Image
            src="/icon/logo-vector.svg"
            width={43}
            height={37}
            alt="Legacy of Marwar logo"
          />
        </Link>
        <button
          type="button"
          className="back-to-login"
          onClick={() => setLoginActive(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m15 4l-8 8l8 8"
            ></path>
          </svg>
          Back
        </button>
        <form action="" className="otp-verify-wrap">
          <p className="message">Please enter the OTP sent to{" "} <span>{displayIdentifier}</span></p>
          <div className="otp_wrap">
            <div className="otpInput">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select()}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            {isNewUser && (
              <Input
                type="text"
                value={customerName}
                onChange={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  setCustomerName(value);
                }}
                placeholder="Enter Full Name"
                name="customerName"
                id="customerName"
              />
            )}
           <p className="otp-error" style={{display: otpError ? "block" : "none",}}>The OTP entered is incorrect!</p>
          </div>
          <Button classname="solid-primary" buttonText={isLoading ? "Please wait..." : "Verify Otp"} onClick={() => void handleVerifyOtp()} />
          <p className="register">
            Not recieved your code?{" "}
            <Link className="reg-btn" href="/">
              {" "}
              Resend Code
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
