import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 sm:p-12 bg-[#E3E2DE]">
      <div className="w-full max-w-lg border border-[#C7C7C7] bg-white/70 p-8 sm:p-12 space-y-8">
        <div className="space-y-2 border-b border-[#C7C7C7] pb-6">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            RECOVERY
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414]">
            RESET PASSWORD.
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            ENTER REGISTERED EMAIL TO RECEIVE RECOVERY INSTRUCTIONS
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#1b6b36] mx-auto" />
            <p className="text-sm font-bold uppercase tracking-wider text-[#141414]">Reset Link Dispatched</p>
            <p className="text-xs text-[#444343] leading-relaxed">
              If an account exists with that email, check your inbox for password reset instructions.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <PosterButton variant="primary" size="md" className="w-full">RETURN TO SIGN IN</PosterButton>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="EMAIL ADDRESS"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: emailPattern, message: 'Invalid email address' }
              })}
            />

            <div className="pt-2">
              <PosterButton type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'SENDING...' : 'SEND INSTRUCTIONS'}
              </PosterButton>
            </div>

            <div className="text-center pt-3">
              <Link to="/login" className="inline-flex items-center text-xs font-mono font-bold uppercase text-[#1351AA] hover:underline">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> BACK TO SIGN IN
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
