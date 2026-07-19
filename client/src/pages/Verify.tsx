/**
 * Identity Verification Page
 * Redirects to Persona/Stripe Identity verification flow
 */

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import { resolveApiUrl } from '@/lib/queryClient';

export default function Verify() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    track('verification_page_viewed');
  }, []);

  const startVerification = async () => {
    setIsLoading(true);
    track('verification_start_clicked');

    // Get userId from localStorage (stored after login)
    const userId = localStorage.getItem('libre_user_id');
    if (!userId) {
      toast({
        title: 'Not logged in',
        description: 'Please log in first to verify your identity',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(resolveApiUrl('/api/identity/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to start verification');
      }

      const data = await res.json();
      
      if (data.verificationUrl) {
        track('verification_redirect', { provider: data.provider || 'persona' });
        // Redirect to Persona/Stripe Identity
        window.location.href = data.verificationUrl;
      } else {
        throw new Error('No verification URL provided');
      }
    } catch (error: any) {
      console.error('[Verify] Failed to start verification:', error);
      track('verification_start_failed', { error: error.message });
      
      toast({
        title: 'Verification failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
      
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white flex items-center justify-center px-6 py-20">
        <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-md border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-4xl font-black mb-4">Verify Your Identity</h1>
            <p className="text-xl text-white/80">
              Keep Libre safe and compliant. Takes less than 2 minutes.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Government ID Scan</h3>
                <p className="text-sm text-white/70">Driver's license, passport, or state ID</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Selfie Photo</h3>
                <p className="text-sm text-white/70">Quick photo to match your ID</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Liveness Check</h3>
                <p className="text-sm text-white/70">Short video to prevent fraud</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8">
            <p className="text-sm text-white/90">
              <strong>🔒 Your Privacy:</strong> We never store your ID photos or biometric data.
              Verification is handled by industry-leading providers (Persona/Stripe).
            </p>
          </div>

          <Button
            onClick={startVerification}
            disabled={isLoading}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting verification...
              </>
            ) : (
              'Start Verification →'
            )}
          </Button>

          <p className="text-center text-sm text-white/60 mt-6">
            Required for: Requesting rides, Driving, Withdrawing rewards
          </p>
        </Card>
      </div>
    </Layout>
  );
}

