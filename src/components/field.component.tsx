type FieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> & {
  onChange: (value: string) => void;
  error?: string;
};

export function Field({ error, onChange, name, ...props }: FieldProps) {
  return (
    <div className="field">
      <input
        id={name}
        name={name}
        onChange={(e) => onChange(e.target.value)}
        className={`field__input${error ? " field__input--error" : ""}`}
        {...props}
      />
      {<span className="field__error">{error}</span>}
    </div>
  );
}
