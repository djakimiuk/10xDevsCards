import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { supabase } from "@/lib/supabase.client";

interface ProfilePageProps {
  userEmail: string;
  isTemporaryPassword: boolean;
}

export function ProfilePage({ userEmail, isTemporaryPassword }: ProfilePageProps) {
  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
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
