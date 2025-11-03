// app/dashboard/inventory/_components/movements/kardex-filters.tsx
"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, RefreshCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ProductQuickSearchResponse } from "../../_types/product-response";
import type { ProductBatchSearchResponse } from "../../_types/product-batch-response";
import { SearchPopover } from "../../_components/movements/search-popover";

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";

const formatDateRangeLabel = (range?: DateRange) => {
  if (!range?.from) return "Rango de fechas";
  if (!range.to) return format(range.from, DATE_DISPLAY_FORMAT, { locale: es });
  return `${format(range.from, DATE_DISPLAY_FORMAT, { locale: es })} - ${format(
    range.to,
    DATE_DISPLAY_FORMAT,
    { locale: es }
  )}`;
};

type KardexFiltersBarProps = {
  // Product Search
  productSelected: ProductQuickSearchResponse | null;
  productOnSelect: (option: ProductQuickSearchResponse) => void;
  productPlaceholder: string;
  productSearch: (query: string) => void;
  productCancel: () => void;
  productOptions: ProductQuickSearchResponse[];
  productLoading: boolean;
  productGetOptionLabel: (option: ProductQuickSearchResponse) => string;
  productGetOptionDescription?: (option: ProductQuickSearchResponse) => string | undefined;
  productDisabled?: boolean;

  // Batch Search
  batchSelected: ProductBatchSearchResponse | null;
  batchOnSelect: (option: ProductBatchSearchResponse) => void;
  batchPlaceholder: string;
  batchSearch: (query: string) => void;
  batchCancel: () => void;
  batchOptions: ProductBatchSearchResponse[];
  batchLoading: boolean;
  batchGetOptionLabel: (option: ProductBatchSearchResponse) => string;
  batchGetOptionDescription?: (option: ProductBatchSearchResponse) => string | undefined;
  batchDisabled?: boolean;

  // Otros
  dateRange?: DateRange;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onReset: () => void;
  onRefresh: () => void;
  loading?: boolean;
};

export default function KardexFiltersBar({
  // producto
  productSelected,
  productOnSelect,
  productPlaceholder,
  productSearch,
  productCancel,
  productOptions,
  productLoading,
  productGetOptionLabel,
  productGetOptionDescription,
  productDisabled,
  // lote
  batchSelected,
  batchOnSelect,
  batchPlaceholder,
  batchSearch,
  batchCancel,
  batchOptions,
  batchLoading,
  batchGetOptionLabel,
  batchGetOptionDescription,
  batchDisabled,
  // otros
  dateRange,
  onDateRangeChange,
  onReset,
  onRefresh,
  loading,
}: KardexFiltersBarProps) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border bg-background/80 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-w-max flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 w-80">
          <SearchPopover
            selected={productSelected}
            onSelect={productOnSelect}
            placeholder={productPlaceholder}
            search={productSearch}
            cancel={productCancel}
            options={productOptions}
            loading={productLoading}
            getOptionLabel={productGetOptionLabel}
            getOptionDescription={productGetOptionDescription}
          />
        </div>

        <div className="flex items-center gap-2 w-72">
          <SearchPopover
            selected={batchSelected}
            onSelect={batchOnSelect}
            placeholder={batchPlaceholder}
            search={batchSearch}
            cancel={batchCancel}
            options={batchOptions}
            loading={batchLoading}
            getOptionLabel={batchGetOptionLabel}
            getOptionDescription={batchGetOptionDescription}
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start w-[260px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRangeLabel(dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <Calendar
                mode="range"
                locale={es}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateRangeChange(undefined)}
              aria-label="Limpiar rango de fechas"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" className="gap-2" type="button" onClick={onReset}>
            <RefreshCcw className="h-4 w-4" />
            Restablecer
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label="Actualizar"
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
