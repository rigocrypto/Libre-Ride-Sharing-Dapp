/**
 * Verification Gate Component
 * Blocks access to protected features until identity is verified
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { track } from '@/lib/analytics';

interface VerificationGateProps {
  verified: boolean;
  children: React.ReactNode;
  requiredFor?: string; // "ride" | "drive" | "withdraw"
  userId?: string; // Optional: for mock verification in dev
  onVerifyClick?: () => void;
}

export function VerificationGate({ 
  verified, 
  children, 
  requiredFor = "this action",
  userId,
  onVerifyClick 
}: VerificationGateProps) {
  // Development bypass: Skip verification gate in dev mode if backend has SKIP_IDENTITY_CHECK=true
  // Since backend already bypasses, frontend should respect dev mode too
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const skipInDev = isDev; // Always skip in dev mode (backend handles the actual bypass)

  if (verified || skipInDev) {
    if (skipInDev && !verified) {
      console.log('[VerificationGate] Dev mode: Skipping identity verification (backend SKIP_IDENTITY_CHECK=true)');
    }
    return <>{children}</>;
  }

  const handleVerifyClick = async () => {
    track('verification_gate_clicked', { requiredFor });
    
    // In dev mode, try mock verification first
    if (isDev) {
      try {
        const targetUserId = userId || localStorage.getItem('libre_user_id');
        if (targetUserId) {
          // Get auth token
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
          
          if (token) {
            const res = await fetch('/api/identity/mock-verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId: targetUserId })
            });
            
            if (res.ok) {
              const data = await res.json();
              console.log('[VerificationGate] Mock verification completed:', data);
              track('verification_mock_completed', { userId: targetUserId });
              // Refresh page to update verification status
              window.location.reload();
              return;
            }
          }
        }
      } catch (error) {
        console.error('[VerificationGate] Mock verification failed:', error);
        // Fall through to normal verification flow
      }
    }
    
    if (onVerifyClick) {
      onVerifyClick();
    } else {
      // Navigate to verification page
      window.location.href = '/verify';
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <Card className="bg-yellow-500/10 border-yellow-500/30 p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-white">Verify Your Identity</h2>
        
        <p className="mb-6 opacity-80 text-white/90">
          To keep Libre safe and compliant, we need to verify your identity.
          <br />
          <span className="text-sm">It takes less than 2 minutes.</span>
        </p>

        <div className="space-y-3 mb-6 text-left bg-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-white/80">Government ID scan</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-white/80">Selfie photo</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-white/80">Liveness check (anti-spoof)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-center mb-6 text-xs text-white/60">
          <AlertCircle className="w-4 h-4" />
          <span>Required for: {requiredFor}</span>
        </div>

        <Button
          onClick={handleVerifyClick}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-8 py-6 text-lg font-bold"
          size="lg"
        >
          {isDev ? 'Mock Verify (Dev)' : 'Start Verification'} →
        </Button>

        <p className="mt-4 text-xs text-white/50">
          Your data is encrypted and never stored on our servers.
          <br />
          Powered by industry-leading verification providers.
        </p>
      </Card>
    </div>
  );
}

