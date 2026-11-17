using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VetSaas.Shared.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class SalesCashbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cash_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    cashier_id = table.Column<long>(type: "bigint", nullable: false),
                    opened_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    opening_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    closed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    calculated_closing_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: true),
                    counted_closing_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: true),
                    difference_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: true),
                    closing_notes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cash_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_cash_sessions_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_cash_sessions_users_cashier_id",
                        column: x => x.cashier_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sales",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    seller_id = table.Column<long>(type: "bigint", nullable: false),
                    customer_id = table.Column<long>(type: "bigint", nullable: true),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    document_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    document_number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    tax_total = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    grand_total = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    voided_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    void_reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    source_attention_id = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sales", x => x.id);
                    table.ForeignKey(
                        name: "fk_sales_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sales_customer_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sales_users_seller_id",
                        column: x => x.seller_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cash_session_movements",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    cash_session_id = table.Column<long>(type: "bigint", nullable: false),
                    movement_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    reason = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    registered_by_id = table.Column<long>(type: "bigint", nullable: false),
                    registered_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cash_session_movements", x => x.id);
                    table.ForeignKey(
                        name: "fk_cash_session_movements_cash_sessions_cash_session_id",
                        column: x => x.cash_session_id,
                        principalTable: "cash_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_cash_session_movements_users_registered_by_id",
                        column: x => x.registered_by_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sale_details",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sale_id = table.Column<long>(type: "bigint", nullable: false),
                    item_description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(14,3)", precision: 19, scale: 2, nullable: false),
                    line_subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    tax_rate = table.Column<decimal>(type: "numeric(6,4)", precision: 19, scale: 2, nullable: true),
                    tax_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: true),
                    product_id = table.Column<long>(type: "bigint", nullable: true),
                    sale_mode_id = table.Column<long>(type: "bigint", nullable: true),
                    product_batch_id = table.Column<long>(type: "bigint", nullable: true),
                    unit_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    service_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    service_item_id = table.Column<long>(type: "bigint", nullable: true),
                    metadata_json = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sale_details", x => x.id);
                    table.ForeignKey(
                        name: "fk_sale_details_product_batch_product_batch_id",
                        column: x => x.product_batch_id,
                        principalTable: "product_batch",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sale_details_product_sale_mode_sale_mode_id",
                        column: x => x.sale_mode_id,
                        principalTable: "product_sale_mode",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sale_details_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sale_details_sales_sale_id",
                        column: x => x.sale_id,
                        principalTable: "sales",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sale_payments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sale_id = table.Column<long>(type: "bigint", nullable: false),
                    amount_paid = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    payment_method = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    paid_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    payment_reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    cash_session_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sale_payments", x => x.id);
                    table.ForeignKey(
                        name: "fk_sale_payments_cash_sessions_cash_session_id",
                        column: x => x.cash_session_id,
                        principalTable: "cash_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_sale_payments_sales_sale_id",
                        column: x => x.sale_id,
                        principalTable: "sales",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_cash_session_movements_cash_session_id",
                table: "cash_session_movements",
                column: "cash_session_id");

            migrationBuilder.CreateIndex(
                name: "ix_cash_session_movements_registered_by_id",
                table: "cash_session_movements",
                column: "registered_by_id");

            migrationBuilder.CreateIndex(
                name: "idx_cash_session_branch_status",
                table: "cash_sessions",
                columns: new[] { "branch_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_cash_session_cashier",
                table: "cash_sessions",
                column: "cashier_id");

            migrationBuilder.CreateIndex(
                name: "ux_cash_session_one_open_per_branch",
                table: "cash_sessions",
                column: "branch_id",
                unique: true,
                filter: "status = 'OPEN'");

            migrationBuilder.CreateIndex(
                name: "ix_sale_details_product_batch_id",
                table: "sale_details",
                column: "product_batch_id");

            migrationBuilder.CreateIndex(
                name: "ix_sale_details_product_id",
                table: "sale_details",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_sale_details_sale_id",
                table: "sale_details",
                column: "sale_id");

            migrationBuilder.CreateIndex(
                name: "ix_sale_details_sale_mode_id",
                table: "sale_details",
                column: "sale_mode_id");

            migrationBuilder.CreateIndex(
                name: "ix_sale_details_service_type_service_item_id",
                table: "sale_details",
                columns: new[] { "service_type", "service_item_id" });

            migrationBuilder.CreateIndex(
                name: "ix_sale_payments_cash_session_id",
                table: "sale_payments",
                column: "cash_session_id");

            migrationBuilder.CreateIndex(
                name: "ix_sale_payments_sale_id",
                table: "sale_payments",
                column: "sale_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_branch_id_status",
                table: "sales",
                columns: new[] { "branch_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_customer_id",
                table: "sales",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_document_type_document_number",
                table: "sales",
                columns: new[] { "document_type", "document_number" });

            migrationBuilder.CreateIndex(
                name: "ix_sales_seller_id",
                table: "sales",
                column: "seller_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cash_session_movements");

            migrationBuilder.DropTable(
                name: "sale_details");

            migrationBuilder.DropTable(
                name: "sale_payments");

            migrationBuilder.DropTable(
                name: "cash_sessions");

            migrationBuilder.DropTable(
                name: "sales");
        }
    }
}
