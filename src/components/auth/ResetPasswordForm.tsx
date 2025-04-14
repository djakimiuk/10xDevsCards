import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ResetPasswordFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
}

export function ResetPasswordForm({
  onSubmit,
  isLoading = false,
  error = null,
  success = false,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    if (!password) {
      setValidationError("Password is required");
      return false;
    }
    if (!confirmPassword) {
      setValidationError("Please confirm your password");
      return false;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(password, confirmPassword);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>Enter your new password to reset your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              <AlertDescription>
                Your password has been successfully reset. You can now login with your new password.
              </AlertDescription>
            </Alert>
          )}

          {(validationError || error) && (
            <Alert variant="destructive">
              <AlertDescription>{validationError || error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading || success}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : success ? (
              "Password Reset"
            ) : (
              "Reset Password"
            )}
          </Button>
          {success && (
            <div className="text-sm text-center">
              <a href="/auth/login" className="text-primary hover:underline">
                Back to login
              </a>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
