"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode } from "react";

interface Identifiable {
  id?: string | number;
}

interface Column<T> {
  header: string | ReactNode;
  cell: (item: T) => ReactNode;
  key: string;
  className?: string;
}

interface DataTableProps<T extends Identifiable> {
  columns: Column<T>[];
  data: T[];
  emptyMessage: string;
  emptyIcon?: ReactNode;
}

export function SimpleDataTable<T extends Identifiable>({
  columns,
  data,
  emptyMessage,
  emptyIcon,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyIcon && <div className="mb-4 text-muted-foreground">{emptyIcon}</div>}
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={item.id ?? idx}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
