import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomPackages } from "@/hooks/useCustomPackages";
import { 
  Package, 
  Star, 
  Trash2, 
  Pencil,
  Zap,
  Loader2,
  FolderOpen
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MyWorkspacesSectionProps {
  onCreateNew: () => void;
  onEdit?: (packageId: string) => void;
}

export function MyWorkspacesSection({ onCreateNew, onEdit }: MyWorkspacesSectionProps) {
  const { 
    packages, 
    isLoading, 
    setAsDefault, 
    deletePackage,
    isSettingDefault,
    isDeleting 
  } = useCustomPackages();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No custom workspaces yet</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
            Create a custom workspace to bundle your favorite modules together and set it as your default.
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Package className="h-4 w-4" />
            Build a Custom Workspace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Workspaces</h2>
          <p className="text-sm text-muted-foreground">Your saved custom workspaces</p>
        </div>
        <Button onClick={onCreateNew} variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Create New
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={pkg.is_default ? "border-primary/50 bg-primary/5" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                </div>
                {pkg.is_default && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              {pkg.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {pkg.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {pkg.modules?.length || 0} modules
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs">~{pkg.estimated_monthly_credits} credits/mo</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onEdit(pkg.id)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {!pkg.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAsDefault(pkg.id)}
                    disabled={isSettingDefault}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Set as Default
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{pkg.name}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePackage(pkg.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
