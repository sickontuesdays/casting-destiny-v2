import { useState, useEffect } from 'react';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = () => {
    window.location.href = '/api/auth/bungie-login';
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/bungie-logout', { method: 'POST' });
      setSession(null);
      window.location.reload();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return {
    session,
    loading,
    signIn,
    signOut,
  };
};
