"use client";

import { useEffect, useState } from "react";
import { FileText, User, IdCard, Mail, Phone, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import CustomerService from "../service/customer-service";
import { CustomerResponse } from "../types/customer-response";

interface CustomerDetailProps {
  customerId: number;
  onClose?: () => void;
}

export function CustomerDetail({ customerId, onClose }: CustomerDetailProps) {
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true);
      const data = await CustomerService.getCustomer(customerId);
      setCustomer(data);
      setLoading(false);
    }
    fetchCustomer();
  }, [customerId]);

  if (loading || !customer) {
    return (
      <div className="p-4 text-sm space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  return (
    <div className="w-full border rounded-xl p-4 space-y-5 text-sm">
      {onClose && (
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <DetailRow
          icon={<IdCard className="w-5 h-5" />}
          label="Tipo de Documento:"
          value={customer.documentType?.name || "-"}
        />
        <DetailRow
          icon={<FileText className="w-5 h-5" />}
          label="Número de Documento:"
          value={customer.documentNumber}
        />
        <DetailRow
          icon={<User className="w-5 h-5" />}
          label="Nombre:"
          value={customer.name}
        />
        <DetailRow
          icon={<Phone className="w-5 h-5" />}
          label="Teléfono:"
          value={customer.phoneNumber || "-"}
        />
        <DetailRow
          icon={<Mail className="w-5 h-5" />}
          label="Correo electrónico:"
          value={customer.email || "-"}
        />
        <DetailRow
          icon={<MapPin className="w-5 h-5" />}
          label="Dirección:"
          value={customer.address || "-"}
        />
      </div>

      {onClose && (
        <>
          <Separator />
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium min-w-[120px]">{label}</span>
      <span className="text-muted-foreground truncate">{value}</span>
    </div>
  );
}
