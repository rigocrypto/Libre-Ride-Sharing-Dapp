import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { WalletRouteFallback } from "@/components/WalletRouteFallback";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import Landing from "@/pages/Landing";
import BecomeDriver from "@/pages/BecomeDriver";
import Profile from "@/pages/Profile";
import Verify from "@/pages/Verify";
import FoundingAccess from "@/pages/FoundingAccess";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

const Rider = lazy(() => import("@/pages/Rider"));
const Driver = lazy(() => import("@/pages/Driver"));
const Admin = lazy(() => import("@/pages/Admin"));
const WalletProviders = lazy(() =>
  import("@/providers/WalletProviders").then((module) => ({
    default: module.WalletProviders,
  })),
);

function createWalletRoute(
  Page: LazyExoticComponent<ComponentType<object>>,
) {
  return function WalletRoutePage() {
    return (
      <Suspense fallback={<WalletRouteFallback />}>
        <WalletProviders>
          <Suspense fallback={<WalletRouteFallback />}>
            <Page />
          </Suspense>
        </WalletProviders>
      </Suspense>
    );
  };
}

const RiderRoute = createWalletRoute(Rider);
const DriverRoute = createWalletRoute(Driver);
const AdminRoute = createWalletRoute(Admin);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/rider" component={RiderRoute} />
      <Route path="/driver" component={DriverRoute} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/admin/:rest*" component={AdminRoute} />
      <Route path="/become-driver" component={BecomeDriver} />
      <Route path="/profile" component={Profile} />
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <WouterRouter base={routerBase}>
          <Router />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
