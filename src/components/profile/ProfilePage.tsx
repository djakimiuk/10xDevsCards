import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { supabaseClient } from "@/db/supabase.client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

interface ProfilePageProps {
  userEmail: string;
  isTemporaryPassword: boolean;
}

export function ProfilePage({ userEmail, isTemporaryPassword }: ProfilePageProps) {
  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error("Error updating password:", error);
        toast.error("Nie udało się zmienić hasła. Spróbuj ponownie później.");
        throw error;
      }

      toast.success("Hasło zostało zmienione pomyślnie!");
    } catch (error) {
      logger.error("Unexpected error during password change:", error);
      toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil użytkownika</h1>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      <div className="grid gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Zmiana hasła</h2>
          <ChangePasswordForm isTemporaryPassword={isTemporaryPassword} onSubmit={handlePasswordChange} />
        </div>
      </div>
    </div>
  );
}
