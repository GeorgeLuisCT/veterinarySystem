import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainRemindersPage from "../components/reminders/main-reminders";

export default function RemindersPage() {
  return (
    <DashboardLayoutSection>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto flex max-w-8xl flex-col gap-6">
            <MainRemindersPage />
          </div>
        </main>
      </div>
    </DashboardLayoutSection>
  );
}