import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { loginUser } from "@/lib/auth";
import { FormField, FormError, FormSuccess } from "@/components/ui/form";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { useAuthForm } from "@/hooks/useAuthForm";

export function LoginForm() {
  const { form, isLoading, error, success, handleSubmit } = useAuthForm<LoginFormData>({
    schema: loginSchema,
    onSubmit: async (data) => {
      await loginUser(data.email, data.password);
    },
  });

  return (
    <div className="w-full max-w-md space-y-8" data-test-id="login-form-container">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Zaloguj się do aplikacji</h2>
        <p className="text-muted-foreground mt-2">Wprowadź swoje dane aby się zalogować</p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 space-y-6" data-test-id="login-form">
          {success && <FormSuccess message="Zalogowano pomyślnie." />}

          {error && <FormError error={error} />}

          <div className="space-y-4">
            <FormField
              name="email"
              label="Email"
              type="email"
              placeholder="twoj@email.com"
              disabled={isLoading}
              data-test-id="login-email-input"
            />

            <FormField
              name="password"
              label="Hasło"
              type="password"
              disabled={isLoading}
              data-test-id="login-password-input"
            />
          </div>

          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading} className="w-full" data-test-id="login-submit-button">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </Button>

            <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <a
                href="/auth/forgot-password"
                className="font-medium text-primary hover:underline"
                data-test-id="forgot-password-link"
              >
                Zapomniałeś hasła?
              </a>
              <p>
                Nie masz jeszcze konta?{" "}
                <a
                  href="/auth/register"
                  className="font-medium text-primary hover:underline"
                  data-test-id="register-link"
                >
                  Zarejestruj się
                </a>
              </p>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
