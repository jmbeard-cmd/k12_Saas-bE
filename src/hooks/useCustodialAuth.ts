import { useContext } from 'react';
import { CustodialAuthContext, type CustodialAuthContextType } from '@/contexts/CustodialAuthContext';

export function useCustodialAuth(): CustodialAuthContextType {
  const ctx = useContext(CustodialAuthContext);
  if (!ctx) {
    throw new Error('useCustodialAuth must be used inside CustodialAuthProvider');
  }
  return ctx;
}
