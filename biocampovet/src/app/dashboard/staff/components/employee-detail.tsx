"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Warehouse,
} from "lucide-react";
import EmployeeService from "../service/employee-service";
import { EmployeeResponse } from "../types/employee-response";

interface EmployeeDetailProps {
  employeeId: number;
  onClose?: () => void;
}

export function EmployeeDetail({ employeeId, onClose }: EmployeeDetailProps) {
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      try {
        setLoading(true);
        const data = await EmployeeService.getEmployee(employeeId);
        setEmployee(data);
      } catch (err) {
        console.error("Error loading employee:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployee();
  }, [employeeId]);

  if (loading || !employee) {
    return (
      <div className="p-4 text-sm space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full" />
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
        <DetailRow icon={<User className="w-5 h-5" />} label="Nombre:" value={employee.firstName} />
        <DetailRow icon={<User className="w-5 h-5" />} label="Apellido:" value={employee.lastName} />
        <DetailRow icon={<Mail className="w-5 h-5" />} label="Correo:" value={employee.email} />
        <DetailRow icon={<Phone className="w-5 h-5" />} label="Teléfono:" value={employee.phoneNumber || "-"} />
        <DetailRow icon={<Briefcase className="w-5 h-5" />} label="Cargo:" value={employee.burden} />
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Warehouse className="w-5 h-5" />
          <span>Sucursales asignadas:</span>
        </div>
        <div className="pl-7 space-y-1">
          {employee.branches.map((b) => (
            <div key={b.id} className="flex justify-between">
              <span className="text-foreground">{b.branchName}</span>
              <span className={`text-sm font-medium ${b.active ? "text-green-600" : "text-muted-foreground"}`}>
                {b.active ? "Activo" : "Inactivo"}
              </span>
            </div>
          ))}
        </div>
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
      <span className="font-medium min-w-[90px]">{label}</span>
      <span className="text-muted-foreground truncate">{value}</span>
    </div>
  );
}
