/**
 * Social Login Buttons Component
 * Google/Apple login with Firebase Auth
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSocialAuth } from '@/lib/firebase/useSocialAuth';
import { Chrome, Apple } from 'lucide-react';
import { track } from '@/lib/analytics';

interface SocialLoginProps {
  onSuccess?: (address: string) => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  context?: 'landing' | 'rider' | 'driver';
}

export function SocialLogin({ onSuccess, variant = 'outline', size = 'default', context = 'rider' }: SocialLoginProps) {
  const { loginWithGoogle, loginWithApple, isLoading } = useSocialAuth();

  const handleGoogle = async () => {
    track('landing_social_login_click', { provider: 'google', context });
    const address = await loginWithGoogle();
    if (address && onSuccess) {
      onSuccess(address);
    }
  };

  const handleApple = async () => {
    track('landing_social_login_click', { provider: 'apple', context });
    const address = await loginWithApple();
    if (address && onSuccess) {
      onSuccess(address);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleGoogle}
        disabled={isLoading}
        className="w-full"
      >
        <Chrome className="w-4 h-4 mr-2" />
        Continue with Google
      </Button>
      
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleApple}
        disabled={isLoading}
        className="w-full bg-black text-white hover:bg-gray-800"
      >
        <Apple className="w-4 h-4 mr-2" />
        Continue with Apple
      </Button>
    </div>
  );
}

