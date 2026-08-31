import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice.js';
import { authService } from '../../services/authService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { AlertCircle } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: 'rahul@wrapai.io',
      password: 'Password123'
    }
  });

  const onSubmit = async (data) => {
    setAuthError(null);
    try {
      const res = await authService.login(data.email, data.password);
      dispatch(loginSuccess(res.data));
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password');
    }
  };

  const fillDemoUser = () => {
    setValue('email', 'rahul@wrapai.io');
    setValue('password', 'Password123');
    setAuthError(null);
  };

  const fillDemoAdmin = () => {
    setValue('email', 'sarah.jenkins@wrapai.io');
    setValue('password', 'Password123');
    setAuthError(null);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 sm:p-12 bg-[#E3E2DE]">
      <div className="w-full max-w-lg border border-[#C7C7C7] bg-white/70 p-8 sm:p-12 space-y-8">
        <div className="space-y-2 border-b border-[#C7C7C7] pb-6">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            AUTHENTICATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414]">
            SIGN IN.
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            ENTER CREDENTIALS TO ACCESS YOUR WORKSPACE
          </p>
        </div>

        {authError && (
          <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

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

          <Input
            label="PASSWORD"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' }
            })}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <Link to="/forgot-password" className="font-mono uppercase font-bold text-[#1351AA] hover:underline">
              FORGOT PASSWORD?
            </Link>
          </div>

          <div className="pt-2">
            <PosterButton type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'AUTHENTICATING...' : 'ENTER WORKSPACE'}
            </PosterButton>
          </div>
        </form>

        {/* Quick Demo Pre-fill helpers */}
        <div className="pt-6 border-t border-[#C7C7C7] space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7A7A] text-center">
            DEMO PRESET ACCOUNTS (CLICK TO AUTO-FILL)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <PosterButton type="button" variant="outline" size="sm" onClick={fillDemoUser}>
              USER: RAHUL
            </PosterButton>
            <PosterButton type="button" variant="outline" size="sm" onClick={fillDemoAdmin}>
              ADMIN: SARAH
            </PosterButton>
          </div>
        </div>

        <div className="text-center text-xs font-mono text-[#7A7A7A] pt-2">
          DO NOT HAVE AN ACCOUNT?{' '}
          <Link to="/register" className="font-bold text-[#1351AA] hover:underline uppercase">
            REGISTER HERE
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
