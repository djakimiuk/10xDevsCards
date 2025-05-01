import { useEffect, useState } from "react";
import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FormField, FormError } from "@/components/ui/form";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { useAuthForm } from "@/hooks/useAuthForm";
import { registerUser } from "@/lib/auth";

export function RegisterForm() {
  const [isRegistered, setIsRegistered] = useState(false);

  // Update document title when component mounts
  useEffect(() => {
    document.title = "Rejestracja - 10xDevsCards";
  }, []);

  // Handle navigation after successful registration
  useEffect(() => {
    if (isRegistered) {
      window.location.href = "/auth/login?registration=success";
    }
  }, [isRegistered]);

  const { form, isLoading, error, handleSubmit } = useAuthForm<RegisterFormData>({
    schema: registerSchema,
    onSubmit: async (data) => {
      await registerUser(data.email, data.password);
      setIsRegistered(true);
    },
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Rejestracja</CardTitle>
          <CardDescription>Utwórz nowe konto, aby rozpocząć naukę</CardDescription>
        </CardHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="p-6 pt-0 space-y-4">
              <FormField name="email" label="Email" type="email" placeholder="twoj@email.com" disabled={isLoading} />
              <FormField name="password" label="Hasło" type="password" disabled={isLoading} />
              <FormField name="confirmPassword" label="Potwierdź hasło" type="password" disabled={isLoading} />

              {error && <FormError error={error} />}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tworzenie konta...
                  </>
                ) : (
                  "Zarejestruj się"
                )}
              </Button>
              <div className="text-sm text-center">
                <a href="/auth/login" className="text-primary hover:underline">
                  Masz już konto? Zaloguj się
                </a>
              </div>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
