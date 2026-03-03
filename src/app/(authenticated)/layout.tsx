import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { TimerProvider } from "@/components/ui/TimerContext";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TimerProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </TimerProvider>
  );
}
