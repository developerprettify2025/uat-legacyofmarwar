export interface CheckoutPricing {
    id: string;
    label: string;
    amount: number;
    type: "add" | "subtract";
    freeLabel?: string;  
}