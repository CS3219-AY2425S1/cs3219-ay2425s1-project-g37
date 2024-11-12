import { cn } from "./cn";
import { FormControl } from "./form-control";

export function Input({
  label,
  helpText,
  value,
  onValueChange,
  className,
  ...props
}: {
  label: string;
  helpText?: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
} & React.ComponentPropsWithoutRef<"input">) {
  return (
    <FormControl id={props.id} label={label} helpText={helpText}>
      <input
        {...props}
        className={cn(
          "border-main-800 bg-main-800 placeholder:text-main-600 focus-within:border-main-500 w-full rounded-none border px-4 py-2 outline-none",
          className,
        )}
        value={value}
        onChange={e => onValueChange(e.currentTarget.value)}
      />
    </FormControl>
  );
}

export function Textarea({
  label,
  helpText,
  value,
  onValueChange,
  className,
  ...props
}: {
  label?: string;
  helpText?: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
} & React.ComponentPropsWithoutRef<"textarea">) {
  const textarea = (
    <textarea
      {...props}
      className={cn(
        "border-main-800 bg-main-800 placeholder:text-main-600 focus-within:border-main-500 h-36 w-full rounded-none border px-4 py-2 outline-none",
        className,
      )}
      value={value}
      onChange={e => onValueChange(e.currentTarget.value)}
    />
  );
  if (!label) return textarea;
  return (
    <FormControl id={props.id} label={label} helpText={helpText}>
      {textarea}
    </FormControl>
  );
}
