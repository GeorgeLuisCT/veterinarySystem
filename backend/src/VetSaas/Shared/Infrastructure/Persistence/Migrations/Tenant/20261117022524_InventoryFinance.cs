using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VetSaas.Shared.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class InventoryFinance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "category_product",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_product", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "suppliers",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    ruc = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    website = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    supplier_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    bank_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    bank_account_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_suppliers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "treasury_accounts",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_treasury_accounts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    min_stock = table.Column<int>(type: "integer", nullable: false),
                    category_id = table.Column<long>(type: "bigint", nullable: false),
                    sku = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    presentation = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    unit_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    content_total = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_products", x => x.id);
                    table.ForeignKey(
                        name: "fk_products_category_product_category_id",
                        column: x => x.category_id,
                        principalTable: "category_product",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "accounts_payable",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    supplier_id = table.Column<long>(type: "bigint", nullable: true),
                    description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    issue_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    amount_paid = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_accounts_payable", x => x.id);
                    table.ForeignKey(
                        name: "fk_accounts_payable_suppliers_supplier_id",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inventory_movement",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    target_branch_id = table.Column<long>(type: "bigint", nullable: true),
                    supplier_id = table.Column<long>(type: "bigint", nullable: true),
                    employee_id = table.Column<long>(type: "bigint", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inventory_movement", x => x.id);
                    table.ForeignKey(
                        name: "fk_inventory_movement_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_inventory_movement_branches_target_branch_id",
                        column: x => x.target_branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_inventory_movement_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_inventory_movement_suppliers_supplier_id",
                        column: x => x.supplier_id,
                        principalTable: "suppliers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "treasury_account_movements",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    treasury_account_id = table.Column<long>(type: "bigint", nullable: false),
                    movement_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    movement_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_treasury_account_movements", x => x.id);
                    table.ForeignKey(
                        name: "fk_treasury_account_movements_treasury_accounts_treasury_accou",
                        column: x => x.treasury_account_id,
                        principalTable: "treasury_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "product_administration_routes",
                columns: table => new
                {
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    route = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_administration_routes", x => new { x.product_id, x.route });
                    table.ForeignKey(
                        name: "fk_product_administration_routes_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_batch",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    batch_number = table.Column<string>(type: "text", nullable: false),
                    expiration_date = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_batch", x => x.id);
                    table.ForeignKey(
                        name: "fk_product_batch_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "product_branch",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_branch", x => x.id);
                    table.ForeignKey(
                        name: "fk_product_branch_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_branch_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_sale_mode",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    unit_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    quantity_equivalent = table.Column<double>(type: "double precision", nullable: false),
                    price = table.Column<decimal>(type: "numeric(19,2)", precision: 19, scale: 2, nullable: false),
                    is_base_mode = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_sale_mode", x => x.id);
                    table.ForeignKey(
                        name: "fk_product_sale_mode_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "account_payable_payments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    account_payable_id = table.Column<long>(type: "bigint", nullable: false),
                    treasury_account_id = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    payment_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    notes = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_account_payable_payments", x => x.id);
                    table.ForeignKey(
                        name: "fk_account_payable_payments_accounts_payable_account_payable_id",
                        column: x => x.account_payable_id,
                        principalTable: "accounts_payable",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_account_payable_payments_treasury_accounts_treasury_account",
                        column: x => x.treasury_account_id,
                        principalTable: "treasury_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inventory_movement_product",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    movement_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    unit_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    quantity = table.Column<double>(type: "double precision", nullable: false),
                    unit_cost = table.Column<decimal>(type: "numeric(19,2)", precision: 19, scale: 2, nullable: true),
                    product_batch_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inventory_movement_product", x => x.id);
                    table.ForeignKey(
                        name: "fk_inventory_movement_product_inventory_movement_movement_id",
                        column: x => x.movement_id,
                        principalTable: "inventory_movement",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_inventory_movement_product_product_batch_product_batch_id",
                        column: x => x.product_batch_id,
                        principalTable: "product_batch",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_inventory_movement_product_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "kardex_movement",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    batch_id = table.Column<long>(type: "bigint", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    resulting_stock = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    origin_id = table.Column<long>(type: "bigint", nullable: false),
                    origin_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_kardex_movement", x => x.id);
                    table.ForeignKey(
                        name: "fk_kardex_movement_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_kardex_movement_product_batch_batch_id",
                        column: x => x.batch_id,
                        principalTable: "product_batch",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_kardex_movement_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_account_payable_payments_account_payable_id",
                table: "account_payable_payments",
                column: "account_payable_id");

            migrationBuilder.CreateIndex(
                name: "ix_account_payable_payments_treasury_account_id",
                table: "account_payable_payments",
                column: "treasury_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_accounts_payable_supplier_id",
                table: "accounts_payable",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "ix_category_product_name",
                table: "category_product",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_branch_id",
                table: "inventory_movement",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_date",
                table: "inventory_movement",
                column: "date");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_employee_id",
                table: "inventory_movement",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_supplier_id",
                table: "inventory_movement",
                column: "supplier_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_target_branch_id",
                table: "inventory_movement",
                column: "target_branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_product_movement_id",
                table: "inventory_movement_product",
                column: "movement_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_product_product_batch_id",
                table: "inventory_movement_product",
                column: "product_batch_id");

            migrationBuilder.CreateIndex(
                name: "ix_inventory_movement_product_product_id",
                table: "inventory_movement_product",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_kardex_movement_batch_id",
                table: "kardex_movement",
                column: "batch_id");

            migrationBuilder.CreateIndex(
                name: "ix_kardex_movement_branch_id",
                table: "kardex_movement",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_kardex_movement_origin_type_origin_id",
                table: "kardex_movement",
                columns: new[] { "origin_type", "origin_id" });

            migrationBuilder.CreateIndex(
                name: "ix_kardex_movement_product_id_branch_id_batch_id",
                table: "kardex_movement",
                columns: new[] { "product_id", "branch_id", "batch_id" });

            migrationBuilder.CreateIndex(
                name: "ix_product_batch_product_id_batch_number",
                table: "product_batch",
                columns: new[] { "product_id", "batch_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_product_branch_branch_id",
                table: "product_branch",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_branch_product_id_branch_id",
                table: "product_branch",
                columns: new[] { "product_id", "branch_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uk_product_base_mode",
                table: "product_sale_mode",
                columns: new[] { "product_id", "unit_type" },
                unique: true,
                filter: "is_base_mode IS TRUE");

            migrationBuilder.CreateIndex(
                name: "ix_products_category_id",
                table: "products",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_products_sku",
                table: "products",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_treasury_account_movements_treasury_account_id",
                table: "treasury_account_movements",
                column: "treasury_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_treasury_accounts_name",
                table: "treasury_accounts",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "account_payable_payments");

            migrationBuilder.DropTable(
                name: "inventory_movement_product");

            migrationBuilder.DropTable(
                name: "kardex_movement");

            migrationBuilder.DropTable(
                name: "product_administration_routes");

            migrationBuilder.DropTable(
                name: "product_branch");

            migrationBuilder.DropTable(
                name: "product_sale_mode");

            migrationBuilder.DropTable(
                name: "treasury_account_movements");

            migrationBuilder.DropTable(
                name: "accounts_payable");

            migrationBuilder.DropTable(
                name: "inventory_movement");

            migrationBuilder.DropTable(
                name: "product_batch");

            migrationBuilder.DropTable(
                name: "treasury_accounts");

            migrationBuilder.DropTable(
                name: "suppliers");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "category_product");
        }
    }
}
