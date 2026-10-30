"use client";
import Image from "next/image";
import { useState } from "react";
import type { SyntheticEvent, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Input from "../atoms/Input";
import Textarea from "../atoms/Textarea";
import Button from "../atoms/Button";
import Loading from "@/app/loading";
import { useSaveEnquiryMutation } from "@/store/backendSlice/contactUsAPISlice";
import "@/uploads/sass/component/component.css";

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

interface DetailFormProps {
  blogName?: string;
  enquiryFor?: string;
  enquiryType?: string;
  isPopup?: boolean;
  onSuccess?: () => void;
}

const initialFormData: ContactFormData = {
  name: "",
  phone: "",
  email: "",
  message: "",
};

export default function DetailForm({
  blogName = "",
  enquiryFor = "",
  enquiryType = "",
  isPopup = false,
  onSuccess,
}: DetailFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [saveEnquiry, { isLoading: isSubmitting }] = useSaveEnquiryMutation();

  const handleChange = (
    e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitMessage("");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const message = formData.message.trim();

    // Name
    if (!name) {
      newErrors.name = "Please enter your name.";
    } else if (name.length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    } else if (name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters.";
    }

    // Email
    if (!email) {
      newErrors.email = "Please enter your email address.";
    } else if (email.length > 254) {
      newErrors.email = "Email address is too long.";
    } else if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
        email,
      )
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Indian mobile number
    if (!phone) {
      newErrors.phone = "Please enter your phone number.";
    } else {
      const normalizedPhone = phone.replace(/[\s()-]/g, "");
      const indianMobileRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
      if (!indianMobileRegex.test(normalizedPhone)) {
        newErrors.phone = "Please enter a valid 10-digit Indian mobile number.";
      }
    }

    // Message
    if (!message) {
      newErrors.message = "Please enter your message.";
    } else if (message.length > 200) {
      newErrors.message = "Message must not exceed 200 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitMessage("");
    setSubmitSuccess(false);

    if (!validateForm()) return;

    try {
      const targetEnquiryType =
        enquiryType || (blogName ? "Blog Enquiry" : "Product Enquiry");
      const targetEnquiryFor = enquiryFor || blogName || "";

      const response = await saveEnquiry({
        VendorID: 0,
        FullName: formData.name.trim(),
        EmailID: formData.email.trim(),
        PhoneNo: formData.phone.trim(),
        CompanyName: null,
        Message: formData.message.trim(),
        EnquiryType: targetEnquiryType,
        EnquiryFor: targetEnquiryFor,
        CountryName: null,
        PageName: typeof window !== "undefined" ? window.location.href : "",
        LeadStatus: "New",
      }).unwrap();

      setSubmitSuccess(true);
      setSubmitMessage(
        response?.message || "Your enquiry has been submitted successfully!",
      );
      setFormData({ ...initialFormData });
      setErrors({});
      onSuccess?.();

      // redirect only after a successful API response
      router.push("/thank-you");
    } catch (error: unknown) {
      console.error("Detail enquiry error:", error);

      let errorMessage = "Failed to submit your enquiry. Please try again.";

      if (typeof error === "object" && error !== null && "data" in error) {
        const errorData = (error as { data?: unknown }).data;
        if (
          typeof errorData === "object" &&
          errorData !== null &&
          "message" in errorData &&
          typeof (errorData as { message?: unknown }).message === "string"
        ) {
          errorMessage = (errorData as { message: string }).message;
        }
      }

      setSubmitSuccess(false);
      setSubmitMessage(errorMessage);
    }
  };

  const errorStyle = { color: "red", fontSize: "12px" };

  return (
    <>
      <form
        className="contact_form form"
        onSubmit={handleSubmit}
        noValidate
        style={
          isPopup
            ? {
                position: "static",
                boxShadow: "none",
                padding: "0",
                borderRadius: 0,
              }
            : undefined
        }
      >
        {!isPopup && (
          <div className="icon">
            <Image
              src="/images/home/discover-elephant.png"
              width="51"
              height="51"
              alt="Logo_vector"
            ></Image>
          </div>
        )}
        <div className="form-grid">
          <div>
            <Input
              type="text"
              label="Name *"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && (
              <p role="alert" style={errorStyle}>
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <Input
              type="tel"
              label="Phone *"
              name="phone"
              id="phone"
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
              required
            />
            {errors.phone && (
              <p role="alert" style={errorStyle}>
                {errors.phone}
              </p>
            )}
          </div>
          <div>
            <Input
              type="email"
              label="Email *"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && (
              <p role="alert" style={errorStyle}>
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <Textarea
              label="Message *"
              name="message"
              id="message"
              value={formData.message}
              onChange={handleChange}
            />
            {errors.message && (
              <p role="alert" style={errorStyle}>
                {errors.message}
              </p>
            )}
            <p
              style={{
                textAlign: "right",
                fontSize: "12px",
                color: "#777",
                marginTop: "4px",
              }}
            >
              {200 - formData.message.length} characters remaining
            </p>
          </div>
        </div>

        {submitMessage && (
          <p
            role={submitSuccess ? "status" : "alert"}
            style={{
              color: submitSuccess ? "green" : "red",
              marginTop: "12px",
            }}
          >
            {submitMessage}
          </p>
        )}

        <div className="btn_wrap">
          <Button
            classname="solid-primary"
            buttonText={isSubmitting ? "Submitting..." : "Enquire Now"}
            type="submit"
          ></Button>
        </div>
      </form>
      {isSubmitting && <Loading />}
    </>
  );
}
