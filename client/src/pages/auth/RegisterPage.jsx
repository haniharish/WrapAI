import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice.js';
import { authService } from '../../services/authService.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { AmbientBackground } from '../../components/common/AmbientBackground.jsx';
import { User, Mail, Lock } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await authService.register(data);
      dispatch(loginSuccess(res.data));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brand-light">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-brand-navy shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="font-display text-3xl uppercase tracking-wide text-brand-navy">Create Account</span>
            <p className="text-xs text-brand-taupe mt-1">Start converting long-form content into clarity</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Rahul Sharma"
              error={errors.fullName?.message}
              {...register('fullName', { required: 'Full name is required' })}
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="rahul@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: emailPattern, message: 'Invalid email address' }
              })}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
            />

            <Button type="submit" variant="primary" size="md" className="w-full mt-4" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-brand-taupe">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-navy hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
