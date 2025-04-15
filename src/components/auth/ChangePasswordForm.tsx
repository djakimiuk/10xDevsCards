import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ChangePasswordFormProps {
  onSubmit: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  isTemporaryPassword?: boolean;
}

export function ChangePasswordForm({ onSubmit, isTemporaryPassword = false }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!isTemporaryPassword && !currentPassword) {
      setError("Aktualne hasło jest wymagane");
      return false;
    }
    if (!newPassword) {
      setError("Nowe hasło jest wymagane");
      return false;
    }
    if (!confirmPassword) {
      setError("Potwierdzenie hasła jest wymagane");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return false;
    }
    if (newPassword.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      await onSubmit(currentPassword, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

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
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {!isTemporaryPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Aktualne hasło</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading || success}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading || success}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || success}
            />
          </div>

          {success && (
            <Alert>
              <AlertDescription>Hasło zostało pomyślnie zmienione.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
    </Card>
  );
}
