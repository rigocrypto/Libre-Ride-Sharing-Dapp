import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Web3Connect } from '@/components/Web3Connect';
import { EmailSignup } from '@/components/EmailSignup';
import UploadDocument from '@/components/UploadDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { track } from '@/lib/analytics';
import { CheckCircle2, ArrowRight, ArrowLeft, Car, FileText, User, Upload as UploadIcon } from 'lucide-react';
import { VerificationGate } from '@/components/VerificationGate';
import { useUserProfile } from '@/hooks/useUserProfile';

// Simplified 3-step flow: Profile → Vehicle → Submit
const STEPS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'vehicle', label: 'Vehicle', icon: Car },
  { id: 'submit', label: 'Submit', icon: FileText },
];

interface FormData {
  fullName: string;
  licenseNumber: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vinNumber: string;
  licensePlate: string;
}

export default function BecomeDriver() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  // Check for referral code in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      track('referral_code_detected', { code: ref });
      toast({
        title: 'Referral code detected!',
        description: 'You\'ll both earn $50 when you complete signup.',
      });
    }
  }, [toast]);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    licenseNumber: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vinNumber: '',
    licensePlate: '',
  });
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  const [signupStartTime] = useState(Date.now());
  
  // Get user profile and verification status
  const { profile, isVerified } = useUserProfile(userId || undefined);

  // Track driver onboarding start
  useEffect(() => {
    track('driver_onboarding_start', {
      referral_code: referralCode || null,
      verified: isVerified,
    });
  }, [referralCode, isVerified]);

  const attachWallet = async (addr: string) => {
    try {
      const res = await apiRequest('POST', '/api/users/attach-wallet', { address: addr });
      const data = await res.json();
      if (data.userId) {
        setUserId(data.userId);
        setAddress(addr);
        setIsConnected(true);
        track('wallet_connected', { method: 'wallet_connect' });
      }
    } catch (error) {
      console.error('Failed to attach wallet:', error);
      track('wallet_connect_error', { error: (error as Error).message });
    }
  };

  const createDriverMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      if (!userId) throw new Error('Please connect your wallet first');
      
      const res = await apiRequest('POST', '/api/drivers', {
        userId,
        licenseNumber: data.licenseNumber,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        vehicleYear: parseInt(data.vehicleYear || '0'),
        vehicleColor: data.vehicleColor,
        licensePlate: data.licensePlate,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.id) {
        setDriverId(data.id);
        toast({
          title: 'Profile created!',
          description: 'Your driver profile has been saved.',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create driver profile',
        variant: 'destructive',
      });
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      track('driver_step_complete', {
        step: currentStep + 1,
        step_name: STEPS[currentStep].label,
        time_elapsed: Date.now() - signupStartTime,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await createDriverMutation.mutateAsync(formData);
      
      // Claim referral bonus if referral code was used
      if (referralCode && userId) {
        try {
          const claimRes = await fetch('/api/referrals/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: referralCode, newUserId: userId })
          });
          if (claimRes.ok) {
            const claimData = await claimRes.json();
            track('referral_claim', {
              code: referralCode,
              referrer_id: claimData.referrerId,
              tx_hash: claimData.txHash || null,
            });
            
            if (claimData.txHash) {
              toast({
                title: 'Referral bonus claimed!',
                description: `$50 USDC sent to your referrer! Transaction: ${claimData.txHash.slice(0, 10)}...`,
              });
            } else {
              toast({
                title: 'Referral bonus claimed!',
                description: 'You and your referrer will both receive $50. Payment processing...',
              });
            }
          }
        } catch (refError) {
          console.error('Failed to claim referral:', refError);
          track('referral_claim_error', { code: referralCode, error: (refError as Error).message });
          // Don't block submission if referral claim fails
        }
      }
      
      // Track successful driver signup
      const totalTime = Date.now() - signupStartTime;
      track('driver_signup_complete', {
        total_steps: STEPS.length,
        total_time_ms: totalTime,
        referral_code: referralCode || null,
        has_documents: Object.keys(uploadedDocs).length > 0,
      });
      
      toast({
        title: 'Application submitted!',
        description: 'Your application is under review. You\'ll be notified once approved.',
      });
      
      setTimeout(() => {
        setLocation('/driver');
      }, 2000);
    } catch (error) {
      track('driver_signup_error', { error: (error as Error).message });
      console.error('Submission failed:', error);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUploaded = (docType: string, url: string) => {
    setUploadedDocs(prev => ({ ...prev, [docType]: url }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return isConnected && formData.fullName && formData.licenseNumber && formData.dateOfBirth;
      case 1: return formData.vehicleMake && formData.vehicleModel && formData.vehicleYear && formData.vinNumber;
      case 2: return uploadedDocs.licenseFront && uploadedDocs.insuranceUrl;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            🏎️ Libre
          </Link>
          <Link href="/driver">
            <Button variant="outline" className="border-white/20 text-white">
              Driver Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            Become a Libre Driver
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Keep 97% of every fare. Get paid instantly. Fully Florida-compliant.
          </p>

          {/* Eligibility Checklist */}
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            {[
              'Valid Florida Driver License',
              '4-Door Vehicle (≤15 years)',
              'Auto Insurance ($1M coverage)',
            ].map((req, i) => (
              <Card key={i} className="p-4 bg-white/10 backdrop-blur-md border-white/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">{req}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Progress Stepper - Simplified 3 Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isActive
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-white/10 border-white/20'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/40'}`} />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isActive ? 'text-white' : 'text-white/40'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20">
          {/* Step 1: Profile (Email Signup or Wallet + Personal Info) */}
          {currentStep === 0 && (
            <ProfileStep
              formData={formData}
              updateFormData={updateFormData}
              isConnected={isConnected}
              address={address}
              onConnect={(addr) => {
                attachWallet(addr);
              }}
              onEmailSignup={(addr, email) => {
                setAddress(addr);
                setIsConnected(true);
                if (email) updateFormData('email', email);
                attachWallet(addr);
              }}
              onNext={handleNext}
            />
          )}

          {/* Step 2: Vehicle */}
          {currentStep === 1 && (
            <VehicleStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {/* Step 3: Submit (Documents + Review Combined) */}
          {currentStep === 2 && (
            <SubmitStep
              driverId={driverId || userId || ''}
              uploadedDocs={uploadedDocs}
              onDocumentUploaded={handleDocumentUploaded}
              onSubmit={handleSubmit}
              onBack={handleBack}
              isSubmitting={createDriverMutation.isPending}
              address={address}
              isVerified={isVerified}
            />
          )}
        </Card>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-white/60">
          <p>
            Questions? Contact{' '}
            <a href="mailto:support@libre.ride" className="text-indigo-400 hover:underline">
              support@libre.ride
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 1: Profile (Email Signup or Wallet + Personal Info)
function ProfileStep({
  formData,
  updateFormData,
  isConnected,
  address,
  onConnect,
  onEmailSignup,
  onNext,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string) => void;
  isConnected: boolean;
  address?: string;
  onConnect: (addr: string) => void;
  onEmailSignup: (addr: string, email: string) => void;
  onNext: () => void;
}) {
  const [showEmailSignup, setShowEmailSignup] = useState(!isConnected);

  // If already connected, show personal info form
  if (isConnected && address) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
          <p className="text-white/70">
            Complete your profile information. This takes less than 60 seconds.
          </p>
        </div>

        <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-medium">Secure Identity: {address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Legal Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              placeholder="John Doe"
              className="bg-black/30 border-white/20 text-white mt-2"
            />
          </div>

          <div>
            <Label htmlFor="licenseNumber">Florida Driver License # *</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => updateFormData('licenseNumber', e.target.value)}
              placeholder="D123-456-78-901-0"
              className="bg-black/30 border-white/20 text-white mt-2"
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
              className="bg-black/30 border-white/20 text-white mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => updateFormData('phoneNumber', e.target.value)}
              placeholder="(407) 555-0123"
              className="bg-black/30 border-white/20 text-white mt-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="john@example.com"
              className="bg-black/30 border-white/20 text-white mt-2"
            />
          </div>
        </div>

        <Button
          onClick={onNext}
          disabled={!formData.fullName || !formData.licenseNumber || !formData.dateOfBirth}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          size="lg"
        >
          Next: Add Vehicle <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Show email signup first (AA flow) - preferred method
  if (showEmailSignup) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Create Your Account</h2>
          <p className="text-white/70">
            Sign up with your email. We'll create a secure wallet for you automatically - no crypto knowledge needed.
          </p>
        </div>

        <EmailSignup
          onSuccess={(addr, email) => {
            onEmailSignup(addr, email);
            setShowEmailSignup(false);
          }}
          title=""
          description=""
          buttonText="Create Account → Continue"
        />

        <div className="text-center">
          <button
            onClick={() => setShowEmailSignup(false)}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            Already have a wallet? Connect instead
          </button>
        </div>
      </div>
    );
  }

  // Show wallet connect option (for existing crypto users)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
        <p className="text-white/70">
          Connect your wallet or sign up with email. This takes less than 60 seconds.
        </p>
      </div>

      {/* Wallet Connect (Inline) */}
      <div className="p-4 bg-black/30 rounded-xl border border-white/20">
        <Label className="mb-2 block">Secure Identity</Label>
        {!isConnected ? (
          <div>
            <Web3Connect onConnect={onConnect} />
            <p className="text-xs text-white/60 mt-2">
              Connect securely for instant payouts. No crypto knowledge needed - we handle everything.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-medium">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Legal Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            placeholder="John Doe"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="licenseNumber">Florida Driver License # *</Label>
          <Input
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => updateFormData('licenseNumber', e.target.value)}
            placeholder="D123-456-78-901-0"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData('phoneNumber', e.target.value)}
            placeholder="(407) 555-0123"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="john@example.com"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isConnected || !formData.fullName || !formData.licenseNumber || !formData.dateOfBirth}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
        size="lg"
      >
        Next: Add Vehicle <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// Step 2: Vehicle
function VehicleStep({
  formData,
  updateFormData,
  onNext,
  onBack,
}: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Your Vehicle</h2>
        <p className="text-white/70">
          Your vehicle must be a 4-door, less than 15 years old, and meet Florida TNC requirements.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicleMake">Make *</Label>
          <Input
            id="vehicleMake"
            value={formData.vehicleMake}
            onChange={(e) => updateFormData('vehicleMake', e.target.value)}
            placeholder="Toyota"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="vehicleModel">Model *</Label>
          <Input
            id="vehicleModel"
            value={formData.vehicleModel}
            onChange={(e) => updateFormData('vehicleModel', e.target.value)}
            placeholder="Camry"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="vehicleYear">Year *</Label>
          <select
            id="vehicleYear"
            value={formData.vehicleYear}
            onChange={(e) => updateFormData('vehicleYear', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/20 text-white focus:ring-2 focus:ring-indigo-400 outline-none mt-2"
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="vehicleColor">Color</Label>
          <Input
            id="vehicleColor"
            value={formData.vehicleColor}
            onChange={(e) => updateFormData('vehicleColor', e.target.value)}
            placeholder="Black"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="vinNumber">VIN Number *</Label>
          <Input
            id="vinNumber"
            value={formData.vinNumber}
            onChange={(e) => updateFormData('vinNumber', e.target.value)}
            placeholder="1HGBH41JXMN109186"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>

        <div>
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input
            id="licensePlate"
            value={formData.licensePlate}
            onChange={(e) => updateFormData('licensePlate', e.target.value)}
            placeholder="ABC-123"
            className="bg-black/30 border-white/20 text-white mt-2"
          />
        </div>
      </div>

      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex gap-2">
          <div className="text-sm text-white/80">
            <strong>Vehicle Requirements:</strong> Must be 4-door, less than 15 years old, and pass inspection.
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="flex-1 border-white/20 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!formData.vehicleMake || !formData.vehicleModel || !formData.vehicleYear || !formData.vinNumber}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500"
        >
          Submit Documents <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Submit (Documents + Review Combined)
function SubmitStep({
  driverId,
  uploadedDocs,
  onDocumentUploaded,
  onSubmit,
  onBack,
  isSubmitting,
  address,
  isVerified,
}: {
  driverId: string;
  uploadedDocs: Record<string, string>;
  onDocumentUploaded: (docType: string, url: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  address?: string;
  isVerified?: boolean;
}) {
  const documents = [
    {
      id: 'licenseFront',
      label: 'Driver License (Front)',
      endpoint: '/api/upload/license',
      photoType: 'license_front',
      required: true,
    },
    {
      id: 'licenseBack',
      label: 'Driver License (Back)',
      endpoint: '/api/upload/license',
      photoType: 'license_back',
      required: false,
    },
    {
      id: 'insuranceUrl',
      label: 'Insurance Document',
      endpoint: '/api/insurance/document',
      required: true,
    },
  ];

  const hasRequiredDocs = uploadedDocs.licenseFront && uploadedDocs.insuranceUrl;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-green-400">📤 Upload & Submit</h2>
        <p className="text-white/70">
          Upload required documents. We'll review your application in 24-48 hours.
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-6 bg-black/30 border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Label className="text-base font-semibold">
                  {doc.label} {doc.required && <span className="text-red-400">*</span>}
                </Label>
                <p className="text-sm text-white/60 mt-1">
                  {doc.id === 'licenseFront' && 'Clear photo of the front of your Florida driver license'}
                  {doc.id === 'licenseBack' && 'Clear photo of the back of your Florida driver license'}
                  {doc.id === 'insuranceUrl' && 'Current insurance policy document ($1M coverage required)'}
                </p>
              </div>
              {uploadedDocs[doc.id] && (
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
              )}
            </div>
            
            {!uploadedDocs[doc.id] ? (
              <UploadDocument
                endpoint={doc.endpoint}
                entityIdKey="driverId"
                entityId={driverId}
                label=""
                photoType={doc.photoType}
                onUploaded={(url) => onDocumentUploaded(doc.id, url)}
              />
            ) : (
              <div className="p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Document uploaded successfully</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {address && (
        <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
          <p className="text-sm text-white/80">
            <strong>Your wallet:</strong> {address.slice(0, 6)}...{address.slice(-4)}
            <br />
            <span className="text-xs">Earnings will be sent here instantly after each ride.</span>
          </p>
        </div>
      )}

      <div className="p-6 bg-green-500/10 border border-green-400/30 rounded-xl">
        <h4 className="font-bold mb-2">What happens next?</h4>
        <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
          <li>Your application will be reviewed for Florida TNC compliance</li>
          <li>Background check and document verification (24-48 hours)</li>
          <li>You'll receive an email notification once approved</li>
          <li>Then you can start accepting rides and earning instantly!</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="outline" className="flex-1 border-white/20 text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <VerificationGate 
          verified={!!isVerified}
          requiredFor="becoming a driver"
        >
          <Button
            onClick={onSubmit}
            disabled={!hasRequiredDocs || isSubmitting}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application → Start Earning'}
          </Button>
        </VerificationGate>
      </div>
    </div>
  );
}
