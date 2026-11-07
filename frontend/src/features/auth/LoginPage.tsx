import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, Field, Input } from '@/components/ui';
import { useAuth } from './AuthProvider';

const schema = z.object({ username: z.string().min(3, 'At least 3 characters'), password: z.string().min(8, 'At least 8 characters'), setupKey: z.string().optional() });
type F = z.infer<typeof schema>;

export function LoginPage() {
  const { login, setupRequired, setupKeyRequired } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold">AyanoERP Finance</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">{setupRequired ? 'First run: create the Finance administrator account.' : 'Sign in to continue.'}</p>
        <form className="space-y-4" onSubmit={handleSubmit(async (v) => { setError(''); try { await login(v.username, v.password, setupRequired, v.setupKey); } catch (e) { setError((e as Error).message); } })}>
          <Field label="Username" error={errors.username?.message}><Input autoComplete="username" autoFocus {...register('username')} /></Field>
          <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete={setupRequired ? 'new-password' : 'current-password'} {...register('password')} /></Field>
          {setupRequired && setupKeyRequired && <Field label="Setup key"><Input type="password" {...register('setupKey')} /></Field>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>{setupRequired ? 'Create account' : 'Sign in'}</Button>
        </form>
      </Card>
    </div>
  );
}
