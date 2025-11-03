package com.gaedet.biocampovet.core.sales.billable;

import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;
import com.gaedet.biocampovet.exeption.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class BillableServiceRegistry {

    private final Map<BillableServiceType, BillableServiceAdapter> adapters = new EnumMap<>(BillableServiceType.class);

    public BillableServiceRegistry(List<BillableServiceAdapter> adapterList) {
        if (adapterList != null) {
            adapterList.forEach(adapter -> adapters.put(adapter.supportsType(), adapter));
        }
    }

    public BillableServiceItem fetchItem(BillableServiceType type, Long itemId) {
        BillableServiceAdapter adapter = adapters.get(type);
        if (adapter == null) {
            throw new BadRequestException("Tipo de servicio facturable no soportado: " + type);
        }
        return adapter.getBillableItem(itemId);
    }

    public void markAsBilled(BillableServiceType type, Long itemId, Long saleDetailId) {
        BillableServiceAdapter adapter = adapters.get(type);
        if (adapter == null) {
            throw new BadRequestException("Tipo de servicio facturable no soportado: " + type);
        }
        adapter.markAsBilled(itemId, saleDetailId);
    }

    public void markAsUnbilled(BillableServiceType type, Long itemId) {
        BillableServiceAdapter adapter = adapters.get(type);
        if (adapter == null) {
            throw new BadRequestException("Tipo de servicio facturable no soportado: " + type);
        }
        adapter.markAsUnbilled(itemId);
    }
}
