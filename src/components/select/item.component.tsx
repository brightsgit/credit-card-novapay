import { useSelectContext } from "./select.context";

type SelectItemProps = {
  value: string;
  children: string;
};

export function SelectItem({ value, children }: SelectItemProps) {
  const { value: selectedValue, onSelect } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <li
      role="option"
      aria-selected={isSelected}
      className={`select__item${isSelected ? " select__item--selected" : ""}`}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => onSelect(value, children)}
    >
      {children}
    </li>
  );
}
