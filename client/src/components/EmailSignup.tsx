import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { resolveApiUrl } from '@/lib/queryClient';
import { track } from '@/lib/analytics';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

interface EmailSignupProps {
  onSuccess: (address: string, email: string) => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export function EmailSignup({ 
  onSuccess, 
  title = "Create Your Libre Account",
  description = "Sign up with your email. We'll create a secure wallet for you automatically.",
  buttonText = "Create Account → Instant Wallet"
}: EmailSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      track('aa_signup_start', { email_provided: true });
      
      // Make request directly to get better error handling
      const res = await fetch(resolveApiUrl('/api/auth/aa-signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      
      let errorData: any = null;
      if (!res.ok) {
        try {
          errorData = await res.json();
        } catch {
          errorData = { error: `Signup failed: ${res.status} ${res.statusText}` };
        }
        throw new Error(errorData.error || errorData.message || `Signup failed: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.address) {
        const signupTime = Date.now() - startTime;
        track('aa_signup_success', {
          email_provided: true,
          signup_time_ms: signupTime,
          referral_claimed: data.referralClaimed || false,
        });
        
        toast({
          title: 'Account created!',
          description: 'Your secure wallet has been created. You can now start earning.',
        });
        onSuccess(data.address, email);
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('[EmailSignup] Signup error:', error);
      toast({
        title: 'Signup failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-white/70">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-white/80">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="bg-black/30 border-white/20 text-white mt-2"
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating your account...
            </>
          ) : (
            buttonText
          )}
        </Button>

        <p className="text-xs text-white/60 text-center mt-4">
          By signing up, you agree to Libre's Terms of Service and Privacy Policy.
          Your wallet is created automatically - no crypto knowledge needed.
        </p>
      </form>
    </Card>
  );
}

