import React from "react";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/lib/wallet/useWallet";

interface Web3ConnectProps {
  onConnect?: (address: string) => void;
}

export function Web3Connect({ onConnect }: Web3ConnectProps) {
  const { address, isConnected } = useWallet();

  // Call onConnect callback when wallet connects
  React.useEffect(() => {
    if (isConnected && address) {
      onConnect?.(address);
    }
  }, [isConnected, address, onConnect]);

  if (isConnected && address) {
    return (
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          return (
            <div
              {...(!mounted && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!mounted || !account || !chain) {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openConnectModal}
                      className="gap-2 border-accent text-accent"
                      data-testid="button-connect-wallet"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </Button>
                  );
                }

                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openAccountModal}
                    className="gap-2 border-accent text-accent"
                    data-testid="button-connected-wallet"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {account.displayName}
                  </Button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={openConnectModal}
          className="gap-2 border-accent text-accent"
          data-testid="button-connect-wallet"
          {...(!mounted && {
            "aria-hidden": true,
            style: { opacity: 0, pointerEvents: "none" },
          })}
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      )}
    </ConnectButton.Custom>
  );
}

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-accent text-accent"
        data-testid="button-connect-wallet"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Connect to Libre</DialogTitle>
            <DialogDescription>
              Choose your preferred connection method. All connections are secured on Base network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Card
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => handleConnect("wallet")}
              data-testid="button-wallet-metamask"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Crypto Wallet</h3>
                  <p className="text-sm text-muted-foreground">MetaMask, Coinbase Wallet, etc.</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => handleConnect("email")}
              data-testid="button-wallet-email"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-teal to-neon-purple flex items-center justify-center text-white text-xl font-bold">
                  @
                </div>
                <div>
                  <h3 className="font-semibold">Email (Account Abstraction)</h3>
                  <p className="text-sm text-muted-foreground">No wallet needed - we'll create one for you</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => handleConnect("google")}
              data-testid="button-wallet-google"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl">
                  G
                </div>
                <div>
                  <h3 className="font-semibold">Continue with Google</h3>
                  <p className="text-sm text-muted-foreground">One-click social login with AA wallet</p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => handleConnect("apple")}
              data-testid="button-wallet-apple"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white text-2xl">
                  
                </div>
                <div>
                  <h3 className="font-semibold">Continue with Apple</h3>
                  <p className="text-sm text-muted-foreground">Secure Apple Sign In with AA wallet</p>
                </div>
              </div>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By connecting, you agree to Libre's Terms of Service and Privacy Policy.
            All wallets are non-custodial and secured on Base network.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
