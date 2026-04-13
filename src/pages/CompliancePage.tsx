import { useSeoMeta } from '@unhead/react';
import { Shield } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ComplianceTab } from '@/components/guardian/GuardianCompliance';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';

export default function CompliancePage() {
  useSeoMeta({ title: 'Compliance & Consent — Oklahoma K-12 Connect' });
  const { account } = useCustodialAuth();
  const studentName = 'Elijah'; // TODO: pass via route param or student selector

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="oklahoma-gradient rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-white/90" />
            <div>
              <h1 className="text-2xl font-bold">Compliance &amp; Consent</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                FERPA · Media Release · OK ICAP — all signed with your Nostr key
              </p>
            </div>
          </div>
        </div>

        <ComplianceTab studentName={studentName} />
      </div>
    </AppLayout>
  );
}
