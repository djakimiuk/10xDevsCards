"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormError } from "@/components/ui/form"; // Assuming you have these
import { Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "@/lib/auth";
import { logger } from "@/lib/logger";

const requestResetSchema = z.object({
  email: z.string().email({ message: "Niepoprawny format email" }),
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;

export function RequestResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: RequestResetFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await sendPasswordResetEmail(data.email);
      setSuccessMessage("Jeśli konto istnieje, link do resetowania hasła został wysłany na podany adres e-mail.");
      form.reset();
    } catch (err) {
      logger.error("Failed to send password reset email", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Zresetuj Hasło</CardTitle>
          <CardDescription>Podaj swój adres e-mail, aby otrzymać link do resetowania hasła.</CardDescription>
        </CardHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 pt-0 space-y-4">
              <FormField name="email" label="Email" type="email" placeholder="twoj@email.com" disabled={isLoading} />
              {error && <FormError error={error} />}
              {successMessage && (
                <div className="mt-2 p-3 rounded-md bg-green-100 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
                  <p className="text-sm">{successMessage}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  "Wyślij Link do Resetowania Hasła"
                )}
              </Button>
              <div className="text-sm text-center">
                <a href="/auth/login" className="text-primary hover:underline">
                  Wróć do logowania
                </a>
              </div>
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
