import { createContext, useContext, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import type { Servant } from "../data/types";
import servants from "../data/servants";

interface ServantDataContextType {
  servants: Servant[];
  loading: boolean;
  byId: Map<number, Servant>;
}

const byIdMap = new Map<number, Servant>(servants.map((s) => [s.id, s]));

const ServantDataContext = createContext<ServantDataContextType>({
  servants,
  loading: false,
  byId: byIdMap,
});

export function useServantData() {
  return useContext(ServantDataContext);
}

/** IDからサーヴァントを引き直す */
export function useServantResolver() {
  const { byId } = useServantData();
  return useCallback((s: Servant): Servant => byId.get(s.id) ?? s, [byId]);
}

export function ServantDataProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ servants, loading: false, byId: byIdMap }), []);
  return <ServantDataContext.Provider value={value}>{children}</ServantDataContext.Provider>;
}
