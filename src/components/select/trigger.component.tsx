import { useSelectContext } from "./select.context";

type SelectTriggerProps = {
  placeholder?: string;
};

export function SelectTrigger({ placeholder }: SelectTriggerProps) {
  const {
    selectedLabel,
    open,
    setOpen,
    triggerId,
    listboxId,
    error,
    disabled,
  } = useSelectContext();

  return (
    <button
      id={triggerId}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-haspopup="listbox"
      className={`select__trigger${open ? " select__trigger--open" : ""}${error ? " select__trigger--error" : ""}${!selectedLabel ? " select__trigger--placeholder" : ""}${disabled ? " select__trigger--disabled" : ""}`}
      disabled={disabled}
      onClick={() => setOpen(!open)}
    >
      <span className="select__trigger-text">
        {selectedLabel || placeholder}
      </span>
      <span
        className={`select__chevron${open ? " select__chevron--open" : ""}`}
        aria-hidden
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
