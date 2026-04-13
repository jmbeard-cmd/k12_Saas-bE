import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useNostrLogin } from '@nostrify/react/login';
import {
  loginUser,
  logoutUser,
  registerUser,
  getSession,
  getAccount,
  type RegisterInput,
  type UserAccount,
} from '@/lib/custodialKeys';
import { CustodialAuthContext } from '@/contexts/CustodialAuthContext';

interface CustodialAuthProviderProps {
  children: ReactNode;
}

export function CustodialAuthProvider({ children }: CustodialAuthProviderProps) {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [privkeyHex, setPrivkeyHex] = useState<string | null>(null);
  const [nsec, setNsec] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { addLogin } = useNostrLogin();

  // Restore session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const acct = getAccount(session.email);
      if (acct) {
        setAccount(acct);
        setPrivkeyHex(session.privkeyHex);
        setNsec(session.nsec);
        // Re-inject into Nostrify login system
        addLogin({ type: 'nsec', nsec: session.nsec });
      }
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser(email, password);
    setAccount(result.account);
    setPrivkeyHex(result.privkeyHex);
    setNsec(result.nsec);
    // Inject into Nostrify login so all Nostr hooks work seamlessly
    addLogin({ type: 'nsec', nsec: result.nsec });
  }, [addLogin]);

  const logout = useCallback(() => {
    logoutUser();
    setAccount(null);
    setPrivkeyHex(null);
    setNsec(null);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const newAccount = await registerUser(input);
    // Auto-login after registration
    const result = await loginUser(input.email, input.password);
    setAccount(result.account);
    setPrivkeyHex(result.privkeyHex);
    setNsec(result.nsec);
    addLogin({ type: 'nsec', nsec: result.nsec });
    void newAccount;
  }, [addLogin]);

  const refreshAccount = useCallback(() => {
    if (account) {
      const fresh = getAccount(account.email);
      if (fresh) setAccount(fresh);
    }
  }, [account]);

  return (
    <CustodialAuthContext.Provider value={{
      account,
      privkeyHex,
      nsec,
      isLoading,
      login,
      logout,
      register,
      refreshAccount,
    }}>
      {children}
    </CustodialAuthContext.Provider>
  );
}
