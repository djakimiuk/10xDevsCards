import { useFormContext, type FieldValues } from "react-hook-form";
import { Label } from "./label";
import { Input } from "./input";
import { Alert, AlertDescription } from "./alert";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}

export function FormField({ name, label, type = "text", ...props }: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FieldValues>();
  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...register(name)} {...props} />
      {error?.message && (
        <Alert variant="destructive">
          <AlertDescription>{error.message as string}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface FormErrorProps {
  error?: string;
}

export function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

interface FormSuccessProps {
  message?: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <Alert className="bg-green-50 text-green-700 border-green-200">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
