import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { logoutUser } from "@/lib/auth";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
    } catch (error) {
      // Błędy wylogowywania są już obsługiwane w funkcji logoutUser
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  };

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Wylogowywanie...
        </>
      ) : (
        "Wyloguj"
      )}
    </Button>
  );
}
