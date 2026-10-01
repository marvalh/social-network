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
  send: (data: unknown) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Set<SocketListener>>(new Set());
  const connectionRef = useRef<{ send: (data: unknown) => void } | null>(null);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      connectionRef.current = null;
      return;
    }

    const connection = connectSocket((data) => {
      listenersRef.current.forEach((listener) => listener(data));
    }, setConnected);

    connectionRef.current = connection;

    return () => {
      connection.disconnect();
      connectionRef.current = null;
    };
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

  const send = useMemo(() => (data: unknown) => connectionRef.current?.send(data), []);

  const value = useMemo(() => ({ connected, subscribe, send }), [connected, subscribe, send]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return ctx;
}