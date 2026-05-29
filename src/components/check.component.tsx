type CheckProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
  error?: string;
  className?: string;
};

function CheckIcon() {
  return (
    <svg
      width="13"
      height="9"
      viewBox="0 0 13 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.1818 1L4.18182 8L1 4.81818"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Check({
  checked,
  onChange,
  children,
  error,
  className,
}: CheckProps) {
  return (
    <div className={`check${className ? ` ${className}` : ""}`}>
      <label className="check__label">
        <input
          type="checkbox"
          className="check__input"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="check__box">{checked && <CheckIcon />}</span>
        {children && <span className="check__text">{children}</span>}
      </label>
      {error && <span className="check__error">{error}</span>}
    </div>
  );
}
