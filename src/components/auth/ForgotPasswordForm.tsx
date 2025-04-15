import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { sendPasswordResetEmail } from "@/lib/auth";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Automatycznie ukryj komunikat sukcesu po 5 sekundach
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handler dla eventu z tokenem resetującym
  const handleResetLink = useCallback(
    (payload: { email: string; token: string; message: string }) => {
      if (payload.email === email) {
        setSuccess(true);
        setResetToken(payload.token);
      }
    },
    [email]
  );

  // Nasłuchuj na eventy z tokenem resetującym
  useSupabaseEvents("password_reset_link", handleResetLink);

  const validateForm = () => {
    if (!email) {
      setError("Email jest wymagany");
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
      await sendPasswordResetEmail(email);
      setSuccess(true);
      setEmail(""); // Czyścimy pole po udanym wysłaniu
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Reset hasła</h2>
        <p className="text-muted-foreground mt-2">Wprowadź swój adres email, a wyślemy Ci link do zresetowania hasła</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {success && (
          <Alert className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Link do resetowania hasła został wysłany na podany adres email.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            disabled={isLoading || success}
          />
        </div>

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
    </div>
  );
}
