/**
 * Redux Examples Navigation Card
 * 
 * Component này có thể được thêm vào home page hoặc bất kỳ đâu
 * để dễ dàng navigate đến Redux examples
 */

import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Code2, BookOpen, Rocket } from "lucide-react";

export function ReduxExamplesCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <CardTitle>Redux Toolkit Examples</CardTitle>
        </div>
        <CardDescription>
          Xem demo và học cách sử dụng Redux trong project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Rocket className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Live Examples</p>
                <p className="text-sm text-muted-foreground">
                  Authentication, User Profile, RTK Query demos
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Documentation</p>
                <p className="text-sm text-muted-foreground">
                  Comprehensive guide với best practices
                </p>
              </div>
            </div>
          </div>

          <Button asChild className="w-full">
            <Link to="/redux-examples">
              View Redux Examples →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
