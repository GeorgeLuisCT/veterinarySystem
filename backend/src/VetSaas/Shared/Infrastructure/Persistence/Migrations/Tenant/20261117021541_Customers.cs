using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VetSaas.Shared.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class Customers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "document_type",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    abbreviation = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_document_type", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "customer",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: true),
                    phone_number = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    document_type_id = table.Column<long>(type: "bigint", nullable: false),
                    document_number = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customer", x => x.id);
                    table.ForeignKey(
                        name: "fk_customer_document_type_document_type_id",
                        column: x => x.document_type_id,
                        principalTable: "document_type",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "animal",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    customer_id = table.Column<long>(type: "bigint", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    photo_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    species = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    breed = table.Column<string>(type: "text", nullable: true),
                    birth_date = table.Column<DateOnly>(type: "date", nullable: false),
                    sex = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    microchip_number = table.Column<string>(type: "text", nullable: true),
                    allergies = table.Column<List<string>>(type: "text[]", nullable: false),
                    chronic_conditions = table.Column<List<string>>(type: "text[]", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_animal", x => x.id);
                    table.ForeignKey(
                        name: "fk_animal_customer_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_animal_customer_id",
                table: "animal",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_animal_microchip_number",
                table: "animal",
                column: "microchip_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customer_document_number",
                table: "customer",
                column: "document_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customer_document_type_id",
                table: "customer",
                column: "document_type_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_email",
                table: "customer",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customer_phone_number",
                table: "customer",
                column: "phone_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_document_type_name",
                table: "document_type",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "animal");

            migrationBuilder.DropTable(
                name: "customer");

            migrationBuilder.DropTable(
                name: "document_type");
        }
    }
}
