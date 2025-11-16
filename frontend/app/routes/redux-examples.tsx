/**
 * Redux Examples Demo Page
 * 
 * Page này chứa tất cả examples để demo Redux usage
 */

import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

// Import example components
import { LoginExample } from "~/components/examples/LoginExample";
import { UserProfileExample } from "~/components/examples/UserProfileExample";
import { RTKQueryExample } from "~/components/examples/RTKQueryExample";

export default function ReduxExamplesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Redux Toolkit Examples</h1>
        <p className="text-muted-foreground">
          Demo các cách sử dụng Redux Toolkit trong AIKARI project
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="profile">User Profile</TabsTrigger>
          <TabsTrigger value="rtk-query">RTK Query</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redux Toolkit Setup</CardTitle>
              <CardDescription>
                Project đã được setup với Redux Toolkit và RTK Query
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">📦 Packages đã cài</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>@reduxjs/toolkit - Redux Toolkit core</li>
                  <li>react-redux - React bindings for Redux</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">📁 Cấu trúc Store</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {`app/store/
                    ├── index.ts              # Store config
                    ├── types.ts              # TypeScript types
                    ├── hooks.ts              # Custom hooks
                    ├── slices/
                    │   ├── authSlice.ts     # Auth state
                    │   └── userSlice.ts     # User state
                    └── services/
                        └── apiService.ts    # RTK Query API`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">🎯 Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Login/Logout</li>
                        <li>Token management</li>
                        <li>Auto refresh token</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">User Management</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        <li>User profile</li>
                        <li>Preferences (theme, language)</li>
                        <li>LocalStorage persistence</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">RTK Query</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Automatic caching</li>
                        <li>Auto refetching</li>
                        <li>Loading states</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">TypeScript</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Full type safety</li>
                        <li>Typed hooks</li>
                        <li>Autocomplete support</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex gap-4">
                <Button asChild>
                  <Link to="/redux-examples?tab=auth">View Examples</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://redux-toolkit.js.org/" target="_blank" rel="noopener noreferrer">
                    Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Example</CardTitle>
              <CardDescription>
                Demo login form sử dụng useAuth() hook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Code Example:</h4>
                <pre className="text-sm overflow-x-auto">
                    {`import { useAuth } from '~/store/hooks';

                    function LoginPage() {
                    const { login, loading, error } = useAuth();
                    
                    const handleSubmit = async (e) => {
                        e.preventDefault();
                        await login({ email, password });
                    };
                    }`}
                </pre>
              </div>
              
              <LoginExample />
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile Example</CardTitle>
              <CardDescription>
                Demo sử dụng useAppSelector và useCurrentUser hook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Code Example:</h4>
                <pre className="text-sm overflow-x-auto">
{`import { useCurrentUser } from '~/store/hooks';
import { useAppSelector } from '~/store';

function Profile() {
  const user = useCurrentUser();
  const profile = useAppSelector(selectUserProfile);
  
  return <div>{user?.full_name}</div>;
}`}
                </pre>
              </div>
              
              <UserProfileExample />
            </CardContent>
          </Card>
        </TabsContent>

        {/* RTK Query Tab */}
        <TabsContent value="rtk-query">
          <Card>
            <CardHeader>
              <CardTitle>RTK Query Example</CardTitle>
              <CardDescription>
                Demo sử dụng RTK Query hooks cho API calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Code Example:</h4>
                <pre className="text-sm overflow-x-auto">
                    {`import { useGetClassesQuery, useCreateClassMutation } from '~/store/services/apiService';

                    function ClassList() {
                    const { data, isLoading, refetch } = useGetClassesQuery();
                    const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
                    
                    // Automatic caching và refetching!
                    }`}
                </pre>
              </div>
              
              <RTKQueryExample />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation Links */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📚 Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-semibold">Redux Guide (Comprehensive)</p>
              <p className="text-sm text-muted-foreground">
                Chi tiết về core concepts, best practices, examples
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/REDUX_GUIDE.md" target="_blank">
                View Guide
              </a>
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-semibold">Store README (Quick Reference)</p>
              <p className="text-sm text-muted-foreground">
                Quick reference với cheat sheet
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/app/store/README.md" target="_blank">
                View README
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
