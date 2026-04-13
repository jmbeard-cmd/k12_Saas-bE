import { createContext } from 'react';
import type { UserAccount } from '@/lib/custodialKeys';

export interface CustodialAuthState {
  /** Currently logged-in account */
  account: UserAccount | null;
  /** Decrypted private key hex (session-only, never persisted) */
  privkeyHex: string | null;
  /** nsec bech32 (session-only) */
  nsec: string | null;
  /** Whether auth is being initialized */
  isLoading: boolean;
}

export interface CustodialAuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (input: import('@/lib/custodialKeys').RegisterInput) => Promise<void>;
  refreshAccount: () => void;
}

export type CustodialAuthContextType = CustodialAuthState & CustodialAuthActions;

export const CustodialAuthContext = createContext<CustodialAuthContextType | null>(null);
