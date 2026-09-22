import type { PropsWithChildren } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { archiveCompra, createCompra, listCompras, updateCompra } from '../database/repositories/comprasRepository';
import type { CompraMSI, NuevaCompraMSI } from '../features/compras/types';

type AppContextValue = {
  compras: CompraMSI[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (input: NuevaCompraMSI) => Promise<void>;
  update: (id: number, input: NuevaCompraMSI) => Promise<void>;
  archive: (id: number) => Promise<void>;
};

import { createContext, useContext } from 'react';

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const [compras, setCompras] = useState<CompraMSI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCompras(await listCompras(database));
    } catch {
      setError('No se pudieron cargar las compras.');
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(async (input: NuevaCompraMSI) => {
    await createCompra(database, input);
    await refresh();
  }, [database, refresh]);

  const update = useCallback(async (id: number, input: NuevaCompraMSI) => {
    await updateCompra(database, id, input);
    await refresh();
  }, [database, refresh]);

  const archive = useCallback(async (id: number) => {
    await archiveCompra(database, id);
    await refresh();
  }, [database, refresh]);

  const value = useMemo(
    () => ({ compras, isLoading, error, refresh, add, update, archive }),
    [compras, isLoading, error, refresh, add, update, archive]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider.');
  }
  return context;
}
