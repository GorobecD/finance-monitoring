import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Data } from "./types";
import { loadData, saveData } from "./storage";
import { curMonth } from "./calc";

interface Store {
  data: Data;
  update: (fn: (d: Data) => void) => void;
  replace: (d: Data) => void;
  month: string;
  setMonth: (m: string) => void;
  saveState: "saved" | "saving" | "error";
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const [month, setMonth] = useState(curMonth());
  const [saveState, setSaveState] = useState<Store["saveState"]>("saved");
  const loaded = useRef(false);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!data || !loaded.current) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      saveData(data)
        .then(() => setSaveState("saved"))
        .catch((e) => {
          console.error(e);
          setSaveState("error");
        });
    }, 300);
    return () => clearTimeout(t);
  }, [data]);

  if (!data)
    return (
      <div className="boot">
        <div className="boot-text">ІНІЦІАЛІЗАЦІЯ…</div>
      </div>
    );

  const update = (fn: (d: Data) => void) =>
    setData((prev) => {
      const next = structuredClone(prev!);
      fn(next);
      return next;
    });

  return (
    <Ctx.Provider value={{ data, update, replace: setData, month, setMonth, saveState }}>{children}</Ctx.Provider>
  );
}

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("no store");
  return s;
};
