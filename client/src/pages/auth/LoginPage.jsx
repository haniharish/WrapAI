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
import { Mail, Lock, Shield, User } from 'lucide-react';
import { emailPattern } from '../../utils/validators.js';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: 'rahul@wrapai.io',
      password: 'password123'
    }
  });

  const onSubmit = async (data) => {
    try {
      const res = await authService.login(data.email, data.password);
      dispatch(loginSuccess(res.data));
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const fillDemoUser = () => {
    setValue('email', 'rahul@wrapai.io');
    setValue('password', 'password123');
  };

  const fillDemoAdmin = () => {
    setValue('email', 'sarah.j@enterprise.com');
    setValue('password', 'adminpassword123');
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brand-light">
      <AmbientBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-brand-navy shadow-2xl p-8">
          <div className="text-center mb-8">
            <span className="font-display text-3xl uppercase tracking-wide text-brand-navy">Sign In</span>
            <p className="text-xs text-brand-taupe mt-1">Access your WrapAI intelligence workspace</p>
          </div>

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

            <div className="flex items-center justify-between text-xs pt-1">
              <Link to="/forgot-password" className="font-bold text-brand-navy hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
              Enter Workspace
            </Button>
          </form>

          {/* Quick Demo Pre-fill helpers */}
          <div className="mt-8 pt-6 border-t border-brand-charcoal/10">
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-taupe text-center mb-3">
              DEMO CREDENTIALS (CLICK TO FILL)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={fillDemoUser} icon={User}>
                User Role
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={fillDemoAdmin} icon={Shield}>
                Admin Role
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-brand-taupe">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-navy hover:underline">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
