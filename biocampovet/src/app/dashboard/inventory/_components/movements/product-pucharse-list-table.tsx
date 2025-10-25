import { Button } from "@/components/ui/button";
import { ProductUnitTypeLabels } from "../../_enums/product-unit-type";
import { PurchaseProductDraft } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

interface ProductListTableProps {
    products: PurchaseProductDraft[];
    onDelete: (index: number) => void;
}

export function ProductListTable({ products, onDelete }: ProductListTableProps) {
    return (
        <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead className="w-14" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                                No se han añadido productos.
                            </TableCell>
                        </TableRow>
                    ) : (
                        products.map((product, index) => (
                            <TableRow key={`${product.productId}-${index}`}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{product.productName}</span>
                                        {product.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>{product.batchNumber}</TableCell>
                                <TableCell>{product.expirationDate || "-"}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>{ProductUnitTypeLabels[product.unitType]}</TableCell>
                                <TableCell>S/ {product.unitCost.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(index)}
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}