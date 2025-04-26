import { useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "@/lib/auth";
import { FormField, FormError, FormSuccess } from "@/components/ui/form";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/auth";
import { useAuthForm } from "@/hooks/useAuthForm";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";

export function ForgotPasswordForm() {
  const { form, isLoading, error, success, handleSubmit } = useAuthForm<ForgotPasswordFormData>({
    schema: forgotPasswordSchema,
    onSubmit: async (data) => {
      await sendPasswordResetEmail(data.email);
    },
  });

  // Handler dla eventu z tokenem resetującym
  const handleResetLink = useCallback(
    (payload: { email: string; token: string; message: string }) => {
      if (payload.email === form.getValues().email) {
        form.reset(); // Czyścimy formularz po udanym wysłaniu
      }
    },
    [form]
  );

  // Nasłuchuj na eventy z tokenem resetującym
  useSupabaseEvents("password_reset_link", handleResetLink);

  return (
    <div className="w-full max-w-md space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Reset hasła</h2>
        <p className="text-muted-foreground mt-2">Wprowadź swój adres email, a wyślemy Ci link do zresetowania hasła</p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 space-y-6">
          {success && <FormSuccess message="Link do resetowania hasła został wysłany na podany adres email." />}

          {error && <FormError error={error} />}

          <FormField
            name="email"
            label="Email"
            type="email"
            placeholder="twoj@email.com"
            disabled={isLoading || success}
          />

          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading || success} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Wysyłanie..." : "Wyślij link do resetowania"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Pamiętasz hasło?{" "}
              <a href="/auth/login" className="font-medium text-primary hover:underline">
                Wróć do logowania
              </a>
            </p>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
