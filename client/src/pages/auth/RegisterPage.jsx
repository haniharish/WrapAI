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

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [regError, setRegError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    setRegError(null);
    try {
      const res = await authService.register(data);
      dispatch(loginSuccess(res.data));
      navigate('/dashboard');
    } catch (err) {
      setRegError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 sm:p-12 bg-[#E3E2DE]">
      <div className="w-full max-w-lg border border-[#C7C7C7] bg-white/70 p-8 sm:p-12 space-y-8">
        <div className="space-y-2 border-b border-[#C7C7C7] pb-6">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            NEW ACCOUNT
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414]">
            REGISTER.
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            CREATE CREDENTIALS TO START TRANSFORMING MULTI-MODAL CONTENT
          </p>
        </div>

        {regError && (
          <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{regError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="FULL NAME"
            type="text"
            placeholder="Rahul Sharma"
            error={errors.fullName?.message}
            {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
          />

          <Input
            label="EMAIL ADDRESS"
            type="email"
            placeholder="rahul@example.com"
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

          <div className="pt-2">
            <PosterButton type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </PosterButton>
          </div>
        </form>

        <div className="text-center text-xs font-mono text-[#7A7A7A] pt-4 border-t border-[#C7C7C7]">
          ALREADY HAVE AN ACCOUNT?{' '}
          <Link to="/login" className="font-bold text-[#1351AA] hover:underline uppercase">
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
