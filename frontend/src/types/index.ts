export type Status = 'Pending' | 'Paid';
export type Method = 'Cash' | 'Bank Transfer' | 'E-Wallet' | 'Card';
export const METHODS: Method[] = ['Cash', 'Bank Transfer', 'E-Wallet', 'Card'];
export interface User { id: number; username: string; role: 'finance' | 'staff' }
export interface InvoiceRow { id: number; invoiceNo: string; orderId: number; orderNo: string; customerId: number; customerName: string; invoiceDate: string; totalCents: number; amountPaidCents: number; balanceCents: number; status: Status }
export interface PaymentRow { id: number; invoiceId: number; invoiceNo: string; customerName: string; paymentDate: string; amountCents: number; method: Method; referenceNo: string | null; recordedBy: string }
export interface InvoiceDetail {
  invoice: InvoiceRow;
  customer: { name: string; email: string | null; phone: string | null; address: string | null };
  items: { id: number; productName: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  payments: { id: number; paymentDate: string; amountCents: number; method: Method; referenceNo: string | null; recordedBy: string }[];
}
export interface Dashboard { totalInvoices: number; paidInvoices: number; pendingInvoices: number; totalCollectedCents: number; totalReceivableCents: number; latest: InvoiceRow[] }
export interface OrderRow { id: number; orderNo: string; customerName: string; status: 'Pending' | 'Confirmed'; totalCents: number; createdAt: string; invoiceId: number | null }
