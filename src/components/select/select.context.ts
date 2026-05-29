import { createContext, useContext } from "react";

export type SelectContextValue = {
  value: string;
  selectedLabel: string;
  onSelect: (value: string, label: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  listboxId: string;
  error?: string;
  disabled?: boolean;
};

export const SelectContext = createContext<SelectContextValue | null>(null);

export function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx)
    throw new Error("Select compound components must be used within <Select>");
  return ctx;
}
