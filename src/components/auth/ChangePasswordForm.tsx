import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FormField, FormError, FormSuccess } from "@/components/ui/form";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas/auth";
import { useAuthForm } from "@/hooks/useAuthForm";

interface ChangePasswordFormProps {
  onSubmit: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  isTemporaryPassword?: boolean;
}

export function ChangePasswordForm({ onSubmit, isTemporaryPassword = false }: ChangePasswordFormProps) {
  const { form, isLoading, error, success, handleSubmit } = useAuthForm<ChangePasswordFormData>({
    schema: changePasswordSchema,
    onSubmit: async (data) => {
      await onSubmit(data.currentPassword, data.newPassword, data.confirmPassword);
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>
          {isTemporaryPassword
            ? "Twoje hasło zostało tymczasowo zresetowane. Ustaw nowe hasło, aby kontynuować."
            : "Wprowadź aktualne hasło i ustaw nowe."}
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {!isTemporaryPassword && (
              <FormField
                name="currentPassword"
                label="Aktualne hasło"
                type="password"
                disabled={isLoading || success}
              />
            )}
            <FormField name="newPassword" label="Nowe hasło" type="password" disabled={isLoading || success} />
            <FormField
              name="confirmPassword"
              label="Potwierdź nowe hasło"
              type="password"
              disabled={isLoading || success}
            />

            {success && <FormSuccess message="Hasło zostało pomyślnie zmienione." />}

            {error && <FormError error={error} />}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zmiana hasła...
                </>
              ) : (
                "Zmień hasło"
              )}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
