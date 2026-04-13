import { useSeoMeta } from '@unhead/react';
import { Camera, Link2, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { GuardianMediaFeed } from '@/components/guardian/GuardianMediaFeed';

/**
 * Full-page Media Gallery for guardians.
 * Mirrors the be-parents-portal MediaGallery page, but enriched with
 * live Nostr data and NIP-52 assignment linking.
 */
export default function GuardianMediaPage() {
  useSeoMeta({ title: 'Media Gallery — Guardian Portal' });
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => navigate('/guardian-portal')}
            >
              <ArrowLeft className="h-4 w-4" />
              Guardian Portal
            </Button>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5 translate-x-1/4 translate-y-1/4 -z-10" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-5 w-5 text-blue-200" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Guardian Portal</Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">Media Gallery</h1>
              <p className="text-blue-200 text-sm">
                Photos &amp; videos from your children's school journey, linked to teacher assignments.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white">
                <Camera className="h-3.5 w-3.5 text-blue-200" />
                Nostr Media Events
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white">
                <Link2 className="h-3.5 w-3.5 text-green-300" />
                NIP-52 Assignment Links
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white">
                <BookOpen className="h-3.5 w-3.5 text-amber-200" />
                Academic Transparency
              </div>
            </div>
          </div>
        </div>

        {/* ── Full Media Feed ── */}
        <GuardianMediaFeed compact={false} />

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Media: Nostr kind:1 · Assignment links: NIP-52 kind:31922</span>
          <span>·</span>
          <span>Relay: <code className="font-mono text-primary">wss://beginningend.com</code></span>
          <span>·</span>
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Vibed with Shakespeare
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
