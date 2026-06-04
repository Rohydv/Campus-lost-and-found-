import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, MapPin, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const schema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

const BENEFITS = [
  'Report lost and found items instantly',
  'Direct messaging with item reporters',
  'Real-time notifications on matches',
  'Manage all your reports in one place',
];

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await signUp(data.email, data.password, data.full_name);
      // If Supabase returns a confirmed user immediately, email confirmation is OFF
      // so we can go straight to the dashboard.
      if (result.user) {
        toast.success('Account created! Welcome aboard 🎉');
        navigate('/dashboard');
      } else {
        // Email confirmation is ON — user must verify first
        setSuccess(true);
        toast.success('Account created! Check your email to verify.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email!</h2>
          <p className="text-slate-500 text-sm mb-6">
            We've sent a verification link to your email. Please check your inbox and click the link to activate your account.
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <div className="hidden lg:block text-white">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg block">Campus</span>
              <span className="text-blue-400 font-bold text-lg block -mt-1">Lost & Found</span>
            </div>
          </Link>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Join your campus community today.
          </h2>
          <p className="text-blue-200 mb-8 leading-relaxed">
            Create a free account and start helping your fellow students find their lost belongings.
          </p>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-blue-100">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">It's free and takes less than a minute.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Jane Smith"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@university.edu"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              error={errors.confirm_password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('confirm_password')}
            />

            <p className="text-xs text-slate-400">
              By creating an account you agree to our{' '}
              <a href="#" className="text-blue-600">Terms of Service</a> and{' '}
              <a href="#" className="text-blue-600">Privacy Policy</a>.
            </p>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
              size="lg"
              icon={<UserPlus size={16} />}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
