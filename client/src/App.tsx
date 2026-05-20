import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./lib/web3/config";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/Landing";
import Rider from "@/pages/Rider";
import Driver from "@/pages/Driver";
import BecomeDriver from "@/pages/BecomeDriver";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Verify from "@/pages/Verify";
import FoundingAccess from "@/pages/FoundingAccess";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/rider" component={Rider} />
      <Route path="/driver" component={Driver} />
      <Route path="/become-driver" component={BecomeDriver} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/verify" component={Verify} />
      <Route path="/founding-access" component={FoundingAccess} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const routerBase =
    import.meta.env.BASE_URL === "/" ? "" : import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TooltipProvider>
            <Toaster />
            <WouterRouter base={routerBase}>
              <Router />
            </WouterRouter>
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
