import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { GraduationCap, Shield, Users, BookOpen, Bell, ArrowRight, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OklahomaLogo } from '@/components/OklahomaLogo';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';

const FEATURES = [
  {
    icon: Shield,
    title: 'Custodial Digital ID',
    desc: 'Every account gets a Nostr keypair automatically. Your Public School ID and encrypted Digital Signature Key are generated on signup.',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: GraduationCap,
    title: 'K-12 Class Management',
    desc: 'View classes, track assignments, check grades, and stay on top of deadlines in one unified dashboard.',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    icon: Users,
    title: 'Family & Staff Portal',
    desc: 'Parents, teachers, students, and admins each have role-specific views with appropriate access levels.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: Bell,
    title: 'Announcements & Alerts',
    desc: 'Real-time school announcements, event notifications, and urgent alerts broadcast through Nostr.',
    color: 'text-amber-600 bg-amber-100',
  },
  {
    icon: BookOpen,
    title: 'Secure Key Recovery',
    desc: 'Admins can assist locked-out parents or students with an audited key recovery workflow—no data loss.',
    color: 'text-red-600 bg-red-100',
  },
  {
    icon: Star,
    title: 'Privacy First',
    desc: 'Built on Nostr protocol. Your identity is cryptographic, not corporate. Connect to wss://beginningend.com.',
    color: 'text-indigo-600 bg-indigo-100',
  },
];

const TESTIMONIALS = [
  { name: 'Maria T.', role: 'Parent', text: 'Finally a school platform that doesn\'t require another Big Tech account. The digital ID is brilliant.' },
  { name: 'Coach Davis', role: 'PE Teacher', text: 'Announcements reach parents instantly. Our Athletic Department loves how easy it is to post updates.' },
  { name: 'Jaylen, 10th Grade', role: 'Student', text: 'My dashboard shows everything — assignments, grades, and my own cryptographic school ID. Super cool.' },
];

export default function Index() {
  useSeoMeta({
    title: 'Oklahoma K-12 Connect — Secure Education Platform',
    description: 'A secure, privacy-first educational platform for Oklahoma K-12 schools built on Nostr protocol.',
  });

  const { account, isLoading } = useCustodialAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && account) {
      navigate('/dashboard');
    }
  }, [account, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <OklahomaLogo variant="color" size="sm" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-oklahoma hover:opacity-90 text-white">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative oklahoma-gradient overflow-hidden isolate">
        <div className="hero-pattern absolute inset-0 -z-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/5 translate-x-1/3 -translate-y-1/3 -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent/10 -translate-x-1/2 translate-y-1/2 -z-10" />

        <div className="container py-20 lg:py-28 text-center text-white">
          <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm px-4 py-1.5 backdrop-blur-sm">
            🎓 Built for Oklahoma Schools
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Oklahoma K-12<br />
            <span className="text-accent">Connect</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            The secure, privacy-first educational platform connecting Oklahoma students, parents, and educators through Nostr cryptography.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-2 w-full sm:w-auto shadow-lg shadow-accent/25">
                <GraduationCap className="h-5 w-5" />
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 w-full sm:w-auto gap-2">
                Sign In
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mt-14">
            {[
              { value: '500+', label: 'Schools' },
              { value: '50K+', label: 'Students' },
              { value: 'Nostr', label: 'Powered' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-accent">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3">Features</Badge>
          <h2 className="text-3xl font-bold mb-3">Everything your school needs</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Built on open standards with privacy at its core. Your data, your keys, your school.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">How It Works</Badge>
            <h2 className="text-3xl font-bold mb-3">Your Digital School ID</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Based on Nostr cryptography — secure, portable, and privately managed.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your account with email and password. A Nostr keypair is generated automatically in the background.' },
              { step: '02', title: 'Your Digital ID', desc: 'Your Public School ID (npub) identifies you on the network. Your private key is encrypted and safely stored.' },
              { step: '03', title: 'Export Anytime', desc: 'From your Profile Security tab, you can reveal and export your Digital Signature Key to use with any Nostr client.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-oklahoma text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3">Community</Badge>
          <h2 className="text-3xl font-bold">Loved by Oklahoma educators</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 oklahoma-gradient isolate relative overflow-hidden">
        <div className="hero-pattern absolute inset-0 -z-10" />
        <div className="container text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to connect your school?</h2>
          <p className="text-blue-200 mb-8 max-w-lg mx-auto">Join thousands of Oklahoma families and educators already using the secure, Nostr-powered platform.</p>
          <Link to="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold gap-2">
              <GraduationCap className="h-5 w-5" />
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/30">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <OklahomaLogo variant="color" size="sm" />
          <p>
            © 2026 Oklahoma K-12 Connect •{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
              Vibed with Shakespeare
            </a>
          </p>
          <p className="text-xs">Connected to <code className="font-mono text-primary">wss://beginningend.com</code></p>
        </div>
      </footer>
    </div>
  );
}
