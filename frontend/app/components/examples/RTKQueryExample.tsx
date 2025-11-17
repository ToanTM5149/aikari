/**
 * Example: RTK Query Usage
 * 
 * Component này demo cách sử dụng RTK Query hooks
 */

import { useGetClassesQuery, useCreateClassMutation } from '~/redux/features/class';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

export function RTKQueryExample() {
  // RTK Query hook - tự động fetch, cache, và refetch
  const {
    data: classes,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetClassesQuery();

  // Mutation hook
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();

  const handleCreateClass = async () => {
    try {
      await createClass({
        name: 'New Class',
        description: 'A new class',
      }).unwrap();
      
      // Data sẽ tự động refetch sau khi create thành công
      // nhờ vào cache invalidation với tags
      alert('Class created successfully!');
    } catch (error) {
      alert('Failed to create class');
    }
  };

  if (isLoading) {
    return <div>Loading classes...</div>;
  }

  if (isError) {
    return <div>Error: {error?.toString()}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Classes</h2>
        <div className="space-x-2">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button onClick={handleCreateClass} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Class'}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {classes?.map((classItem: any) => (
          <Card key={classItem.id} className="p-4">
            <h3 className="font-semibold">{classItem.name}</h3>
            <p className="text-gray-600">{classItem.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
