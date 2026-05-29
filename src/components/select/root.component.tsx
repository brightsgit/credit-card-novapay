import { useEffect, useId, useRef, useState } from "react";
import { SelectContext, type SelectContextValue } from "./select.context";

type SelectProps = Pick<SelectContextValue, "value" | "error" | "disabled"> & {
  onValueChange: (value: string) => void;
  children: React.ReactNode;
};

export function Select({
  value,
  onValueChange,
  children,
  error,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const triggerId = `select-trigger-${id}`;
  const listboxId = `select-listbox-${id}`;

  const onSelect = (newValue: string, label: string) => {
    onValueChange(newValue);
    setSelectedLabel(label);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const root = rootRef.current?.getRootNode() ?? document;
    root.addEventListener("pointerdown", handlePointerDown as EventListener);
    return () =>
      root.removeEventListener(
        "pointerdown",
        handlePointerDown as EventListener,
      );
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value,
        selectedLabel,
        onSelect,
        open,
        setOpen,
        triggerId,
        listboxId,
        error,
        disabled,
      }}
    >
      <div ref={rootRef} className="select">
        <div className="select__wrapper">{children}</div>
        <span className="select__error">{error}</span>
      </div>
    </SelectContext.Provider>
  );
}
