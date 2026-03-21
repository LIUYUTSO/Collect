export interface Payee {
  name: string;
  message?: string;
  amount?: number;
  [key: string]: any; // fallback for other jsonb fields if any
}

export interface PaymentRequest {
  id: string;
  slug: string;
  title: string;
  amount: number;
  currency?: string;
  note?: string;
  method: string;
  status: string;
  fromName?: string;
  payerName?: string;
  payees?: Payee[];
  eventDate?: string;
  location?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
