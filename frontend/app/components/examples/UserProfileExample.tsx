/**
 * Example: User Profile Component sử dụng Redux
 * 
 * Component này demo cách sử dụng:
 * 1. useAppSelector để read state
 * 2. useAppDispatch để dispatch actions
 * 3. RTK Query hooks để fetch data
 */

import { useEffect } from 'react';
import { useCurrentUser } from '~/store/hooks';
import { useAppDispatch, useAppSelector } from '~/store';
import { fetchUserProfile, selectUserProfile, selectUserLoading } from '~/store/slices/userSlice';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

export function UserProfileExample() {
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const profile = useAppSelector(selectUserProfile);
  const loading = useAppSelector(selectUserLoading);

  // Fetch user profile khi component mount
  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchUserProfile(currentUser.id));
    }
  }, [dispatch, currentUser?.id]);

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
          <span className="font-semibold">Status:</span>{' '}
          {currentUser.is_active ? 'Active' : 'Inactive'}
        </div>
        
        {profile && (
          <>
            {profile.bio && (
              <div>
                <span className="font-semibold">Bio:</span> {profile.bio}
              </div>
            )}
            {profile.phone && (
              <div>
                <span className="font-semibold">Phone:</span> {profile.phone}
              </div>
            )}
          </>
        )}
      </div>
      
      <Button className="mt-4">Edit Profile</Button>
    </Card>
  );
}
