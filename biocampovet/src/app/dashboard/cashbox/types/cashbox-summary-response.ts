export interface CashboxSummaryResponse {
  id: number;
  branchName: string;
  openedByName: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  totalIncome: number;
  totalExpense: number;
  physicalAmount: number;
}