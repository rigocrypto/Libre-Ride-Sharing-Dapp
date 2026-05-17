type DevUser = {
  firebaseUid: string;
  userId: string;
  email?: string | null;
  role?: string;
  walletAddress?: string | null;
  walletVerifiedAt?: Date | null;
  siweVerifiedAt?: Date | null;
};

const devTokens = new Map<string, DevUser>();

export function setDevToken(token: string, user: DevUser) {
  devTokens.set(token, user);
}

export function getDevUser(token: string): DevUser | undefined {
  return devTokens.get(token);
}

export function clearDevTokens() {
  devTokens.clear();
}
