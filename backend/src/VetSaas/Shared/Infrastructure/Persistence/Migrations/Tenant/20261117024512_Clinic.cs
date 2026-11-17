using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VetSaas.Shared.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class Clinic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    employee_id = table.Column<long>(type: "bigint", nullable: true),
                    start_date_time = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    estimated_duration_minutes = table.Column<int>(type: "integer", nullable: true),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    requester_name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    requester_email = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    requester_phone = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    request_notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointments", x => x.id);
                    table.ForeignKey(
                        name: "fk_appointments_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_appointments_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_appointments_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cages",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    size = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    is_occupied = table.Column<bool>(type: "boolean", nullable: false),
                    branch_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cages", x => x.id);
                    table.ForeignKey(
                        name: "fk_cages_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "clinical_services",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    clinical_service_category = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<decimal>(type: "numeric(19,2)", precision: 19, scale: 2, nullable: false),
                    reminder_period = table.Column<int>(type: "integer", nullable: true),
                    reminder_period_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    required_sample_types = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_services", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "health_plans",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    price = table.Column<decimal>(type: "numeric(19,2)", precision: 19, scale: 2, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_health_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "laboratory_tests",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    active = table.Column<bool>(type: "boolean", nullable: false),
                    price = table.Column<decimal>(type: "numeric(10,2)", precision: 19, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_laboratory_tests", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "prescription_templates",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    purpose = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prescription_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "reminders",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    reminder_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    due_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reminders", x => x.id);
                    table.ForeignKey(
                        name: "fk_reminders_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "branch_clinical_services",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_branch_clinical_services", x => x.id);
                    table.ForeignKey(
                        name: "fk_branch_clinical_services_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_branch_clinical_services_clinical_services_clinical_service",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "clinical_appointment_details",
                columns: table => new
                {
                    appointment_id = table.Column<long>(type: "bigint", nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    veterinarian_id = table.Column<long>(type: "bigint", nullable: false),
                    consultation_reason = table.Column<string>(type: "text", nullable: true),
                    clinical_notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_appointment_details", x => x.appointment_id);
                    table.ForeignKey(
                        name: "fk_clinical_appointment_details_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_clinical_appointment_details_clinical_services_clinical_ser",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_appointment_details_employees_veterinarian_id",
                        column: x => x.veterinarian_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "clinical_service_required_products",
                columns: table => new
                {
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    required_products_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_service_required_products", x => new { x.clinical_service_id, x.required_products_id });
                    table.ForeignKey(
                        name: "fk_clinical_service_required_products_clinical_services_clinic",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_clinical_service_required_products_products_required_produc",
                        column: x => x.required_products_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "grooming_appointment_details",
                columns: table => new
                {
                    appointment_id = table.Column<long>(type: "bigint", nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    stylist_id = table.Column<long>(type: "bigint", nullable: false),
                    owner_special_notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grooming_appointment_details", x => x.appointment_id);
                    table.ForeignKey(
                        name: "fk_grooming_appointment_details_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_grooming_appointment_details_clinical_services_clinical_ser",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_grooming_appointment_details_employees_stylist_id",
                        column: x => x.stylist_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "medical_record_entries",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    category = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: true),
                    source_id = table.Column<long>(type: "bigint", nullable: true),
                    title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    branch_id = table.Column<long>(type: "bigint", nullable: true),
                    created_by_employee_id = table.Column<long>(type: "bigint", nullable: true),
                    visibility = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medical_record_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_medical_record_entries_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_medical_record_entries_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_medical_record_entries_clinical_services_clinical_service_id",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_medical_record_entries_employees_created_by_employee_id",
                        column: x => x.created_by_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "health_plan_service_items",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    health_plan_id = table.Column<long>(type: "bigint", nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_health_plan_service_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_health_plan_service_items_clinical_services_clinical_servic",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_health_plan_service_items_health_plans_health_plan_id",
                        column: x => x.health_plan_id,
                        principalTable: "health_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "laboratory_test_laboratories",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    laboratory_test_id = table.Column<long>(type: "bigint", nullable: false),
                    laboratory_id = table.Column<long>(type: "bigint", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_laboratory_test_laboratories", x => x.id);
                    table.ForeignKey(
                        name: "fk_laboratory_test_laboratories_laboratories_laboratory_id",
                        column: x => x.laboratory_id,
                        principalTable: "laboratories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_laboratory_test_laboratories_laboratory_tests_laboratory_te",
                        column: x => x.laboratory_test_id,
                        principalTable: "laboratory_tests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "laboratory_test_parameters",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    test_id = table.Column<long>(type: "bigint", nullable: false),
                    name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    value_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    allowed_options = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    ref_min = table.Column<double>(type: "double precision", nullable: true),
                    ref_max = table.Column<double>(type: "double precision", nullable: true),
                    ref_text = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    species = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    sex = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    age_min_months = table.Column<int>(type: "integer", nullable: true),
                    age_max_months = table.Column<int>(type: "integer", nullable: true),
                    decimals = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_laboratory_test_parameters", x => x.id);
                    table.ForeignKey(
                        name: "fk_laboratory_test_parameters_laboratory_tests_test_id",
                        column: x => x.test_id,
                        principalTable: "laboratory_tests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prescription_template_medications",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    prescription_template_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: true),
                    custom_medication_name = table.Column<string>(type: "text", nullable: true),
                    dosage_amount = table.Column<decimal>(type: "numeric(12,3)", precision: 19, scale: 2, nullable: false),
                    dosage_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    frequency_value = table.Column<int>(type: "integer", nullable: false),
                    frequency_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    duration_value = table.Column<int>(type: "integer", nullable: false),
                    duration_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    instructions = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prescription_template_medications", x => x.id);
                    table.ForeignKey(
                        name: "fk_prescription_template_medications_prescription_templates_pr",
                        column: x => x.prescription_template_id,
                        principalTable: "prescription_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prescription_template_medications_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "anesthetic_drugs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    surgical_report_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    phase = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    dose_amount = table.Column<decimal>(type: "numeric(10,4)", precision: 19, scale: 2, nullable: false),
                    dose_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    route = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_anesthetic_drugs", x => x.id);
                    table.ForeignKey(
                        name: "fk_anesthetic_drugs_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "attentions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    appointment_id = table.Column<long>(type: "bigint", nullable: true),
                    branch_id = table.Column<long>(type: "bigint", nullable: false),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    attending_employee_id = table.Column<long>(type: "bigint", nullable: false),
                    surgical_order_id = table.Column<long>(type: "bigint", nullable: true),
                    check_in_time = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    is_emergency = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_attentions", x => x.id);
                    table.ForeignKey(
                        name: "fk_attentions_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_attentions_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_attentions_branches_branch_id",
                        column: x => x.branch_id,
                        principalTable: "branches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_attentions_clinical_services_clinical_service_id",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_attentions_employees_attending_employee_id",
                        column: x => x.attending_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "clinical_attention",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    attention_id = table.Column<long>(type: "bigint", nullable: false),
                    visit_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    subjective = table.Column<string>(type: "text", nullable: true),
                    objective = table.Column<string>(type: "text", nullable: true),
                    assessment = table.Column<string>(type: "text", nullable: true),
                    plan = table.Column<string>(type: "text", nullable: true),
                    weight_kg = table.Column<double>(type: "double precision", nullable: true),
                    temperature_celsius = table.Column<double>(type: "double precision", nullable: true),
                    heart_rate = table.Column<int>(type: "integer", nullable: true),
                    respiratory_rate = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_attention", x => x.id);
                    table.ForeignKey(
                        name: "fk_clinical_attention_attentions_attention_id",
                        column: x => x.attention_id,
                        principalTable: "attentions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "grooming_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    attention_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    finished_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    assigned_professional_id = table.Column<long>(type: "bigint", nullable: true),
                    charged_price = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: true),
                    sale_detail_id = table.Column<long>(type: "bigint", nullable: true),
                    behavior_notes = table.Column<string>(type: "text", nullable: true),
                    clinical_observations = table.Column<string>(type: "text", nullable: true),
                    photo_urls = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grooming_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_grooming_sessions_attentions_attention_id",
                        column: x => x.attention_id,
                        principalTable: "attentions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_grooming_sessions_employees_assigned_professional_id",
                        column: x => x.assigned_professional_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "hospitalizations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    cage_id = table.Column<long>(type: "bigint", nullable: false),
                    attention_id = table.Column<long>(type: "bigint", nullable: true),
                    admission_timing = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    cause = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: true),
                    admission_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    discharge_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    admission_notes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hospitalizations", x => x.id);
                    table.ForeignKey(
                        name: "fk_hospitalizations_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hospitalizations_attentions_attention_id",
                        column: x => x.attention_id,
                        principalTable: "attentions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hospitalizations_cages_cage_id",
                        column: x => x.cage_id,
                        principalTable: "cages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hospitalizations_clinical_services_clinical_service_id",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "surgical_reports",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    attention_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    surgery_start_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    surgery_end_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    surgeon_id = table.Column<long>(type: "bigint", nullable: true),
                    anesthesiologist_id = table.Column<long>(type: "bigint", nullable: true),
                    operating_room_id = table.Column<long>(type: "bigint", nullable: true),
                    assistant_id = table.Column<long>(type: "bigint", nullable: true),
                    monitoring = table.Column<string>(type: "text", nullable: true),
                    findings = table.Column<string>(type: "text", nullable: true),
                    surgical_technique_description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_surgical_reports", x => x.id);
                    table.ForeignKey(
                        name: "fk_surgical_reports_attentions_attention_id",
                        column: x => x.attention_id,
                        principalTable: "attentions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_reports_employees_anesthesiologist_id",
                        column: x => x.anesthesiologist_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_reports_employees_assistant_id",
                        column: x => x.assistant_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_reports_employees_surgeon_id",
                        column: x => x.surgeon_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_reports_operating_rooms_operating_room_id",
                        column: x => x.operating_room_id,
                        principalTable: "operating_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "clinical_service_items",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    clinical_attention_id = table.Column<long>(type: "bigint", nullable: false),
                    clinical_service_id = table.Column<long>(type: "bigint", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    sale_detail_id = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_service_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_clinical_service_items_clinical_attention_clinical_attentio",
                        column: x => x.clinical_attention_id,
                        principalTable: "clinical_attention",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_clinical_service_items_clinical_services_clinical_service_id",
                        column: x => x.clinical_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "laboratory_requests",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    clinical_attention_id = table.Column<long>(type: "bigint", nullable: true),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    requesting_employee_id = table.Column<long>(type: "bigint", nullable: true),
                    laboratory_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    clinical_notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_laboratory_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_laboratory_requests_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_laboratory_requests_clinical_attention_clinical_attention_id",
                        column: x => x.clinical_attention_id,
                        principalTable: "clinical_attention",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_laboratory_requests_employees_requesting_employee_id",
                        column: x => x.requesting_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_laboratory_requests_laboratories_laboratory_id",
                        column: x => x.laboratory_id,
                        principalTable: "laboratories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "medication_administrations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    administered_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    dose_amount = table.Column<decimal>(type: "numeric(10,2)", precision: 19, scale: 2, nullable: true),
                    dose_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    route = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    frequency_value = table.Column<int>(type: "integer", nullable: true),
                    frequency_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    administered_by_employee_id = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    clinical_attention_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medication_administrations", x => x.id);
                    table.ForeignKey(
                        name: "fk_medication_administrations_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_medication_administrations_clinical_attention_clinical_atte",
                        column: x => x.clinical_attention_id,
                        principalTable: "clinical_attention",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_medication_administrations_employees_administered_by_employ",
                        column: x => x.administered_by_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_medication_administrations_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "surgical_orders",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    animal_id = table.Column<long>(type: "bigint", nullable: false),
                    recommended_service_id = table.Column<long>(type: "bigint", nullable: false),
                    requested_by_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    clinical_attention_id = table.Column<long>(type: "bigint", nullable: true),
                    operating_room_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_surgical_orders", x => x.id);
                    table.ForeignKey(
                        name: "fk_surgical_orders_animal_animal_id",
                        column: x => x.animal_id,
                        principalTable: "animal",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_orders_clinical_attention_clinical_attention_id",
                        column: x => x.clinical_attention_id,
                        principalTable: "clinical_attention",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_surgical_orders_clinical_services_recommended_service_id",
                        column: x => x.recommended_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_orders_employees_requested_by_id",
                        column: x => x.requested_by_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_orders_operating_rooms_operating_room_id",
                        column: x => x.operating_room_id,
                        principalTable: "operating_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "grooming_materials_used",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    grooming_session_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: true),
                    unregistered_product_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    quantity = table.Column<decimal>(type: "numeric(12,3)", precision: 19, scale: 2, nullable: false),
                    unit_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: true),
                    subtotal = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_grooming_materials_used", x => x.id);
                    table.ForeignKey(
                        name: "fk_grooming_materials_used_grooming_sessions_grooming_session_",
                        column: x => x.grooming_session_id,
                        principalTable: "grooming_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_grooming_materials_used_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "evolution_notes",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hospitalization_id = table.Column<long>(type: "bigint", nullable: false),
                    author_employee_id = table.Column<long>(type: "bigint", nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    note = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_evolution_notes", x => x.id);
                    table.ForeignKey(
                        name: "fk_evolution_notes_employees_author_employee_id",
                        column: x => x.author_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_evolution_notes_hospitalizations_hospitalization_id",
                        column: x => x.hospitalization_id,
                        principalTable: "hospitalizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hospitalization_vital_signs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hospitalization_id = table.Column<long>(type: "bigint", nullable: false),
                    recorded_by_employee_id = table.Column<long>(type: "bigint", nullable: false),
                    recorded_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    weight_kg = table.Column<double>(type: "double precision", nullable: true),
                    temperature_celsius = table.Column<double>(type: "double precision", nullable: true),
                    heart_rate = table.Column<int>(type: "integer", nullable: true),
                    respiratory_rate = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_hospitalization_vital_signs", x => x.id);
                    table.ForeignKey(
                        name: "fk_hospitalization_vital_signs_employees_recorded_by_employee_",
                        column: x => x.recorded_by_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_hospitalization_vital_signs_hospitalizations_hospitalizatio",
                        column: x => x.hospitalization_id,
                        principalTable: "hospitalizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "treatment_schedules",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    hospitalization_id = table.Column<long>(type: "bigint", nullable: false),
                    treatment_name = table.Column<string>(type: "text", nullable: false),
                    scheduled_time = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    is_completed = table.Column<bool>(type: "boolean", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    completed_by_employee_id = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_treatment_schedules", x => x.id);
                    table.ForeignKey(
                        name: "fk_treatment_schedules_employees_completed_by_employee_id",
                        column: x => x.completed_by_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_treatment_schedules_hospitalizations_hospitalization_id",
                        column: x => x.hospitalization_id,
                        principalTable: "hospitalizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "post_operative_indications",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    surgical_report_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: true),
                    non_drug_instruction = table.Column<string>(type: "text", nullable: true),
                    dose_amount = table.Column<decimal>(type: "numeric(10,4)", precision: 19, scale: 2, nullable: true),
                    dose_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    frequency_value = table.Column<int>(type: "integer", nullable: true),
                    frequency_unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    route = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_post_operative_indications", x => x.id);
                    table.ForeignKey(
                        name: "fk_post_operative_indications_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_post_operative_indications_surgical_reports_surgical_report",
                        column: x => x.surgical_report_id,
                        principalTable: "surgical_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "surgical_materials",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    surgical_report_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: true),
                    unregistered_product_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_surgical_materials", x => x.id);
                    table.ForeignKey(
                        name: "fk_surgical_materials_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_materials_surgical_reports_surgical_report_id",
                        column: x => x.surgical_report_id,
                        principalTable: "surgical_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "clinical_service_product",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    clinical_service_item_id = table.Column<long>(type: "bigint", nullable: true),
                    product_id = table.Column<long>(type: "bigint", nullable: true),
                    dose = table.Column<decimal>(type: "numeric(19,2)", precision: 19, scale: 2, nullable: true),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    administration_route = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_clinical_service_product", x => x.id);
                    table.ForeignKey(
                        name: "fk_clinical_service_product_clinical_service_items_clinical_se",
                        column: x => x.clinical_service_item_id,
                        principalTable: "clinical_service_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_clinical_service_product_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "laboratory_request_items",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    laboratory_request_id = table.Column<long>(type: "bigint", nullable: false),
                    test_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    requested_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    processed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    reported_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 19, scale: 2, nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 19, scale: 2, nullable: false),
                    sale_detail_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_laboratory_request_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_laboratory_request_items_laboratory_requests_laboratory_req",
                        column: x => x.laboratory_request_id,
                        principalTable: "laboratory_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_laboratory_request_items_laboratory_tests_test_id",
                        column: x => x.test_id,
                        principalTable: "laboratory_tests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "surgical_appointment_details",
                columns: table => new
                {
                    appointment_id = table.Column<long>(type: "bigint", nullable: false),
                    order_id = table.Column<long>(type: "bigint", nullable: true),
                    final_service_id = table.Column<long>(type: "bigint", nullable: false),
                    surgeon_id = table.Column<long>(type: "bigint", nullable: false),
                    anesthetist_id = table.Column<long>(type: "bigint", nullable: true),
                    operating_room_id = table.Column<long>(type: "bigint", nullable: true),
                    prep_instructions = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_surgical_appointment_details", x => x.appointment_id);
                    table.ForeignKey(
                        name: "fk_surgical_appointment_details_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_surgical_appointment_details_clinical_services_final_servic",
                        column: x => x.final_service_id,
                        principalTable: "clinical_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_appointment_details_employees_anesthetist_id",
                        column: x => x.anesthetist_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_appointment_details_employees_surgeon_id",
                        column: x => x.surgeon_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_appointment_details_operating_rooms_operating_room",
                        column: x => x.operating_room_id,
                        principalTable: "operating_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_surgical_appointment_details_surgical_orders_order_id",
                        column: x => x.order_id,
                        principalTable: "surgical_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "treatment_schedule_products",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    treatment_schedule_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(19,4)", precision: 19, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_treatment_schedule_products", x => x.id);
                    table.ForeignKey(
                        name: "fk_treatment_schedule_products_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_treatment_schedule_products_treatment_schedules_treatment_s",
                        column: x => x.treatment_schedule_id,
                        principalTable: "treatment_schedules",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "laboratory_result_values",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    request_item_id = table.Column<long>(type: "bigint", nullable: false),
                    parameter_id = table.Column<long>(type: "bigint", nullable: false),
                    numeric_value = table.Column<double>(type: "double precision", nullable: true),
                    text_value = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    boolean_value = table.Column<bool>(type: "boolean", nullable: true),
                    unit_override = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    out_of_range = table.Column<bool>(type: "boolean", nullable: true),
                    flag = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_laboratory_result_values", x => x.id);
                    table.ForeignKey(
                        name: "fk_laboratory_result_values_laboratory_request_items_request_i",
                        column: x => x.request_item_id,
                        principalTable: "laboratory_request_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_laboratory_result_values_laboratory_test_parameters_paramet",
                        column: x => x.parameter_id,
                        principalTable: "laboratory_test_parameters",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_anesthetic_drugs_product_id",
                table: "anesthetic_drugs",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_anesthetic_drugs_surgical_report_id",
                table: "anesthetic_drugs",
                column: "surgical_report_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_animal_id",
                table: "appointments",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_branch_id_start_date_time",
                table: "appointments",
                columns: new[] { "branch_id", "start_date_time" });

            migrationBuilder.CreateIndex(
                name: "ix_appointments_employee_id",
                table: "appointments",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_attentions_animal_id",
                table: "attentions",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_attentions_attending_employee_id",
                table: "attentions",
                column: "attending_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_attentions_branch_id_status",
                table: "attentions",
                columns: new[] { "branch_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_attentions_clinical_service_id",
                table: "attentions",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_attentions_surgical_order_id",
                table: "attentions",
                column: "surgical_order_id");

            migrationBuilder.CreateIndex(
                name: "uq_attentions_appointment",
                table: "attentions",
                column: "appointment_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_branch_clinical_services_clinical_service_id",
                table: "branch_clinical_services",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "uk_branch_service",
                table: "branch_clinical_services",
                columns: new[] { "branch_id", "clinical_service_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_cages_branch_id",
                table: "cages",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_cages_name",
                table: "cages",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_clinical_appointment_details_clinical_service_id",
                table: "clinical_appointment_details",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_appointment_details_veterinarian_id",
                table: "clinical_appointment_details",
                column: "veterinarian_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_attention_attention_id",
                table: "clinical_attention",
                column: "attention_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_clinical_service_items_clinical_attention_id",
                table: "clinical_service_items",
                column: "clinical_attention_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_service_items_clinical_service_id",
                table: "clinical_service_items",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_service_product_clinical_service_item_id",
                table: "clinical_service_product",
                column: "clinical_service_item_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_service_product_product_id",
                table: "clinical_service_product",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_service_required_products_required_products_id",
                table: "clinical_service_required_products",
                column: "required_products_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_services_name",
                table: "clinical_services",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_evolution_notes_author_employee_id",
                table: "evolution_notes",
                column: "author_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_evolution_notes_hospitalization_id",
                table: "evolution_notes",
                column: "hospitalization_id");

            migrationBuilder.CreateIndex(
                name: "ix_grooming_appointment_details_clinical_service_id",
                table: "grooming_appointment_details",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_grooming_appointment_details_stylist_id",
                table: "grooming_appointment_details",
                column: "stylist_id");

            migrationBuilder.CreateIndex(
                name: "ix_grooming_materials_used_grooming_session_id",
                table: "grooming_materials_used",
                column: "grooming_session_id");

            migrationBuilder.CreateIndex(
                name: "ix_grooming_materials_used_product_id",
                table: "grooming_materials_used",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "idx_grooming_status_start",
                table: "grooming_sessions",
                columns: new[] { "status", "started_at" });

            migrationBuilder.CreateIndex(
                name: "ix_grooming_sessions_assigned_professional_id",
                table: "grooming_sessions",
                column: "assigned_professional_id");

            migrationBuilder.CreateIndex(
                name: "ix_grooming_sessions_attention_id",
                table: "grooming_sessions",
                column: "attention_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_health_plan_service_items_clinical_service_id",
                table: "health_plan_service_items",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_health_plan_service_items_health_plan_id",
                table: "health_plan_service_items",
                column: "health_plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_health_plans_name",
                table: "health_plans",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_hospitalization_vital_signs_hospitalization_id",
                table: "hospitalization_vital_signs",
                column: "hospitalization_id");

            migrationBuilder.CreateIndex(
                name: "ix_hospitalization_vital_signs_recorded_by_employee_id",
                table: "hospitalization_vital_signs",
                column: "recorded_by_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_hospitalizations_animal_id",
                table: "hospitalizations",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_hospitalizations_attention_id",
                table: "hospitalizations",
                column: "attention_id");

            migrationBuilder.CreateIndex(
                name: "ix_hospitalizations_cage_id",
                table: "hospitalizations",
                column: "cage_id");

            migrationBuilder.CreateIndex(
                name: "ix_hospitalizations_clinical_service_id",
                table: "hospitalizations",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_request_items_laboratory_request_id",
                table: "laboratory_request_items",
                column: "laboratory_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_request_items_test_id",
                table: "laboratory_request_items",
                column: "test_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_requests_animal_id",
                table: "laboratory_requests",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_requests_clinical_attention_id",
                table: "laboratory_requests",
                column: "clinical_attention_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_requests_laboratory_id",
                table: "laboratory_requests",
                column: "laboratory_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_requests_requesting_employee_id",
                table: "laboratory_requests",
                column: "requesting_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_result_values_parameter_id",
                table: "laboratory_result_values",
                column: "parameter_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_result_values_request_item_id_parameter_id",
                table: "laboratory_result_values",
                columns: new[] { "request_item_id", "parameter_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_test_laboratories_laboratory_id",
                table: "laboratory_test_laboratories",
                column: "laboratory_id");

            migrationBuilder.CreateIndex(
                name: "uk_test_lab",
                table: "laboratory_test_laboratories",
                columns: new[] { "laboratory_test_id", "laboratory_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_test_parameters_test_id",
                table: "laboratory_test_parameters",
                column: "test_id");

            migrationBuilder.CreateIndex(
                name: "ix_laboratory_tests_code",
                table: "laboratory_tests",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_medical_record_entries_animal_id_occurred_at",
                table: "medical_record_entries",
                columns: new[] { "animal_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "ix_medical_record_entries_branch_id",
                table: "medical_record_entries",
                column: "branch_id");

            migrationBuilder.CreateIndex(
                name: "ix_medical_record_entries_clinical_service_id",
                table: "medical_record_entries",
                column: "clinical_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_medical_record_entries_created_by_employee_id",
                table: "medical_record_entries",
                column: "created_by_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_medication_administrations_administered_by_employee_id",
                table: "medication_administrations",
                column: "administered_by_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_medication_administrations_animal_id",
                table: "medication_administrations",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_medication_administrations_clinical_attention_id",
                table: "medication_administrations",
                column: "clinical_attention_id");

            migrationBuilder.CreateIndex(
                name: "ix_medication_administrations_product_id",
                table: "medication_administrations",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_operative_indications_product_id",
                table: "post_operative_indications",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_operative_indications_surgical_report_id",
                table: "post_operative_indications",
                column: "surgical_report_id");

            migrationBuilder.CreateIndex(
                name: "ix_prescription_template_medications_prescription_template_id",
                table: "prescription_template_medications",
                column: "prescription_template_id");

            migrationBuilder.CreateIndex(
                name: "ix_prescription_template_medications_product_id",
                table: "prescription_template_medications",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_prescription_templates_name",
                table: "prescription_templates",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reminders_animal_id",
                table: "reminders",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_appointment_details_anesthetist_id",
                table: "surgical_appointment_details",
                column: "anesthetist_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_appointment_details_final_service_id",
                table: "surgical_appointment_details",
                column: "final_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_appointment_details_operating_room_id",
                table: "surgical_appointment_details",
                column: "operating_room_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_appointment_details_surgeon_id",
                table: "surgical_appointment_details",
                column: "surgeon_id");

            migrationBuilder.CreateIndex(
                name: "uk_surgical_detail_order",
                table: "surgical_appointment_details",
                column: "order_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_surgical_materials_product_id",
                table: "surgical_materials",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_materials_surgical_report_id",
                table: "surgical_materials",
                column: "surgical_report_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_orders_animal_id",
                table: "surgical_orders",
                column: "animal_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_orders_clinical_attention_id",
                table: "surgical_orders",
                column: "clinical_attention_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_orders_operating_room_id",
                table: "surgical_orders",
                column: "operating_room_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_orders_recommended_service_id",
                table: "surgical_orders",
                column: "recommended_service_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_orders_requested_by_id",
                table: "surgical_orders",
                column: "requested_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_reports_anesthesiologist_id",
                table: "surgical_reports",
                column: "anesthesiologist_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_reports_assistant_id",
                table: "surgical_reports",
                column: "assistant_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_reports_attention_id",
                table: "surgical_reports",
                column: "attention_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_surgical_reports_operating_room_id",
                table: "surgical_reports",
                column: "operating_room_id");

            migrationBuilder.CreateIndex(
                name: "ix_surgical_reports_surgeon_id",
                table: "surgical_reports",
                column: "surgeon_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_schedule_products_product_id",
                table: "treatment_schedule_products",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_schedule_products_treatment_schedule_id",
                table: "treatment_schedule_products",
                column: "treatment_schedule_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_schedules_completed_by_employee_id",
                table: "treatment_schedules",
                column: "completed_by_employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_treatment_schedules_hospitalization_id",
                table: "treatment_schedules",
                column: "hospitalization_id");

            migrationBuilder.AddForeignKey(
                name: "fk_anesthetic_drugs_surgical_reports_surgical_report_id",
                table: "anesthetic_drugs",
                column: "surgical_report_id",
                principalTable: "surgical_reports",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_attentions_surgical_orders_surgical_order_id",
                table: "attentions",
                column: "surgical_order_id",
                principalTable: "surgical_orders",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_attentions_appointments_appointment_id",
                table: "attentions");

            migrationBuilder.DropForeignKey(
                name: "fk_attentions_clinical_services_clinical_service_id",
                table: "attentions");

            migrationBuilder.DropForeignKey(
                name: "fk_surgical_orders_clinical_services_recommended_service_id",
                table: "surgical_orders");

            migrationBuilder.DropForeignKey(
                name: "fk_attentions_surgical_orders_surgical_order_id",
                table: "attentions");

            migrationBuilder.DropTable(
                name: "anesthetic_drugs");

            migrationBuilder.DropTable(
                name: "branch_clinical_services");

            migrationBuilder.DropTable(
                name: "clinical_appointment_details");

            migrationBuilder.DropTable(
                name: "clinical_service_product");

            migrationBuilder.DropTable(
                name: "clinical_service_required_products");

            migrationBuilder.DropTable(
                name: "evolution_notes");

            migrationBuilder.DropTable(
                name: "grooming_appointment_details");

            migrationBuilder.DropTable(
                name: "grooming_materials_used");

            migrationBuilder.DropTable(
                name: "health_plan_service_items");

            migrationBuilder.DropTable(
                name: "hospitalization_vital_signs");

            migrationBuilder.DropTable(
                name: "laboratory_result_values");

            migrationBuilder.DropTable(
                name: "laboratory_test_laboratories");

            migrationBuilder.DropTable(
                name: "medical_record_entries");

            migrationBuilder.DropTable(
                name: "medication_administrations");

            migrationBuilder.DropTable(
                name: "post_operative_indications");

            migrationBuilder.DropTable(
                name: "prescription_template_medications");

            migrationBuilder.DropTable(
                name: "reminders");

            migrationBuilder.DropTable(
                name: "surgical_appointment_details");

            migrationBuilder.DropTable(
                name: "surgical_materials");

            migrationBuilder.DropTable(
                name: "treatment_schedule_products");

            migrationBuilder.DropTable(
                name: "clinical_service_items");

            migrationBuilder.DropTable(
                name: "grooming_sessions");

            migrationBuilder.DropTable(
                name: "health_plans");

            migrationBuilder.DropTable(
                name: "laboratory_request_items");

            migrationBuilder.DropTable(
                name: "laboratory_test_parameters");

            migrationBuilder.DropTable(
                name: "prescription_templates");

            migrationBuilder.DropTable(
                name: "surgical_reports");

            migrationBuilder.DropTable(
                name: "treatment_schedules");

            migrationBuilder.DropTable(
                name: "laboratory_requests");

            migrationBuilder.DropTable(
                name: "laboratory_tests");

            migrationBuilder.DropTable(
                name: "hospitalizations");

            migrationBuilder.DropTable(
                name: "cages");

            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "clinical_services");

            migrationBuilder.DropTable(
                name: "surgical_orders");

            migrationBuilder.DropTable(
                name: "clinical_attention");

            migrationBuilder.DropTable(
                name: "attentions");
        }
    }
}
