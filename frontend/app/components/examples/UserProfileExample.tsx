/**
 * Example: User Profile Component sử dụng Redux
 * 
 * Component này demo cách sử dụng:
 * 1. useAppSelector để read state
 * 2. useAppDispatch để dispatch actions
 * 3. RTK Query hooks để fetch data
 */

import { useCurrentUser } from '~/redux/features/user';
import { useAppSelector } from '~/redux/store/hooks';
import { selectUserLoading } from '~/redux/features/user';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

export function UserProfileExample() {
  const currentUser = useCurrentUser();
  const loading = useAppSelector(selectUserLoading);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!currentUser) {
    return <div>Please login</div>;
  }

  return (
    <Card className="p-6 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Email:</span> {currentUser.email}
        </div>
        <div>
          <span className="font-semibold">Name:</span> {currentUser.full_name}
        </div>
        <div>
          <span className="font-semibold">Username:</span> {currentUser.username}
        </div>
        <div>
          <span className="font-semibold">Role:</span> {currentUser.role}
        </div>
        <div>
          <span className="font-semibold">Status:</span>{' '}
          {currentUser.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <Button className="mt-4">Edit Profile</Button>
    </Card>
  );
}
