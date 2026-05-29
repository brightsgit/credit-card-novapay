import { useSelectContext } from "./select.context";

type SelectContentProps = {
  children: React.ReactNode;
};

export function SelectContent({ children }: SelectContentProps) {
  const { open, listboxId, triggerId } = useSelectContext();

  if (!open) return null;

  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-labelledby={triggerId}
      className="select__content"
    >
      {children}
    </ul>
  );
}
