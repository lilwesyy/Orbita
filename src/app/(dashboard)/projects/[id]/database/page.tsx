import { Card, CardContent } from "@/components/ui/card";
import { IconDatabase } from "@tabler/icons-react";

export default function ProjectDatabasePage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <IconDatabase className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Database</h2>
          <p className="text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
