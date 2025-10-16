"use client";

import { Building, User, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CashBoxStatus, CashBoxStatusLabels } from "../enums/cashbox-status";
import { CashBoxActions } from "./cashbox-actions";

interface CashBoxHeaderProps {
  id: number;
  branchName: string;
  openedBy: { fullName: string; username: string };
  openedAt: string | null;
  initialAmount: number;
  status: CashBoxStatus;
  fetchCurrentCashBox: () => void;
}

const formatDate = (dateString: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString(undefined, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }) +
    " " +
    new Date(dateString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : "—";

export function CashBoxHeader({
  id,
  branchName,
  openedBy,
  openedAt,
  initialAmount,
  status,
  fetchCurrentCashBox,
}: CashBoxHeaderProps) {
  return (
    <div className="bg-card dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-full">
      {/* Título y estado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">Caja #{id}</h1>
        <Badge
          variant="secondary"
          className={`inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border ${status === CashBoxStatus.OPEN
              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-400 dark:border-green-700"
              : "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
            }`}
        >
          <span
            className={`w-3 h-3 rounded-full ${status === CashBoxStatus.OPEN ? "bg-green-500 dark:bg-green-400" : "bg-gray-400 dark:bg-gray-500"
              }`}
          />
          {CashBoxStatusLabels[status]}
        </Badge>
      </div>

      {/* Grid con info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <Building className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
            <p className="font-semibold">{branchName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <User className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Abierta por</p>
            <p className="font-semibold">
              {openedBy.fullName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Apertura</p>
            <p className="font-semibold">{formatDate(openedAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Monto Inicial</p>
            <p className="font-semibold">S/ {initialAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <CashBoxActions cashboxId={id} fetchCurrentCashBox={fetchCurrentCashBox} />
      </div>
    </div>
  );
}
