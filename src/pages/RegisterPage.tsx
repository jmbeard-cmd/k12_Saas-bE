import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, GraduationCap, Lock, Mail, User, School,
  AlertCircle, CheckCircle2, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { OklahomaLogo } from '@/components/OklahomaLogo';
import type { UserAccount } from '@/lib/custodialKeys';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'parent', 'teacher', 'admin'] as const),
  school: z.string().min(2, 'Please enter your school name'),
  grade: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const OKLAHOMA_SCHOOLS = [
  'Edmond Public Schools',
  'Moore Public Schools',
  'Norman Public Schools',
  'Jenks Public Schools',
  'Broken Arrow Public Schools',
  'Tulsa Public Schools',
  'Oklahoma City Public Schools',
  'Yukon Public Schools',
  'Bixby Public Schools',
  'Deer Creek Public Schools',
  'Mustang Public Schools',
  'Owasso Public Schools',
  'Sand Springs Public Schools',
  'Other Oklahoma School',
];

const GRADES = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 1) return { strength, label: 'Weak', color: 'bg-destructive' };
  if (strength <= 3) return { strength, label: 'Fair', color: 'bg-accent' };
  return { strength, label: 'Strong', color: 'bg-green-500' };
}

export default function RegisterPage() {
  useSeoMeta({ title: 'Create Account — Oklahoma K-12 Connect' });

  const navigate = useNavigate();
  const { register: registerUser } = useCustodialAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '', school: '', grade: '' },
  });

  const watchedRole = form.watch('role');
  const watchedPassword = form.watch('password') ?? '';
  const passwordStrength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setIsSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        role: data.role as UserAccount['role'],
        grade: data.grade,
        school: data.school,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-slide-up max-w-md p-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
          <p className="text-muted-foreground mb-4">Your Oklahoma K-12 Connect account is ready. Your unique Digital ID has been generated.</p>
          <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-5/12 oklahoma-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="hero-pattern absolute inset-0" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10">
          <OklahomaLogo size="md" />
        </div>

        <div className="relative z-10 text-white space-y-6">
          <h1 className="text-3xl font-bold leading-tight">
            Join Oklahoma's<br />Digital Learning<br />Community
          </h1>
          <div className="space-y-4">
            {[
              { icon: '🔐', text: 'Secure Nostr-based Digital ID generated automatically' },
              { icon: '📡', text: 'Connected to wss://beginningend.com relay network' },
              { icon: '🏫', text: 'Serving K-12 students across Oklahoma' },
              { icon: '🛡️', text: 'Privacy-first design with encrypted keys' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-sm text-blue-100">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200/70">
          Oklahoma State Department of Education • Secure Platform
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start p-8 py-12 bg-background">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="lg:hidden flex justify-center mb-8">
            <OklahomaLogo size="md" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
            <p className="text-muted-foreground text-sm">A secure Digital School ID will be generated for you automatically.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="displayName" placeholder="Jane Smith" className="pl-10" {...form.register('displayName')} />
              </div>
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="jane@okschool.edu" className="pl-10" {...form.register('email')} />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label>I am a...</Label>
              <Select onValueChange={(v) => form.setValue('role', v as RegisterForm['role'])}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select your role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">🎓 Student</SelectItem>
                  <SelectItem value="parent">👨‍👩‍👧 Parent / Guardian</SelectItem>
                  <SelectItem value="teacher">📚 Teacher / Staff</SelectItem>
                  <SelectItem value="admin">🛡️ School Administrator</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>

            {/* School */}
            <div className="space-y-1.5">
              <Label>School / District</Label>
              <Select onValueChange={(v) => form.setValue('school', v)}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select your school" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {OKLAHOMA_SCHOOLS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.school && (
                <p className="text-xs text-destructive">{form.formState.errors.school.message}</p>
              )}
            </div>

            {/* Grade (students only) */}
            {watchedRole === 'student' && (
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <Select onValueChange={(v) => form.setValue('grade', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="pl-10 pr-10"
                  {...form.register('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {watchedPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-colors ${i <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Strength: <span className="font-medium">{passwordStrength.label}</span></p>
                </div>
              )}
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  className="pl-10 pr-10"
                  {...form.register('confirmPassword')}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Your Digital School ID</p>
                  <p className="text-xs text-muted-foreground">
                    A unique Nostr keypair will be generated automatically and encrypted with your password.
                    Your <strong>Public School ID</strong> identifies you in the network. Your <strong>Digital Signature Key</strong> can be exported later from your profile's Security tab.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-oklahoma hover:opacity-90 text-white font-semibold h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account & Digital ID...
                </span>
              ) : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
