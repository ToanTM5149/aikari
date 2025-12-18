import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";
import { ProfilePage } from "~/components/pages/dashboard/profile-page";

export default function ProfilePageRoute() {
  const user = useAppSelector(selectCurrentUser);
  
  // Convert Redux user to ProfilePage expected format
  const userData = user ? {
    name: user.full_name || user.username || "",
    email: user.email || "",
    username: user.username || "",
    fullName: user.full_name,
    userType: user.role
  } : {
    name: "",
    email: "",
    username: ""
  };

  return <ProfilePage userData={userData} />;
}
