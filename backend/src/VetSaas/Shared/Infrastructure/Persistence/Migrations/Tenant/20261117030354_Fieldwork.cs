using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VetSaas.Shared.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class Fieldwork : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "geo_zones",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    parent_id = table.Column<long>(type: "bigint", nullable: true),
                    gps_coordinates = table.Column<string>(type: "text", nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_geo_zones", x => x.id);
                    table.ForeignKey(
                        name: "fk_geo_zones_geo_zones_parent_id",
                        column: x => x.parent_id,
                        principalTable: "geo_zones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicles",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    license_plate = table.Column<string>(type: "text", nullable: true),
                    assigned_vet_employee_id = table.Column<long>(type: "bigint", nullable: true),
                    home_branch_id = table.Column<long>(type: "bigint", nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicles", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicles_branches_home_branch_id",
                        column: x => x.home_branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicles_employees_assigned_vet_employee_id",
                        column: x => x.assigned_vet_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "farms",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    customer_id = table.Column<long>(type: "bigint", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    zone_id = table.Column<long>(type: "bigint", nullable: true),
                    location_description = table.Column<string>(type: "text", nullable: true),
                    gps_coordinates = table.Column<string>(type: "text", nullable: true),
                    address_label = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_farms", x => x.id);
                    table.ForeignKey(
                        name: "fk_farms_customer_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_farms_geo_zones_zone_id",
                        column: x => x.zone_id,
                        principalTable: "geo_zones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_route_day",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    employee_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: true),
                    route_date = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_route_day", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_route_day_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_route_day_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "product_vehicle_stock",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_vehicle_stock", x => x.id);
                    table.ForeignKey(
                        name: "fk_product_vehicle_stock_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_vehicle_stock_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vehicle_location_ping",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: false),
                    employee_id = table.Column<long>(type: "bigint", nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: false),
                    longitude = table.Column<double>(type: "double precision", nullable: false),
                    speed_kmh = table.Column<double>(type: "double precision", nullable: true),
                    note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehicle_location_ping", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehicle_location_ping_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_vehicle_location_ping_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_visits",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    farm_id = table.Column<long>(type: "bigint", nullable: true),
                    zone_id = table.Column<long>(type: "bigint", nullable: true),
                    field_vet_employee_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: true),
                    scheduled_date_time = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    start_date_time = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    end_date_time = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    objective = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    route_order = table.Column<int>(type: "integer", nullable: true),
                    report_summary = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visits", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visits_employees_field_vet_employee_id",
                        column: x => x.field_vet_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visits_farms_farm_id",
                        column: x => x.farm_id,
                        principalTable: "farms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visits_geo_zones_zone_id",
                        column: x => x.zone_id,
                        principalTable: "geo_zones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visits_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_route_stop",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    route_day_id = table.Column<long>(type: "bigint", nullable: false),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    eta = table.Column<TimeOnly>(type: "time without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_route_stop", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_route_stop_field_route_day_route_day_id",
                        column: x => x.route_day_id,
                        principalTable: "field_route_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_field_route_stop_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_tasks",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "text", nullable: false),
                    farm_id = table.Column<long>(type: "bigint", nullable: false),
                    zone_id = table.Column<long>(type: "bigint", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    priority = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    assigned_to = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    due_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    created_field_visit_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_tasks", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_tasks_employees_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_tasks_employees_created_by",
                        column: x => x.created_by,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_tasks_farms_farm_id",
                        column: x => x.farm_id,
                        principalTable: "farms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_tasks_field_visits_created_field_visit_id",
                        column: x => x.created_field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_tasks_geo_zones_zone_id",
                        column: x => x.zone_id,
                        principalTable: "geo_zones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_team_status",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    employee_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    current_visit_id = table.Column<long>(type: "bigint", nullable: true),
                    location_text = table.Column<string>(type: "text", nullable: true),
                    gps_coordinates = table.Column<string>(type: "text", nullable: true),
                    last_ping_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_team_status", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_team_status_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_team_status_field_visits_current_visit_id",
                        column: x => x.current_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_attachments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    file_name = table.Column<string>(type: "text", nullable: false),
                    file_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    mime_type = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_attachments", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_attachments_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_biosecurity",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_and_equipment_cleaned = table.Column<bool>(type: "boolean", nullable: false),
                    ppe_used = table.Column<bool>(type: "boolean", nullable: false),
                    hand_hygiene = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_biosecurity", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_biosecurity_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_companions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    employee_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_companions", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_companions_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visit_companions_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_product_usage",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    quantity_used = table.Column<int>(type: "integer", nullable: false),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: true),
                    subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_product_usage", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_product_usage_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_field_visit_product_usage_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visit_product_usage_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_report",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    findings = table.Column<string>(type: "text", nullable: true),
                    diagnoses = table.Column<string>(type: "text", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_report", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_report_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_service_items",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: false),
                    performed_by = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_service_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_service_items_clinical_services_clinical_servic",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visit_service_items_employees_performed_by",
                        column: x => x.performed_by,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visit_service_items_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_stock_movements",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    movement_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    quantity_delta = table.Column<int>(type: "integer", nullable: false),
                    from_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    to_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: true),
                    branch_id = table.Column<long>(type: "bigint", nullable: true),
                    field_visit_id = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_stock_movements", x => x.id);
                    table.ForeignKey(
                        name: "fk_product_stock_movements_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_stock_movements_employees_created_by",
                        column: x => x.created_by,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_stock_movements_field_visits_field_visit_id",
                        column: x => x.field_visit_id,
                        principalTable: "field_visits",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_stock_movements_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_stock_movements_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "vehicles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_service_animals",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    service_item_id = table.Column<long>(type: "bigint", nullable: false),
                    animal_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_service_animals", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_service_animals_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_field_visit_service_animals_field_visit_service_items_servi",
                        column: x => x.service_item_id,
                        principalTable: "field_visit_service_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_service_groups",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    service_item_id = table.Column<long>(type: "bigint", nullable: false),
                    species = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    breed = table.Column<string>(type: "text", nullable: true),
                    quantity = table.Column<int>(type: "integer", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_service_groups", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_service_groups_field_visit_service_items_servic",
                        column: x => x.service_item_id,
                        principalTable: "field_visit_service_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "field_visit_service_products",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    service_item_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    dose = table.Column<decimal>(type: "numeric(12,3)", precision: 19, scale: 2, nullable: true),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    administration_route = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_field_visit_service_products", x => x.id);
                    table.ForeignKey(
                        name: "fk_field_visit_service_products_field_visit_service_items_serv",
                        column: x => x.service_item_id,
                        principalTable: "field_visit_service_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_field_visit_service_products_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_farms_customer_id",
                table: "farms",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_farms_zone_id",
                table: "farms",
                column: "zone_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_route_day_employee_id_route_date",
                table: "field_route_day",
                columns: new[] { "employee_id", "route_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_route_day_vehicle_id",
                table: "field_route_day",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_route_stop_field_visit_id",
                table: "field_route_stop",
                column: "field_visit_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_route_stop_route_day_id",
                table: "field_route_stop",
                column: "route_day_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_assigned_to",
                table: "field_tasks",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_created_by",
                table: "field_tasks",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_created_field_visit_id",
                table: "field_tasks",
                column: "created_field_visit_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_farm_id",
                table: "field_tasks",
                column: "farm_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_priority",
                table: "field_tasks",
                column: "priority");

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_status",
                table: "field_tasks",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_field_tasks_zone_id",
                table: "field_tasks",
                column: "zone_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_team_status_current_visit_id",
                table: "field_team_status",
                column: "current_visit_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_team_status_employee_id",
                table: "field_team_status",
                column: "employee_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_attachments_field_visit_id",
                table: "field_visit_attachments",
                column: "field_visit_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_biosecurity_field_visit_id",
                table: "field_visit_biosecurity",
                column: "field_visit_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_companions_employee_id",
                table: "field_visit_companions",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_companions_field_visit_id_employee_id",
                table: "field_visit_companions",
                columns: new[] { "field_visit_id", "employee_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_product_usage_field_visit_id",
                table: "field_visit_product_usage",
                column: "field_visit_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_product_usage_product_id",
                table: "field_visit_product_usage",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_product_usage_vehicle_id",
                table: "field_visit_product_usage",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_report_field_visit_id",
                table: "field_visit_report",
                column: "field_visit_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_animals_animal_id",
                table: "field_visit_service_animals",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_animals_service_item_id",
                table: "field_visit_service_animals",
                column: "service_item_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_groups_service_item_id",
                table: "field_visit_service_groups",
                column: "service_item_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_items_clinical_service_id",
                table: "field_visit_service_items",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_items_field_visit_id",
                table: "field_visit_service_items",
                column: "field_visit_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_items_performed_by",
                table: "field_visit_service_items",
                column: "performed_by");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_products_product_id",
                table: "field_visit_service_products",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visit_service_products_service_item_id",
                table: "field_visit_service_products",
                column: "service_item_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visits_farm_id",
                table: "field_visits",
                column: "farm_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visits_field_vet_employee_id",
                table: "field_visits",
                column: "field_vet_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visits_scheduled_date_time",
                table: "field_visits",
                column: "scheduled_date_time");

            migrationBuilder.CreateIndex(
                name: "ix_field_visits_status",
                table: "field_visits",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_field_visits_vehicle_id",
                table: "field_visits",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_field_visits_zone_id",
                table: "field_visits",
                column: "zone_id");

            migrationBuilder.CreateIndex(
                name: "ix_geo_zones_name_parent_id",
                table: "geo_zones",
                columns: new[] { "name", "parent_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_geo_zones_parent_id",
                table: "geo_zones",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_branch_id",
                table: "product_stock_movements",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_created_at",
                table: "product_stock_movements",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_created_by",
                table: "product_stock_movements",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_field_visit_id",
                table: "product_stock_movements",
                column: "field_visit_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_movement_type",
                table: "product_stock_movements",
                column: "movement_type");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_product_id",
                table: "product_stock_movements",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_stock_movements_vehicle_id",
                table: "product_stock_movements",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_vehicle_stock_product_id",
                table: "product_vehicle_stock",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_vehicle_stock_vehicle_id_product_id",
                table: "product_vehicle_stock",
                columns: new[] { "vehicle_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_location_ping_employee_id",
                table: "vehicle_location_ping",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_location_ping_timestamp",
                table: "vehicle_location_ping",
                column: "timestamp");

            migrationBuilder.CreateIndex(
                name: "ix_vehicle_location_ping_vehicle_id",
                table: "vehicle_location_ping",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicles_assigned_vet_employee_id",
                table: "vehicles",
                column: "assigned_vet_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicles_home_branch_id",
                table: "vehicles",
                column: "home_branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehicles_license_plate",
                table: "vehicles",
                column: "license_plate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vehicles_name",
                table: "vehicles",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "field_route_stop");

            migrationBuilder.DropTable(
                name: "field_tasks");

            migrationBuilder.DropTable(
                name: "field_team_status");

            migrationBuilder.DropTable(
                name: "field_visit_attachments");

            migrationBuilder.DropTable(
                name: "field_visit_biosecurity");

            migrationBuilder.DropTable(
                name: "field_visit_companions");

            migrationBuilder.DropTable(
                name: "field_visit_product_usage");

            migrationBuilder.DropTable(
                name: "field_visit_report");

            migrationBuilder.DropTable(
                name: "field_visit_service_animals");

            migrationBuilder.DropTable(
                name: "field_visit_service_groups");

            migrationBuilder.DropTable(
                name: "field_visit_service_products");

            migrationBuilder.DropTable(
                name: "product_stock_movements");

            migrationBuilder.DropTable(
                name: "product_vehicle_stock");

            migrationBuilder.DropTable(
                name: "vehicle_location_ping");

            migrationBuilder.DropTable(
                name: "field_route_day");

            migrationBuilder.DropTable(
                name: "field_visit_service_items");

            migrationBuilder.DropTable(
                name: "field_visits");

            migrationBuilder.DropTable(
                name: "farms");

            migrationBuilder.DropTable(
                name: "vehicles");

            migrationBuilder.DropTable(
                name: "geo_zones");
        }
    }
}
