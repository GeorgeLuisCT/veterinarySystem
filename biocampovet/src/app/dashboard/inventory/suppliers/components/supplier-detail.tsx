"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building, Mail, Phone, Banknote, Globe, User } from "lucide-react";
import SupplierService from "../service/supplier-service";
import { SupplierResponse } from "../types/supplier-response";
import { SupplierTypeLabels } from "../enums/supplier-type";

interface SupplierDetailProps {
  supplierId: number;
  onClose?: () => void;
}

export function SupplierDetail({ supplierId, onClose }: SupplierDetailProps) {
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplier() {
      try {
        setLoading(true);
        const data = await SupplierService.getSupplier(supplierId);
        setSupplier(data);
      } catch (err) {
        console.error("Error loading supplier:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSupplier();
  }, [supplierId]);

  if (loading || !supplier) {
    return (
      <div className="p-4 text-sm space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
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
        <DetailRow icon={<Building className="w-5 h-5" />} label="Nombre o Razón Social:" value={supplier.name} />
        <DetailRow icon={<User className="w-5 h-5" />} label="RUC:" value={supplier.ruc} />
        <DetailRow icon={<Mail className="w-5 h-5" />} label="Correo:" value={supplier.email || "-"} />
        <DetailRow icon={<Phone className="w-5 h-5" />} label="Teléfono:" value={supplier.contactPhone || "-"} />
        <DetailRow icon={<Globe className="w-5 h-5" />} label="Sitio Web:" value={supplier.website || "-"} />
        <DetailRow icon={<Building className="w-5 h-5" />} label="Dirección:" value={supplier.address || "-"} />
        <DetailRow icon={<User className="w-5 h-5" />} label="Tipo de Proveedor:" value={SupplierTypeLabels[supplier.supplierType]} />
        <DetailRow icon={<Banknote className="w-5 h-5" />} label="Banco:" value={supplier.bankName || "-"} />
        <DetailRow icon={<Banknote className="w-5 h-5" />} label="Cuenta Bancaria:" value={supplier.bankAccountNumber || "-"} />
      </div>

      {onClose && (
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-medium min-w-[140px]">{label}</span>
      <span className="text-muted-foreground truncate">{value}</span>
    </div>
  );
}
