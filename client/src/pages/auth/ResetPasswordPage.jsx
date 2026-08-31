import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { Lock } from 'lucide-react';

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
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brand-light">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-brand-navy shadow-2xl p-8">
          <div className="text-center mb-6">
            <span className="font-display text-3xl uppercase tracking-wide text-brand-navy">Set New Password</span>
            <p className="text-xs text-brand-taupe mt-1">Choose a secure password for your account</p>
          </div>

          {done ? (
            <div className="text-center py-4">
              <p className="text-sm font-bold text-brand-navy mb-4">Password Updated Successfully</p>
              <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/login')}>
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
              />

              <Input
                label="Confirm New Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  validate: (val) => val === password || 'Passwords do not match'
                })}
              />

              <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                Save Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
