import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { updateUserPassword as resetPasswordFunction } from "@/lib/auth";
import { logger } from "@/lib/logger";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    logger.info("ResetPasswordForm mounted, Supabase client should handle token from URL hash if present.");
  }, []);

  const validateForm = () => {
    if (!password) {
      setValidationError("Hasło jest wymagane");
      return false;
    }
    if (!confirmPassword) {
      setValidationError("Proszę potwierdzić hasło");
      return false;
    }
    if (password.length < 6) {
      setValidationError("Hasło musi mieć co najmniej 6 znaków");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Hasła nie są identyczne");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await resetPasswordFunction(password, confirmPassword);
      setSuccess(true);
    } catch (err) {
      logger.error("Failed to reset password", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <Card className="w-full mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Ustaw Nowe Hasło</CardTitle>
          <CardDescription>Wprowadź swoje nowe hasło, aby zresetować konto.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nowe Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || success}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź Nowe Hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || success}
              />
            </div>

            {success && (
              <Alert className="mt-4">
                <AlertDescription>
                  Twoje hasło zostało pomyślnie zresetowane. Możesz teraz zalogować się nowym hasłem.
                </AlertDescription>
              </Alert>
            )}

            {(validationError || error) && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{validationError || error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-6 pb-6">
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetowanie hasła...
                </>
              ) : success ? (
                "Hasło Zresetowane"
              ) : (
                "Zresetuj Hasło"
              )}
            </Button>
            {success && (
              <div className="text-sm text-center">
                <a href="/auth/login" className="text-primary hover:underline">
                  Wróć do logowania
                </a>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
