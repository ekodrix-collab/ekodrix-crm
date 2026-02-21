'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Target,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/';

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [supabase.auth, router, redirectTo]);

  // Handle Auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Please enter your password');
        setLoading(false);
        return;
      }

      // Login flow
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address to reset password');
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox for instructions.');
        setShowResetForm(false);
      }
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>

      <Card className="w-full max-w-md shadow-xl border-border bg-card rounded-[2rem] overflow-hidden relative z-10 transition-all duration-500">
        <CardHeader className="text-center pb-6 pt-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-primary/5">
            <Target className="w-8 h-8 text-primary" />
          </div>

          <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
            Agency CRM
          </CardTitle>

          <CardDescription className="text-muted-foreground mt-2 text-base">
            {showResetForm
              ? 'Enter your email to reset password'
              : 'Welcome back! Sign in to your account'
            }
          </CardDescription>
        </CardHeader>

        <form onSubmit={showResetForm ? handleForgotPassword : handleAuth}>
          <CardContent className="space-y-5 px-8">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="rounded-2xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="bg-primary/10 border-primary/20 text-primary rounded-2xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold ml-1">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@youragency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-background border-input text-foreground rounded-2xl focus-visible:ring-1 focus-visible:ring-primary transition-all placeholder:text-muted-foreground/50 shadow-sm"
                  autoComplete="email"
                  disabled={loading || resetLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            {!showResetForm && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-semibold ml-1">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-background border-input text-foreground rounded-2xl focus-visible:ring-1 focus-visible:ring-primary transition-all placeholder:text-muted-foreground/50 shadow-sm"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {!showResetForm && (
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-8 pb-10 pt-6">
            {showResetForm ? (
              <>
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold shadow-md shadow-primary/20 transition-all"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-2xl"
                  onClick={() => {
                    setShowResetForm(false);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Back to Login
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-[15px] shadow-md shadow-primary/20 active:scale-[0.98] transition-all"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </Button>
            )}

            <p className="text-center text-xs text-muted-foreground font-medium mt-4">
              Internal Access Only
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
