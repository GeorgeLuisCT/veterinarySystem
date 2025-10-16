export interface PaymentMethodResponse {
  id: number;
  name: string;
  description?: string;
  percentageExtra?: number;
  percentageDiscount?: number;
  isActive: boolean;
}
