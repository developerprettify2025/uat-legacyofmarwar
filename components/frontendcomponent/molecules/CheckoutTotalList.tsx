'use client';
import Button from "../atoms/Button";
import type { CheckoutPricing } from "@/app/types/CheckoutPricing";

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

interface CheckoutTotalListProps {
  classname?: string;
  items: CheckoutPricing[];
  buttonText?: string;
  onPlaceOrder?: () => void;
  disabled?: boolean;
}

export default function CheckoutTotalList({
  classname = "",
  items,
  buttonText = "Place Order",
  onPlaceOrder,
  disabled = false,
}: CheckoutTotalListProps) {
  const totalAmount = items.reduce(
    (total, item) =>
      item.type === "subtract" ? total - item.amount : total + item.amount,
    0,
  );

  const renderAmount = (item: CheckoutPricing) => {
    if (item.amount === 0 && item.freeLabel) {
      return <span className="green-color">{item.freeLabel}</span>;
    }
    if (item.type === "subtract" && item.amount > 0) {
      return <span className="green-color">-{formatINR(item.amount)}</span>;
    }
    return <span>{formatINR(item.amount)}</span>;
  };

  return (
    <div className={`checkout-list-wrap ${classname}`}>
      <ul className="checkout-list">
        {items.map((item) => (
          <li key={item.id}>
            <p>{item.label}</p>
            {renderAmount(item)}
          </li>
        ))}
      </ul>
      <div className="total_amount">
        <p>Total Amount</p>
        <p>{formatINR(totalAmount)}</p>
      </div>
      <Button
        classname="solid-primary"
        buttonText={buttonText}
        onClick={onPlaceOrder}
        disabled={disabled || totalAmount < 1}
      />
    </div>
  );
}