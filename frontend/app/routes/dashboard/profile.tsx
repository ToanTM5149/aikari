import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";

export default function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <p className="text-muted-foreground mb-6">
        Manage your account settings and preferences.
      </p>
      
      <div className="max-w-2xl">
        <div className="p-6 border rounded-lg space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-muted"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-muted"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user?.full_name || ""}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={user?.role || ""}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-muted"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
