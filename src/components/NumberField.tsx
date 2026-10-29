type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  help?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  help,
  unit,
  min,
  max,
  step = 1,
}: NumberFieldProps) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-shell">
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          inputMode="decimal"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
      {error ? (
        <span className="field-message field-message--error" id={`${id}-error`}>
          {error}
        </span>
      ) : help ? (
        <span className="field-message" id={`${id}-help`}>
          {help}
        </span>
      ) : null}
    </div>
  );
}
