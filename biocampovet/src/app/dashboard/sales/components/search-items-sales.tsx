"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ItemType } from "../types/item-type";
import ProductService from "../../inventory/_service/product-service";

export interface SearchResultItem {
  id: number;
  name: string;
  type: ItemType;
}

interface SearchItemsSalesProps {
  branchId?: number;
  onSelectItem: (type: ItemType, id: number) => void;
}

export interface SearchItemsSalesRef {
  clear: () => void;
}

const SearchItemsSales = forwardRef<SearchItemsSalesRef, SearchItemsSalesProps>(
  ({ branchId, onSelectItem }, ref) => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResultItem[]>([]);

    useImperativeHandle(ref, () => ({
      clear() {
        setQuery("");
        setResults([]);
      },
    }));

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    };

    useEffect(() => {
      const delayDebounce = setTimeout(async () => {
        if (query.trim() === "") {
          setResults([]);
          return;
        }

        setLoading(true);
        try {
          const [products] = await Promise.all([
            ProductService.searchProducts(query, branchId),
          ]);

          const mappedProducts = products.map((p) => ({
            id: p.id,
            name: p.name,
            type: "PRODUCT" as ItemType,
          }));

          setResults([
            ...mappedProducts,
          ]);
        } catch (error) {
          console.error("Error buscando elementos", error);
        } finally {
          setLoading(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounce);
    }, [query, branchId]);

    return (
      <div className="w-3/4 relative space-y-4">
        <Input
          className="mb-1"
          placeholder="Buscar..."
          value={query}
          onChange={handleSearch}
        />

        {query.trim() !== "" && (
          <div className="absolute z-50 w-full bg-white border rounded shadow-md max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No se encontraron resultados.
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="cursor-pointer hover:bg-gray-100 px-4 py-1"
                  onClick={() => onSelectItem(item.type, item.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground w-24 text-right">
                      {item.type === "PRODUCT"
                        ? "Producto"
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchItemsSales.displayName = "SearchItemsSales";
export default SearchItemsSales;
