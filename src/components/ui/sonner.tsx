import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      richColors
      toastOptions={{
        duration: 4000,
        style: {
          fontSize: '16px',
          padding: '20px 24px',
          minHeight: '70px',
          minWidth: '400px',
          maxWidth: '600px',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-base group-[.toast]:mt-1",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-base group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:px-4 group-[.toast]:py-2",
          error: "group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive group-[.toast]:border-destructive/30",
          success: "group-[.toast]:bg-green-500/10 group-[.toast]:text-green-700 dark:group-[.toast]:text-green-400 group-[.toast]:border-green-500/30",
          warning: "group-[.toast]:bg-yellow-500/10 group-[.toast]:text-yellow-700 dark:group-[.toast]:text-yellow-400 group-[.toast]:border-yellow-500/30",
          info: "group-[.toast]:bg-blue-500/10 group-[.toast]:text-blue-700 dark:group-[.toast]:text-blue-400 group-[.toast]:border-blue-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
