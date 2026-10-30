"use client";

import { useState } from "react";
import { useSaveEnquiryMutation } from "@/store/backendSlice/contactUsAPISlice";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const useEnquiry = (enquiryType = "General Enquiry") => {
  const initialState = {
    FullName: "",
    EmailID: "",
    PhoneNo: "",
    Message: "",
    EnquiryType: enquiryType,
    EnquiryFor: enquiryType,
    CompanyName: "",
    CountryName: null,
    PageName: typeof window !== 'undefined' ? window.location.href : "",
  };
  const router = useRouter();
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [saveEnquiry, { isLoading }] = useSaveEnquiryMutation();

  const validate = () => {
    const newErrors = {};
    if (!formData.FullName.trim()) newErrors.FullName = "Please enter your name.";
    else if (formData.FullName.trim().length < 3) newErrors.FullName = "Name must be at least 3 characters.";
    if (!formData.EmailID.trim()) newErrors.EmailID = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EmailID)) newErrors.EmailID = "Please provide a valid email format.";
    if (!formData.PhoneNo.trim()) newErrors.PhoneNo = "Please provide your phone number.";
    else if (!/^\d{10}$/.test(formData.PhoneNo)) newErrors.PhoneNo = "Phone number must be exactly 10 digits.";
    if (!formData.EnquiryType.trim()) newErrors.EnquiryType = "Please enter a subject.";
    if (!formData.Message.trim()) newErrors.Message = "Please enter your message.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "PhoneNo" && value.length > 10) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    let error = "";

    switch (name) {
      case "FullName":
        if (!value.trim()) {
          error = "Please enter your name.";
        } else if (value.trim().length < 3) {
          error = "Name must be at least 3 characters.";
        }
        break;

      case "EmailID":
        if (!value.trim()) {
          error = "Please enter your email address.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please provide a valid email format.";
        }
        break;

      case "PhoneNo":
        if (!value.trim()) {
          error = "Please provide your phone number.";
        } else if (!/^\d{10}$/.test(value)) {
          error = "Phone number must be exactly 10 digits.";
        }
        break;

      case "Message":
        if (!value.trim()) {
          error = "Please enter your message.";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form.");
      return false;
    }
    try {
      const response = await saveEnquiry(formData).unwrap();
      if (response.success) {
        try {
          await postLead(formData);
        } catch (apiErr) {
          console.error('TeleCRM lead submission error:', apiErr);
        }
        toast.success(response.message || "Enquiry submitted successfully!");
        setFormData(initialState);
        setErrors({});
        router.push("/thank-you");
        return true;               // ← success
      }
      return false;
    } catch (err) {
      console.error("Enquiry submission error:", err);
      toast.error(err?.data?.message || "Failed to submit your enquiry. Please try again.");
      return false;                // ← failure
    }
  };

  const postLead = async (data) => {
    const endpoint = `https://next-api.telecrm.in/enterprise/${process.env.NEXT_PUBLIC_TELECRM_ENTERPRISE_ID}/autoupdatelead`;
    const payload = {
      fields: {
        phone: data.PhoneNo,
        name: data.FullName,
        email: data.EmailID,
        enquiry_type: data.EnquiryType,
        message: data.Message,
        company: data.CompanyName,
        country: data.CountryName,
        page_url: data.PageName,
      },
      actions: []
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_TELECRM_ASYNC_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || 'Failed to submit lead to TeleCRM');
    }
    return;
  };

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
    isLoading,
    setFormData,
    postLead
  };
};

export default useEnquiry;
