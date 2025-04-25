import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";
import { loginUser } from "@/lib/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("registration") === "success") {
      setRegistrationSuccess(true);
      // Usuń parametr z URL bez przeładowania strony
      window.history.replaceState({}, "", window.location.pathname);

      // Ukryj komunikat po 5 sekundach
      const timer = setTimeout(() => {
        setRegistrationSuccess(false);
      }, 5000);

      // Cleanup timeout przy odmontowaniu komponentu
      return () => clearTimeout(timer);
    }
  }, []);

  const validateForm = () => {
    if (!email) {
      setError("Email jest wymagany");
      return false;
    }
    if (!password) {
      setError("Hasło jest wymagane");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Podaj poprawny adres email");
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
      await loginUser(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8" data-test-id="login-form-container">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Zaloguj się do aplikacji</h2>
        <p className="text-muted-foreground mt-2">Wprowadź swoje dane aby się zalogować</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" data-test-id="login-form">
        {registrationSuccess && (
          <Alert className="bg-green-50 text-green-700 border-green-200" data-test-id="registration-success-alert">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Konto zostało pomyślnie utworzone. Możesz się teraz zalogować.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" data-test-id="login-error-alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="twoj@email.com"
              disabled={isLoading}
              data-test-id="login-email-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Hasło
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              disabled={isLoading}
              data-test-id="login-password-input"
            />
          </div>
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
    </div>
  );
}
