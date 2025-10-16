"use client"

import { useEffect, useState } from "react"
import {
    FileText,
    Package,
    Tag,
    AlertTriangle,
    Ruler,
    CircleDollarSign,
    Layers,
    Warehouse,
    Box,
} from "lucide-react"
import ProductService from "../service/product-service"
import { ProductResponse } from "../types/product-response"
import { ProductSaleModeResponse } from "../types/product-sale-mode-response"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getProductPresentationTypeLabel } from "../enums/product-presentation-type"
import { getProductUnitTypeAbbreviation, getProductUnitTypeLabel } from "../enums/product-unit-type"

interface ProductDetailProps {
    productId: number
    branchId?: number
    onClose?: () => void
}

export function ProductDetail({ productId, branchId, onClose }: ProductDetailProps) {
    const [product, setProduct] = useState<ProductResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProduct() {
            setLoading(true)
            const data = await ProductService.getProduct(productId)
            setProduct(data)
            setLoading(false)
        }
        fetchProduct()
    }, [productId])

    if (loading || !product) {
        return (
            <div className="p-4 text-sm space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-3/4" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-3/4" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        )
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
                    icon={<Layers className="w-5 h-5" />}
                    label="Categoría:"
                    value={product.category.name}
                />
                <DetailRow
                    icon={<Package className="w-5 h-5" />}
                    label="Nombre:"
                    value={product.name}
                />
                <DetailRow
                    icon={<FileText className="w-5 h-5" />}
                    label="Descripción:"
                    value={product.description}
                />
                <DetailRow
                    icon={<Tag className="w-5 h-5" />}
                    label="SKU:"
                    value={product.sku}
                />
                <DetailRow
                    icon={<AlertTriangle className="w-5 h-5" />}
                    label="Stock mínimo:"
                    value={String(product.minStock)}
                />

                <DetailRow
                    icon={<Box  className="w-5 h-5" />}
                    label="Presentación:"
                    value={getProductPresentationTypeLabel(product.presentation)}
                />

                <div className="grid grid-cols-2 gap-4">
                    <DetailRow
                        icon={<Ruler className="w-5 h-5" />}
                        label="Medida:"
                        value={getProductUnitTypeLabel(product.unitType)}
                    />
                    <div className="flex items-center gap-2">
                        <Ruler className="w-5 h-5" />
                        <span className="font-medium ">Contenido: </span>
                        <span className="text-muted-foreground truncate">{`${product.contentTotal} ${getProductUnitTypeAbbreviation(product.unitType)}`}</span>
                    </div>
                </div>

                <DetailRow
                    icon={<CircleDollarSign className="w-5 h-5" />}
                    label="Precio:"
                    value={`S/. ${product.standardPrice.toFixed(2)}`}
                />
            </div>



            <Separator />

            {(!branchId || branchId === 0) ? (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Warehouse className="w-5 h-5" />
                        <span>Stocks:</span>
                    </div>
                    <div className="pl-7 space-y-1">
                        {product.branchStocks.map((s) => (
                            <div key={s.id} className="flex justify-between">
                                <span className="text-foreground">{s.branchName}</span>
                                <span className="text-muted-foreground">
                                    {s.stockUnits} {getProductUnitTypeAbbreviation(product.unitType)} / {s.stockFractional.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                (() => {
                    const stock = product.branchStocks.find((s) => s.branchId === branchId);
                    return stock ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Warehouse className="w-5 h-5" />
                                <div className="flex justify-between w-full">
                                    <span>Stock:</span>
                                    <div className="flex justify-between text-muted-foreground font-medium">
                                        <span>
                                            {stock.stockUnits} {getProductUnitTypeAbbreviation(product.unitType)} / {stock.stockFractional.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null;
                })()
            )}

            {product.saleModes.length > 0 && <>
                <Separator />
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Package className="w-5 h-5" />
                        <span>Otros Modos de venta:</span>
                    </div>

                    {product.saleModes.map((m: ProductSaleModeResponse, i) => (
                        <div
                            key={i}
                            className="pl-7 grid grid-cols-3 gap-4 text-sm items-center"
                        >
                            <div className="flex items-center min-w-0">
                                <span className="font-medium inline-block overflow-hidden text-ellipsis max-w-[70px]">Modo: </span>
                                <span className="text-muted-foreground truncate ml-1">{getProductUnitTypeLabel(m.unitType)}</span>
                            </div>

                            <div className="flex items-center justify-center min-w-0">
                                <span className="font-medium inline-block overflow-hidden text-ellipsis max-w-[70px]">
                                    Contenido:
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap overflow-visible ml-1">
                                    {m.quantityEquivalent} {getProductUnitTypeAbbreviation(m.unitType)}
                                </span>
                            </div>

                            <div className="flex items-center justify-end min-w-0">
                                <span className="font-medium inline-block overflow-hidden text-ellipsis max-w-[70px]">
                                    Precio:
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap overflow-visible ml-1">
                                    S/. {m.price.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </>}

            {onClose && (
                <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            )}
        </div>
    )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium min-w-[90px]">{label}</span>
            <span className="text-muted-foreground truncate">{value}</span>
        </div>
    );
}

