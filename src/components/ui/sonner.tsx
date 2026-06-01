import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      richColors
      closeButton
      duration={4000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md bg-background/95 text-foreground border-border",
          title: "text-[14px] font-semibold leading-tight",
          description: "text-[12px] text-muted-foreground",
          success: "!border-emerald-500/40 !bg-emerald-50/95 !text-emerald-900 dark:!bg-emerald-950/80 dark:!text-emerald-50",
          error: "!border-red-500/40 !bg-red-50/95 !text-red-900 dark:!bg-red-950/80 dark:!text-red-50",
          info: "!border-blue-500/40 !bg-blue-50/95 !text-blue-900 dark:!bg-blue-950/80 dark:!text-blue-50",
          warning: "!border-amber-500/40 !bg-amber-50/95 !text-amber-900 dark:!bg-amber-950/80 dark:!text-amber-50",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "!bg-background !border-border !text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
