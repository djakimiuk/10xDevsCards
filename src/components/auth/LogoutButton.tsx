import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
    } catch (error) {
      logger.error("Error during logout", { error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
