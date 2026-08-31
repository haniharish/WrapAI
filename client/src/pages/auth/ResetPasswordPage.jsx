import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const password = watch('password');

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setDone(true);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 sm:p-12 bg-[#E3E2DE]">
      <div className="w-full max-w-lg border border-[#C7C7C7] bg-white/70 p-8 sm:p-12 space-y-8">
        <div className="space-y-2 border-b border-[#C7C7C7] pb-6">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            CREDENTIALS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414]">
            SET NEW PASSWORD.
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            CHOOSE A SECURE ACCESS KEY FOR YOUR ACCOUNT
          </p>
        </div>

        {done ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm font-bold uppercase tracking-wider text-[#141414]">Password Updated Successfully</p>
            <PosterButton variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
              PROCEED TO SIGN IN
            </PosterButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="NEW PASSWORD"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
            />

            <Input
              label="CONFIRM NEW PASSWORD"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                validate: (val) => val === password || 'Passwords do not match'
              })}
            />

            <div className="pt-2">
              <PosterButton type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'SAVING...' : 'SAVE PASSWORD'}
              </PosterButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
