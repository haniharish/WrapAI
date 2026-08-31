import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brand-light">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-brand-navy shadow-2xl p-8">
          <div className="text-center mb-6">
            <span className="font-display text-3xl uppercase tracking-wide text-brand-navy">Reset Password</span>
            <p className="text-xs text-brand-taupe mt-1">We will send you instructions to recover your account</p>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <p className="text-sm font-bold text-brand-navy">Reset Link Dispatched</p>
              <p className="text-xs text-brand-taupe mt-1 mb-6">
                If an account exists with that email, check your inbox for password reset instructions.
              </p>
              <Link to="/login">
                <Button variant="primary" size="sm" className="w-full">Return to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="name@company.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: emailPattern, message: 'Invalid email address' }
                })}
              />

              <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                Send Instructions
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center text-xs font-bold text-brand-charcoal hover:text-brand-navy">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
