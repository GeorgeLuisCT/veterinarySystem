package com.gaedet.biocampovet.core.fieltd.enums;

public enum StockMovementType {
    LOAD_TO_VEHICLE,     // de almacén → vehículo (carga)
    UNLOAD_TO_WAREHOUSE, // de vehículo → almacén (devolución)
    CONSUMPTION,         // consumo durante una visita
    ADJUSTMENT           // ajustes manuales
}