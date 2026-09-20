'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './Auth';
import { connectSocket } from '@/src/services/socket';

type SocketListener = (data: unknown) => void;

interface SocketContextValue {
  connected: boolean;
  subscribe: (listener: SocketListener) => () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Set<SocketListener>>(new Set());

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }

    const disconnect = connectSocket((data) => {
      listenersRef.current.forEach((listener) => listener(data));
    }, setConnected);

    return disconnect;
  }, [user]);

  const subscribe = useMemo(
    () => (listener: SocketListener) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    []
  );

  const value = useMemo(() => ({ connected, subscribe }), [connected, subscribe]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}