import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { peso, pesosToCents, todayIso } from '@/lib/format';
import { METHODS, type InvoiceRow } from '@/types';

// UI validation mirrors the server's rules (the server re-validates everything).
const schema = z
  .object({ amount: z.string(), method: z.enum(METHODS, { error: 'Select a payment method' }), referenceNo: z.string().max(50), paymentDate: z.string().min(1, 'Required') })
  .superRefine((v, ctx) => {
    const c = pesosToCents(v.amount);
    if (c === null) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Enter a valid amount' });
    else if (c <= 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Amount must be greater than 0' });
    if (v.method !== 'Cash' && !v.referenceNo.trim()) ctx.addIssue({ code: 'custom', path: ['referenceNo'], message: 'Reference number is required for this method' });
  });
type F = z.infer<typeof schema>;

export function RecordPaymentDialog({ open, onClose, invoice }: { open: boolean; onClose: () => void; invoice: InvoiceRow }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { amount: '', method: 'Cash', referenceNo: '', paymentDate: todayIso() } });
  useEffect(() => { if (open) reset({ amount: '', method: 'Cash', referenceNo: '', paymentDate: todayIso() }); }, [open, reset]);
  const m = useMutation({
    mutationFn: (v: F) => api.post('/payments', { invoiceId: invoice.id, amountCents: pesosToCents(v.amount), method: v.method, referenceNo: v.referenceNo.trim() || null, paymentDate: v.paymentDate }),
    onSuccess: () => { toast('ok', 'Payment recorded'); void qc.invalidateQueries(); onClose(); },
    onError: (e) => setError('amount', { message: (e as Error).message }),
  });
  return (
    <Dialog open={open} title="Record Payment" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit((v) => m.mutate(v))}>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          <div><div className="text-xs text-slate-500">Invoice No.</div><div className="font-medium">{invoice.invoiceNo}</div></div>
          <div><div className="text-xs text-slate-500">Current balance</div><div className="font-medium">{peso(invoice.balanceCents)}</div></div>
        </div>
        <Field label="Amount (₱)" error={errors.amount?.message}><Input inputMode="decimal" autoFocus placeholder="0.00" {...register('amount')} /></Field>
        <Field label="Payment method" error={errors.method?.message}><Select {...register('method')}>{METHODS.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field label="Reference No." error={errors.referenceNo?.message}><Input {...register('referenceNo')} /></Field>
        <Field label="Payment date" error={errors.paymentDate?.message}><Input type="date" max={todayIso()} {...register('paymentDate')} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={m.isPending}>Save</Button>
        </div>
      </form>
    </Dialog>
  );
}
