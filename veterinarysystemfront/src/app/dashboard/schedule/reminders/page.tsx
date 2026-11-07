import DashboardLayoutSection from "@/app/dashboard/dashboard-layout-section";
import MainRemindersPage from "../components/reminders/main-reminders";
import { PageContainer } from "@/components/page/page-container";

export default function RemindersPage() {
  return (
    <DashboardLayoutSection>
      <PageContainer>
        <MainRemindersPage />
      </PageContainer>
    </DashboardLayoutSection>
  );
}
