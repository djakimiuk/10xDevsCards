import { useForm, type UseFormProps, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

interface UseAuthFormOptions<T extends FieldValues> {
  schema: z.ZodSchema;
  onSubmit: (data: T) => Promise<void>;
}

interface UseAuthFormReturn<T extends FieldValues> {
  form: ReturnType<typeof useForm<T>>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  handleSubmit: () => Promise<void>;
}

export function useAuthForm<T extends FieldValues>({ schema, onSubmit }: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = form.getValues();
      await onSubmit(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    success,
    handleSubmit,
  };
}
