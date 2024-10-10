export function FormControl({
  id,
  label,
  helpText,
  children,
}: {
  id?: string;
  label: React.ReactNode;
  helpText?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
      {helpText ? <div className="text-main-400 text-sm">{helpText}</div> : null}
    </label>
  );
}
