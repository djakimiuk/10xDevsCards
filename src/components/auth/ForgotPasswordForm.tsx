import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
}

export function ForgotPasswordForm({
  onSubmit,
  isLoading = false,
  error = null,
  success = false,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email) {
      setValidationError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(email);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || success}
              />
            </div>

            {success && (
              <Alert>
                <AlertDescription>
                  If an account exists with this email, you will receive a password reset link shortly.
                </AlertDescription>
              </Alert>
            )}

            {(validationError || error) && (
              <Alert variant="destructive">
                <AlertDescription>{validationError || error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : success ? (
                "Reset Link Sent"
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <div className="text-sm text-center space-x-1">
              <a href="/auth/login" className="text-primary hover:underline">
                Back to login
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
