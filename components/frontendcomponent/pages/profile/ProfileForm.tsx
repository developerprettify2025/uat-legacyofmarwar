
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type SyntheticEvent,
  type ChangeEvent,
} from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/slice/authSlice";
import toast from "react-hot-toast";

import Input from "../../atoms/Input";
import Textarea from "../../atoms/Textarea";
import FileInput from "../../atoms/FileInput";
import Button from "../../atoms/Button";

import {
  useGetCustomerByIdQuery,
  useSaveCustomerMutation,
} from "../../../../store/backendSlice/customerAPISlice";

import {
  useGetCustomerShippingAddressesQuery,
} from "../../../../store/backendSlice/customerShippingAddressAPISlice";

interface ProfileFormProps {
  CustomerID: string | number;
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

interface CustomerAccount {
  CustomerID?: number | string;
  CustomerId?: number | string;
  customerID?: number | string;
  CustomerName?: string;
  CustomerEmailID?: string;
  CustomerPhoneNo?: string;
  CustomerMobileNo?: string;
  CustomerImage?: string;
  ActiveStatus?: number | string;
  [key: string]: unknown;
}

interface ShippingAddress {
  CustomerShippingAddressID: number;
  CustomerShippingAddressName: string;
  CustomerShippingAddressFullAddress: string;
  CustomerShippingAddressLocality: string;
  CustomerShippingAddressCity: string;
  CustomerShippingAddressState: string;
  CustomerShippingAddressPinCode: string | number;
}

const getProfileImageUrl = (image?: string | null): string => {
  const customerImage = image?.trim() || "user.svg";

  if (
    /^https?:\/\//i.test(customerImage) ||
    customerImage.startsWith("/") ||
    customerImage.startsWith("blob:")
  ) {
    return customerImage;
  }

  return `/OnlineImages/CustomerImages/${customerImage}`;
};

export default function ProfileForm({
  CustomerID,
}: ProfileFormProps) {
  const dispatch = useAppDispatch();

  const {
    user,
    accounts = [],
    loginMethod,
  } = useAppSelector((state: any) => state.auth ?? {});

  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
  });

  const [customerImageFile, setCustomerImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");

  const {
    data: customerResponse,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
  } = useGetCustomerByIdQuery(String(CustomerID), {
    skip: !CustomerID || Number(CustomerID) <= 0,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: addressResponse,
    isLoading: isAddressLoading,
  } = useGetCustomerShippingAddressesQuery(String(CustomerID), {
    skip: !CustomerID || Number(CustomerID) <= 0,
  });

  const [saveCustomer, { isLoading: isSaving }] =
    useSaveCustomerMutation();

  const customer = customerResponse?.data;

  const emailLocked = Boolean(customer?.CustomerEmailID?.trim());

  const phoneLocked = Boolean(
    customer?.CustomerPhoneNo?.trim() ||
      customer?.CustomerMobileNo?.trim()
  );

  useEffect(() => {
    if (!customerResponse?.success || !customer) return;

    const nameParts = String(customer.CustomerName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    setFormData({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" "),
      phone: String(
        customer.CustomerPhoneNo ??
          customer.CustomerMobileNo ??
          ""
      ),
      email: String(customer.CustomerEmailID || ""),
      message: "",
    });

    setImagePreview(getProfileImageUrl(customer.CustomerImage));
  }, [customerResponse, customer]);

  useEffect(() => {
    if (!customerImageFile) return;

    const previewUrl = URL.createObjectURL(customerImageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [customerImageFile]);

  const handleChange = (
    event: SyntheticEvent<any, Event>
  ) => {
    const { name, value } = event.currentTarget;

    if (name === "email" && emailLocked) return;
    if (name === "phone" && phoneLocked) return;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!CustomerID || Number(CustomerID) <= 0) {
      toast.error("Customer ID is missing. Please log in again.");
      return;
    }

    const customerName = [
      formData.firstName.trim(),
      formData.lastName.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (!customerName) {
      toast.error("Please enter your customer name.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!phone) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (
      customerImageFile &&
      ![
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/avif",
      ].includes(customerImageFile.type)
    ) {
      toast.error("Please select a valid image.");
      return;
    }

    if (
      customerImageFile &&
      customerImageFile.size > 10 * 1024 * 1024
    ) {
      toast.error("Profile image must be 10 MB or smaller.");
      return;
    }

    const payload = new FormData();

    payload.append("CustomerID", String(CustomerID));
    payload.append("CustomerName", customerName);
    payload.append("CustomerEmailID", email);
    payload.append("CustomerPhoneNo", phone);

    // Backend expects ActiveStatus as 0 or 1.
    const activeStatus = Number(customer?.ActiveStatus ?? 1);

    payload.append(
      "ActiveStatus",
      String(activeStatus === 0 ? 0 : 1)
    );

    payload.append("UpdatedBy", "Customer");

    if (customerImageFile) {
      payload.append("CustomerImage", customerImageFile);
    }

    try {
      const response = await saveCustomer(payload).unwrap();

      if (!response?.success) {
        toast.error(
          response?.message || "Could not update your profile."
        );
        return;
      }

      // The backend should return the actual saved filename
      // as response.CustomerImage.
      const savedImage =
        response?.CustomerImage ??
        response?.data?.CustomerImage ??
        customer?.CustomerImage ??
        user?.CustomerImage ??
        "user.svg";

      const updatedUser: CustomerAccount = {
        ...(user ?? {}),
        ...(customer ?? {}),
        CustomerID: Number(CustomerID),
        CustomerName: customerName,
        CustomerEmailID: email,
        CustomerPhoneNo: phone,
        CustomerImage: savedImage,
        ActiveStatus: activeStatus,
      };

      const updatedAccounts: CustomerAccount[] = (
        accounts as CustomerAccount[]
      ).map((account) => {
        const accountID = Number(
          account.CustomerID ??
            account.CustomerId ??
            account.customerID ??
            0
        );

        if (accountID !== Number(CustomerID)) {
          return account;
        }

        return {
          ...account,
          CustomerName: customerName,
          CustomerEmailID: email,
          CustomerPhoneNo: phone,
          CustomerImage: savedImage,
          ActiveStatus: activeStatus,
        };
      });

      // Update Redux session so DashboardNav gets the new image.
      dispatch(
        login({
          user: updatedUser,
          accounts: updatedAccounts,
          loginMethod,
        })
      );

      setFormData((previous) => ({
        ...previous,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email,
        phone,
      }));

      setCustomerImageFile(null);
      setImagePreview(getProfileImageUrl(savedImage));

      toast.success(
        response?.message || "Profile updated successfully."
      );
    } catch (error: unknown) {
      const apiError = error as {
        data?: { message?: string; Message?: string };
        message?: string;
      };

      toast.error(
        apiError?.data?.message ||
          apiError?.data?.Message ||
          apiError?.message ||
          "Could not update your profile."
      );
    }
  };

  if (isCustomerLoading) {
    return <div className="aside-right">Loading profile...</div>;
  }

  if (isCustomerError) {
    return (
      <div className="aside-right">
        Unable to load your profile. Please try again.
      </div>
    );
  }

  const addresses: ShippingAddress[] = addressResponse?.data ?? [];

  return (
    <div className="aside-right">
      <div className="aside-right-wrap">
        <h4 className="form-title">My Profile</h4>

        <form className="form form-grid" onSubmit={handleSubmit}>
          <Input
            type="text"
            label="First Name *"
            name="firstName"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />

          <Input
            type="text"
            label="Last Name"
            name="lastName"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />

          <Input
            type="tel"
            label="Phone *"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            //readOnly={phoneLocked}
            required
          />

          <Input
            type="email"
            label="Email *"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            //readOnly={emailLocked}
            required
          />

          {/* <Textarea
            classname="full"
            label="Message"
            name="message"
            id="message"
            value={formData.message}
            onChange={handleChange}
          /> */}

          <div className="profile_pic">
            <p>Profile Picture</p>

            {/* {imagePreview && (
              <img
                src={imagePreview}
                alt="Profile preview"
                width={100}
                height={100}
                style={{
                  objectFit: "cover",
                  borderRadius: "50%",
                  marginBottom: 10,
                }}
              />
            )} */}

            <FileInput
              classname="file-group"
              name="file"
              id="file"
              //accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setCustomerImageFile(
                  event.target.files?.[0] ?? null
                );
              }}
            />
          </div>

          <div className="submit-grp full text-left">
            <Button
              classname="solid-secondary"
              buttonText={isSaving ? "Updating..." : "Update Profile"}
              type="submit"
              disabled={isSaving}
            />
          </div>
        </form>

        <div className="delivery_add">
          <div className="title">
            <h6 className="form-title">Delivery Address</h6>

            <button
              type="button"
              className="btn secondary-border"
              onClick={() =>
                toast("Connect your Add Address form here.")
              }
            >
              <span className="sm-none">Add New Address</span>
              <span className="sm-block">Add Address</span>
            </button>
          </div>

          <div className="add_wrapper">
            {isAddressLoading ? (
              <p>Loading addresses...</p>
            ) : addresses.length > 0 ? (
              addresses.map((address) => (
                <div
                  className="address"
                  key={address.CustomerShippingAddressID}
                >
                  <div className="icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 32 32"
                    >
                      <path
                        fill="#000"
                        d="M16 18a5 5 0 1 1 5-5a5.006 5.006 0 0 1-5 5m0-8a3 3 0 1 0 3 3a3.003 3.003 0 0 0-3-3"
                      />
                      <path
                        fill="#000"
                        d="m16 30l-8.436-9.949a35 35 0 0 1-.348-.451A10.9 10.9 0 0 1 5 13a11 11 0 0 1 22 0a10.9 10.9 0 0 1-2.215 6.597l-.001.003s-.3.394-.345.447ZM8.813 18.395s.233.308.286.374L16 26.908l6.91-8.15c.044-.055.278-.365.279-.366A8.9 8.9 0 0 0 25 13a9 9 0 1 0-18 0a8.9 8.9 0 0 0 1.813 5.395"
                      />
                    </svg>
                  </div>

                  <div className="content">
                    <p className="title">
                      {address.CustomerShippingAddressName}
                    </p>

                    <p>
                      {address.CustomerShippingAddressFullAddress}
                      {address.CustomerShippingAddressLocality
                        ? `, ${address.CustomerShippingAddressLocality}`
                        : ""}
                      {address.CustomerShippingAddressCity
                        ? `, ${address.CustomerShippingAddressCity}`
                        : ""}
                      {address.CustomerShippingAddressState
                        ? `, ${address.CustomerShippingAddressState}`
                        : ""}
                      {address.CustomerShippingAddressPinCode
                        ? ` - ${address.CustomerShippingAddressPinCode}`
                        : ""}
                    </p>

                    <div className="btn_wrap" />
                  </div>
                </div>
              ))
            ) : (
              <p>No delivery addresses found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
