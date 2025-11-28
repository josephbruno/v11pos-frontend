import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function PlaceholderPage({
  title,
  description,
  icon: Icon = Construction,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/">
          <Button
            variant="outline"
            size="sm"
            className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-pos-text">{title}</h1>
          <p className="text-pos-text-muted mt-1">{description}</p>
        </div>
      </div>

      <Card className="bg-card border-border max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-pos-text">
            {title} - Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-pos-text-muted text-lg">{description}</p>
          <p className="text-pos-text-muted">
            This feature is currently under development. Continue prompting to
            help build out this section of the restaurant management system.
          </p>
          <div className="flex justify-center space-x-3 pt-4">
            <Link to="/">
              <Button
                variant="outline"
                className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
              >
                Return to Dashboard
              </Button>
            </Link>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Request Feature Development
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
