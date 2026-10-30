"use client";
import { useState } from "react";
import type { SyntheticEvent } from "react";
import Button from "../../atoms/Button";
import Input from "../../atoms/Input";
import Textarea from "../../atoms/Textarea";
import Select from "../../atoms/Select";
import { useSaveEnquiryMutation } from "@/store/backendSlice/contactUsAPISlice";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

interface ProductOptions {
  label: string;
  value: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  products: ProductOptions[];
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  products?: string;
  message?: string;
}

const productOptions: ProductOptions[] = [
  { label: "Product 1", value: "Product 1" },
  { label: "Product 2", value: "Product 2" },
  { label: "Product 3", value: "Product 3" },
  { label: "Product 4", value: "Product 4" },
];

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  products: [],
  message: "",
};
interface ContactFormProps {
  data: any[];
}

export default function ContactForm({ data }: ContactFormProps) {
  const router = useRouter();
  const productOptions: ProductOptions[] = (data ?? [])
    .filter((item) => item.ProductName?.trim())
    .map((item) => ({
      label: item.ProductName!.trim(),
      value: item.ProductName!.trim(),
    }));
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [saveEnquiry, { isLoading: isSubmitting }] = useSaveEnquiryMutation();

  const handleChange = (
    e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    setSubmitMessage("");
  };

  const handleProductChange = (e: { target: { value: string } }) => {
    const selectedProduct = productOptions.find(
      (product) => product.value === e.target.value,
    );

    setFormData((prev) => ({
      ...prev,
      products: selectedProduct ? [selectedProduct] : [],
    }));

    setErrors((prev) => ({
      ...prev,
      products: undefined,
    }));

    setSubmitMessage("");
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const message = formData.message.trim();

    // Name validation
    if (!name) {
      newErrors.name = "Please enter your name.";
    } else if (name.length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    } else if (name.length > 100) {
      newErrors.name = "Name cannot exceed 100 characters.";
    }

    // Email validation
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

    // Indian mobile number validation
    if (!phone) {
      newErrors.phone = "Please enter your phone number.";
    } else {
      const normalizedPhone = phone.replace(/[\s()-]/g, "");
      const indianMobileRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

      if (!indianMobileRegex.test(normalizedPhone)) {
        newErrors.phone = "Please enter a valid 10-digit Indian mobile number.";
      }
    }

    // Product validation
    if (
      !formData.products.length ||
      !formData.products.some((product) =>
        productOptions.some((option) => option.value === product.value),
      )
    ) {
      newErrors.products = "Please select a valid product.";
    }

    // Message validation
    if (!message) {
      newErrors.message = "Please enter your message.";
    } else if (message.length > 200) {
      newErrors.message = "Message must not exceed 200 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitMessage("");
    setSubmitSuccess(false);

    if (!validateForm()) return;

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const message = formData.message.trim();

    const selectedProducts = formData.products
      .map((product) => product.value)
      .join(", ");

    try {
      const response = await saveEnquiry({
        VendorID: 0,
        FullName: name,
        EmailID: email,
        PhoneNo: phone,
        CompanyName: null,
        Message: message,
        EnquiryType: "Normal Enquiry",
        EnquiryFor: selectedProducts,
        CountryName: null,
        PageName: window.location.href,
        LeadStatus: "New",
      }).unwrap();
      setSubmitSuccess(true);
      setSubmitMessage(
        response?.message || "Your enquiry has been submitted successfully!",
      );
      router.push("/thank-you");
      setFormData({ ...initialFormData });
      setErrors({});

      // Redirect only after successful API response.
      router.push("/thank-you");
    } catch (error: unknown) {
      console.error("Contact enquiry error:", error);

      let errorMessage = "Failed to submit your enquiry. Please try again.";

      if (typeof error === "object" && error !== null && "data" in error) {
        const errorData = error.data;

        if (
          typeof errorData === "object" &&
          errorData !== null &&
          "message" in errorData &&
          typeof errorData.message === "string"
        ) {
          errorMessage = errorData.message;
        }
      }

      setSubmitSuccess(false);
      setSubmitMessage(errorMessage);
    }
  };

  return (
    <>
      <section>
        <div className="contact_form sec-pad-all">
          <div className="container">
            <div className="heading">
              <h2>Your Journey to Timeless Elegance Begins Here</h2>
            </div>

            <form action="" className="form" noValidate>
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
                    <p role="alert" style={{ color: "red", fontSize: "12px" }}>
                      {errors.name}
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
                    <p role="alert" style={{ color: "red", fontSize: "12px" }}>
                      {errors.email}
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
                    <p role="alert" style={{ color: "red", fontSize: "12px" }}>
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Select
                    label="Products *"
                    name="products"
                    id="products"
                    options={productOptions}
                    onChange={handleProductChange}
                  />

                  {errors.products && (
                    <p role="alert" style={{ color: "red", fontSize: "12px" }}>
                      {errors.products}
                    </p>
                  )}
                </div>

                <div className="full">
                  <Textarea
                    classname="full"
                    label="Message *"
                    name="message"
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />

                  {errors.message && (
                    <p role="alert" style={{ color: "red", fontSize: "12px" }}>
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
                  buttonText={isSubmitting ? "Submitting..." : "Enquire Now"}
                  onClick={handleSubmit}
                  classname="solid-primary"
                />
              </div>
            </form>
          </div>
        </div>
      </section>
      {isSubmitting && <Loading />}
    </>
  );
}
