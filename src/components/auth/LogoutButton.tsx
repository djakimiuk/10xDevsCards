import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    logger.debug("Logout button clicked");

    try {
      setIsLoading(true);
      logger.debug("Starting logout process from button");
      await logoutUser();
    } catch (error) {
      logger.error("Error during logout from button", { error });
    } finally {
      logger.debug("Logout process completed (success or failure)");
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoading} data-test-id="logout-button">
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
