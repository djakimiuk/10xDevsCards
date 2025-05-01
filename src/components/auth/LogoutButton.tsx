import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase.client";
import { logger } from "@/lib/logger";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "/auth/login";
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
