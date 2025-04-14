import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface RegisterFormProps {
  onSubmit: (email: string, password: string, confirmPassword: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onSubmit, isLoading = false, error = null }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email) {
      setValidationError("Email is required");
      return false;
    }
    if (!password) {
      setValidationError("Password is required");
      return false;
    }
    if (!confirmPassword) {
      setValidationError("Please confirm your password");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Please enter a valid email address");
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
      await onSubmit(email, password, confirmPassword);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center tracking-tight">10x Devs Cards</h1>
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Sign up to start creating flashcards</CardDescription>
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
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {(validationError || error) && (
              <Alert variant="destructive">
                <AlertDescription>{validationError || error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <div className="text-sm text-center">
              Already have an account?{" "}
              <a href="/auth/login" className="text-primary hover:underline">
                Login here
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
