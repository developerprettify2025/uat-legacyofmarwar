"use client";
import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { toast } from "react-hot-toast";
import { useModal } from "@/hooks/useModal";
import { useAppSelector } from "@/store/hooks";
import { useSaveCustomerShippingAddressMutation } from "@/store/backendSlice/customerShippingAddressAPISlice";
import Input from "../../atoms/Input";
import Button from "../../atoms/Button";

interface AddressFormData {
  name: string;
  phone: string;
  email: string;
  pincode: string;
  address: string;
  locality: string;
  city: string;
  state: string;
}

const EMPTY_FORM: AddressFormData = {
  name: "",
  phone: "",
  email: "",
  pincode: "",
  address: "",
  locality: "",
  city: "",
  state: "",
};

const POP_EVENT = "address-pop:open";
const DEFAULT_ADDRESS_KEY = "defaultShippingAddressID";

export default function AddressPop() {
  const { closeModal } = useModal();
  const { isModal } = useAppSelector((state) => state.modal);
  const { user, accounts = [] } = useAppSelector((state: any) => state.auth ?? {});

  const CustomerID =
    Number(
      user?.CustomerID ??
        user?.customerID ??
        user?.CustomerId ??
        accounts?.[0]?.CustomerID ??
        accounts?.[0]?.customerID ??
        accounts?.[0]?.CustomerId ??
        0,
    ) || 0;

  // login wale user ka email (field ke naam apne auth slice ke hisaab se badal sakte ho)
  const userEmail: string =
    user?.CustomerEmailID ?? user?.CustomerEmail ?? user?.EmailID ?? user?.email ?? "";

  const [saveAddress, { isLoading: isSaving }] =
    useSaveCustomerShippingAddressMutation();

  const [formData, setFormData] = useState<AddressFormData>(EMPTY_FORM);
  const [editingID, setEditingID] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const isEdit = editingID !== null;

  // Shipping page "Add new" ya "Edit" dabane par ye event bhejta hai
  useEffect(() => {
    const onOpen = (e: Event) => {
      const addr = (e as CustomEvent).detail;
      const savedDefault = Number(localStorage.getItem(DEFAULT_ADDRESS_KEY) || 0);

      if (addr) {
        const id = Number(addr.CustomerShippingAddressID);
        setEditingID(id);
        setIsDefault(savedDefault === id);
        setFormData({
          name: addr.CustomerShippingAddressName ?? "",
          phone: addr.CustomerShippingAddressPhoneNo ?? "",
          email: addr.CustomerShippingAddressEmailID ?? "",
          pincode: String(addr.CustomerShippingAddressPinCode ?? ""),
          address: addr.CustomerShippingAddressFullAddress ?? "",
          locality: addr.CustomerShippingAddressLocality ?? "",
          city: addr.CustomerShippingAddressCity ?? "",
          state: addr.CustomerShippingAddressState ?? "",
        });
      } else {
        setEditingID(null);
        setIsDefault(false);
        setFormData({ ...EMPTY_FORM, email: userEmail });
      }
    };

    window.addEventListener(POP_EVENT, onOpen);
    return () => window.removeEventListener(POP_EVENT, onOpen);
  }, [userEmail]);

  const handleChange = (
    e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.currentTarget;

    // phone aur pincode me sirf digits
    let next = value;
    if (name === "phone") next = value.replace(/\D/g, "").slice(0, 10);
    if (name === "pincode") next = value.replace(/\D/g, "").slice(0, 6);

    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  const validate = (): string | null => {
    const f = formData;
    if (!f.name.trim()) return "Enter name";
    if (!/^\d{10}$/.test(f.phone)) return "Enter valid 10 digit phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return "Enter valid email";
    if (!/^\d{6}$/.test(f.pincode)) return "Enter valid 6 digit pin code";
    if (!f.address.trim()) return "Enter address";
    if (!f.locality.trim()) return "Enter locality / town";
    if (!f.city.trim()) return "Enter city / district";
    if (!f.state.trim()) return "Enter state";
    return null;
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    if (CustomerID < 1) {
      toast.error("Please login first");
      return;
    }

    const error = validate();
    if (error) return toast.error(error);

    try {
      const res = await saveAddress({
        CustomerID,
        ...(isEdit ? { CustomerShippingAddressID: editingID } : {}),
        CustomerShippingAddressName: formData.name.trim(),
        CustomerShippingAddressPhoneNo: formData.phone.trim(),
        CustomerShippingAddressEmailID: formData.email.trim(),
        CustomerShippingAddressPinCode: formData.pincode.trim(),
        CustomerShippingAddressFullAddress: formData.address.trim(),
        CustomerShippingAddressLocality: formData.locality.trim(),
        CustomerShippingAddressCity: formData.city.trim(),
        CustomerShippingAddressState: formData.state.trim(),
        UpdatedBy: "Customer",
      }).unwrap();

      // default address (DB me column nahi hai, isliye browser me yaad rakhte hain)
      const savedID = Number(res?.CustomerShippingAddressID ?? editingID ?? 0);
      if (isDefault && savedID) {
        localStorage.setItem(DEFAULT_ADDRESS_KEY, String(savedID));
      } else if (
        !isDefault &&
        Number(localStorage.getItem(DEFAULT_ADDRESS_KEY)) === savedID
      ) {
        localStorage.removeItem(DEFAULT_ADDRESS_KEY);
      }

      toast.success(
        res?.message ||
          (isEdit ? "Address updated successfully" : "Address added successfully"),
      );
      setFormData({ ...EMPTY_FORM, email: userEmail });
      setEditingID(null);
      setIsDefault(false);
      closeModal();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save address");
    }
  };

  return (
    <div
      className={`model address-pop ${isModal === "addressPop" ? "is-open" : ""}`}
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
      <div className="model-body">
        <div className="title">
          <h4>{isEdit ? "Edit Address" : "Add New Address"}</h4>
        </div>
        <div className="form">
          <h6>Contact Details</h6>
          <div className="form-grid">
            <Input
              placeholder="Name"
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
            />
            <Input
              placeholder="Phone"
              type="text"
              name="phone"
              id="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <Input
              classname="full"
              placeholder="Email"
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <h6>Address</h6>
          <div className="form-grid">
            <Input
              classname="full"
              placeholder="Pin Code"
              type="text"
              name="pincode"
              id="pincode"
              value={formData.pincode}
              onChange={handleChange}
            />
            <Input
              classname="full"
              placeholder="Address ( House No, Building, Street, Area)"
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
            />
            <Input
              classname="full"
              placeholder="Locality/ Town"
              type="text"
              name="locality"
              id="locality"
              value={formData.locality}
              onChange={handleChange}
            />
            <Input
              placeholder="City/ District"
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleChange}
            />
            <Input
              placeholder="State"
              type="text"
              name="state"
              id="state"
              value={formData.state}
              onChange={handleChange}
            />
          </div>
          <div className="disclaimer">
            <div className="check-box">
              <input
                type="checkbox"
                name="default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <div className="in-bx"></div>
            </div>
            <p>Make this my default address</p>
          </div>
          <Button
            classname="solid-primary"
            buttonText={
              isSaving
                ? "please wait..."
                : isEdit
                  ? "update address"
                  : "add address"
            }
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}