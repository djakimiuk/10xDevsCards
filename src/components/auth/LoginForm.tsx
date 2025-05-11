"use client";

import React, { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import { AuthError } from "@supabase/supabase-js";

// Import Shadcn/UI components (ensure these are correctly installed and pathed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  registrationSuccess?: boolean;
  resetSuccess?: boolean;
}

export function LoginForm({ registrationSuccess, resetSuccess }: LoginFormProps) {
  const supabaseBrowser: SupabaseClient<Database> = createBrowserSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      window.location.href = "/generate";
    } catch (catchError) {
      let errorMessage = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
      if (catchError instanceof AuthError) {
        errorMessage = catchError.message;
      } else if (catchError instanceof Error) {
        errorMessage = catchError.message;
      }
      setError(errorMessage);
      console.error("Błąd logowania:", catchError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <Card className="w-full">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl">Logowanie</CardTitle>
          <CardDescription>Wprowadź swoje dane, aby uzyskać dostęp.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          {registrationSuccess && (
            <div className="mb-4 p-3 rounded-md bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
              <p className="text-sm">
                Rejestracja zakończona pomyślnie! Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto.
              </p>
            </div>
          )}
          {resetSuccess && (
            <div className="mb-4 p-3 rounded-md bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
              <p className="text-sm">Resetowanie hasła zakończone pomyślnie! Sprawdź swoją skrzynkę e-mail.</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
              <p className="text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4 pt-4 px-6 pb-6">
          <div className="text-sm">
            <a href="/auth/register" className="font-medium text-primary hover:underline">
              Nie masz konta? Zarejestruj się
            </a>
          </div>
          <div className="text-sm">
            <a href="/auth/request-password-reset" className="font-medium text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
