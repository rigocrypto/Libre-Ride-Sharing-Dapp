import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/waitlist", { email, userType: "rider" });
    },
    onSuccess: () => {
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Libre launches in Orlando.",
      });
      setEmail("");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      mutation.mutate(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pl-10 bg-white/5 backdrop-blur-lg border-white/10 focus:border-accent h-12"
          data-testid="input-waitlist-email"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        className="bg-neon-pink hover:bg-neon-pink/90 text-white font-semibold px-8 h-12"
        data-testid="button-waitlist-submit"
      >
        {mutation.isPending ? "Joining..." : "Join Waitlist"}
      </Button>
    </form>
  );
}
