CREATE UNIQUE INDEX IF NOT EXISTS uk_product_base_mode
    ON product_sale_mode (product_id, unit_type)
    WHERE (is_base_mode IS TRUE);
