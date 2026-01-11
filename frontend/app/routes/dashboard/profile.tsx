import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";
import { ProfilePage } from "~/components/pages/dashboard/profile-page";
import { useGetCurrentUserQuery } from "~/redux/features/user/api";

export default function ProfilePageRoute() {
  const authUser = useAppSelector(selectCurrentUser);
  // Fetch fresh user data to get all fields including preferences
  const { data: currentUser, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !authUser,
  });
  
  // Use currentUser from API if available, otherwise fallback to authUser
  const user = currentUser || authUser;
  
  // Get preferences from user (stored in JSONB)
  const preferences = (user as any)?.preferences || {};
  
  // Convert Redux user to ProfilePage expected format
  const userData = user ? {
    name: user.full_name || user.username || "",
    email: user.email || "",
    username: user.username || "",
    fullName: user.full_name,
    phone: (user as any)?.phone_numbers || preferences.phone || preferences.phone_numbers || "",
    address: (user as any)?.address || preferences.address || "",
    city: (user as any)?.city || preferences.city || "",
    state: (user as any)?.country || preferences.state || preferences.country || "",
    zipCode: preferences.zip_code || preferences.zipCode || "",
    sex: preferences.gender || preferences.sex || "",
    dateOfBirth: preferences.date_of_birth || preferences.dateOfBirth || "",
    schoolName: preferences.school_name || preferences.schoolName || "",
    userType: user.role
  } : {
    name: "",
    email: "",
    username: ""
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return <ProfilePage userData={userData} />;
}
