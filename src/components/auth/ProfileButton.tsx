import { Button } from "@/components/ui/button";

export function ProfileButton() {
  const handleNavigateToProfile = () => {
    window.location.href = "/profile";
  };

  return (
    <Button onClick={handleNavigateToProfile} variant="outline" data-test-id="profile-button">
      Profil
    </Button>
  );
}
