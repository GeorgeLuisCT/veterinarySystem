"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { TreasuryAccountType } from "../_enums/accounts-enums";
import { TreasuryAccountResponse } from "../_types/treasury-account";
import { PEN } from "../_lib/formatters";

type Props = {
  accounts: TreasuryAccountResponse[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (acc: TreasuryAccountResponse) => void;
  onEdit: (acc: TreasuryAccountResponse) => void;
  onDelete: (acc: TreasuryAccountResponse) => void;
  badges: Record<TreasuryAccountType, string>;
};

export function AccountsList({
  accounts,
  loading,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  badges,
}: Props) {
  return (
    <Card className="h-fit">
      <CardContent className="p-0">
        <ScrollArea className="px-3 py-3">
          {/* Loading state (compact) */}
          {loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-lg">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-end gap-2 pt-1">
                      <Skeleton className="h-7 w-7 rounded-md" />
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && accounts.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Aún no has registrado cuentas.
            </div>
          )}

          {/* Cards grid (compact) */}
          {!loading && accounts.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {accounts.map((account) => {
                const isSelected = selectedId === account.id;
                const typeLabel =
                  account.type === TreasuryAccountType.CASH
                    ? "Caja"
                    : account.type === TreasuryAccountType.BANK
                      ? "Banco"
                      : "Digital";

                return (
                  <Card
                    key={account.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelect(account)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelect(account);
                    }}
                    className={cn(
                      "transition rounded-lg cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2",
                      "bg-card/50",
                      isSelected ? "ring-2 ring-primary" : "border"
                    )}
                  >
                    <CardContent className="p-3">
                      {/* Primera fila: nombre + badge + saldo a la derecha */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{account.name}</div>
                          {!!account.description && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                              {account.description}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className={cn(
                              "capitalize px-2 py-0.5 text-[10px] rounded-full",
                              badges[account.type]
                            )}
                          >
                            {typeLabel}
                          </Badge>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground leading-none">Saldo</div>
                            <div className="text-sm font-semibold leading-tight">
                              {PEN.format(account.currentBalance)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(account);
                          }}
                          title="Editar"
                          aria-label={`Editar ${account.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(account);
                          }}
                          title="Eliminar"
                          aria-label={`Eliminar ${account.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
