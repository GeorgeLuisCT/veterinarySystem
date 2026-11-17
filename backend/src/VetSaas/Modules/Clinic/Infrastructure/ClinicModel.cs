using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VetSaas.Modules.Clinic.Domain;

namespace VetSaas.Shared.Infrastructure.Persistence
{
    public partial class TenantDbContext
    {
        public DbSet<ClinicalService> ClinicalServices => Set<ClinicalService>();
        public DbSet<BranchClinicalService> BranchClinicalServices => Set<BranchClinicalService>();
        public DbSet<Cage> Cages => Set<Cage>();
        public DbSet<HealthPlan> HealthPlans => Set<HealthPlan>();
        public DbSet<HealthPlanServiceItem> HealthPlanServiceItems => Set<HealthPlanServiceItem>();
        public DbSet<PrescriptionTemplate> PrescriptionTemplates => Set<PrescriptionTemplate>();
        public DbSet<PrescriptionTemplateMedication> PrescriptionTemplateMedications => Set<PrescriptionTemplateMedication>();
        public DbSet<LaboratoryTest> LaboratoryTests => Set<LaboratoryTest>();
        public DbSet<LaboratoryTestLaboratory> LaboratoryTestLaboratories => Set<LaboratoryTestLaboratory>();
        public DbSet<LaboratoryTestParameter> LaboratoryTestParameters => Set<LaboratoryTestParameter>();
        public DbSet<Appointment> Appointments => Set<Appointment>();
        public DbSet<ClinicalAppointmentDetail> ClinicalAppointmentDetails => Set<ClinicalAppointmentDetail>();
        public DbSet<GroomingAppointmentDetail> GroomingAppointmentDetails => Set<GroomingAppointmentDetail>();
        public DbSet<SurgicalAppointmentDetail> SurgicalAppointmentDetails => Set<SurgicalAppointmentDetail>();
        public DbSet<Attentions> Attentions => Set<Attentions>();
        public DbSet<ClinicalAttention> ClinicalAttentions => Set<ClinicalAttention>();
        public DbSet<ClinicalServiceItem> ClinicalServiceItems => Set<ClinicalServiceItem>();
        public DbSet<ClinicalServiceProduct> ClinicalServiceProducts => Set<ClinicalServiceProduct>();
        public DbSet<MedicationAdministration> MedicationAdministrations => Set<MedicationAdministration>();
        public DbSet<MedicalRecordEntry> MedicalRecordEntries => Set<MedicalRecordEntry>();
        public DbSet<Reminder> Reminders => Set<Reminder>();
        public DbSet<LaboratoryRequest> LaboratoryRequests => Set<LaboratoryRequest>();
        public DbSet<LaboratoryRequestItem> LaboratoryRequestItems => Set<LaboratoryRequestItem>();
        public DbSet<LaboratoryResultValue> LaboratoryResultValues => Set<LaboratoryResultValue>();
        public DbSet<Hospitalization> Hospitalizations => Set<Hospitalization>();
        public DbSet<EvolutionNote> EvolutionNotes => Set<EvolutionNote>();
        public DbSet<HospitalizationVitalSign> HospitalizationVitalSigns => Set<HospitalizationVitalSign>();
        public DbSet<TreatmentSchedule> TreatmentSchedules => Set<TreatmentSchedule>();
        public DbSet<TreatmentScheduleProductUsage> TreatmentScheduleProductUsages => Set<TreatmentScheduleProductUsage>();
        public DbSet<SurgicalOrder> SurgicalOrders => Set<SurgicalOrder>();
        public DbSet<SurgicalReport> SurgicalReports => Set<SurgicalReport>();
        public DbSet<AnestheticDrug> AnestheticDrugs => Set<AnestheticDrug>();
        public DbSet<SurgicalMaterial> SurgicalMaterials => Set<SurgicalMaterial>();
        public DbSet<PostOperativeIndication> PostOperativeIndications => Set<PostOperativeIndication>();
        public DbSet<GroomingSession> GroomingSessions => Set<GroomingSession>();
        public DbSet<GroomingMaterialUsed> GroomingMaterialsUsed => Set<GroomingMaterialUsed>();
    }
}

namespace VetSaas.Modules.Clinic.Infrastructure
{
    public sealed class ClinicalServiceConfiguration : IEntityTypeConfiguration<ClinicalService>
    {
        public void Configure(EntityTypeBuilder<ClinicalService> b)
        {
            b.HasIndex(s => s.Name).IsUnique();
            b.Property(s => s.RequiredSampleTypes).HasColumnType("text[]");
            b.HasMany(s => s.RequiredProducts).WithMany()
                .UsingEntity(j => j.ToTable("clinical_service_required_products"));
            b.HasMany(s => s.BranchLinks).WithOne(l => l.ClinicalService).HasForeignKey(l => l.ClinicalServiceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class BranchClinicalServiceConfiguration : IEntityTypeConfiguration<BranchClinicalService>
    {
        public void Configure(EntityTypeBuilder<BranchClinicalService> b) =>
            b.HasIndex(l => new { l.BranchId, l.ClinicalServiceId }).IsUnique().HasDatabaseName("uk_branch_service");
    }

    public sealed class CageConfiguration : IEntityTypeConfiguration<Cage>
    {
        public void Configure(EntityTypeBuilder<Cage> b) => b.HasIndex(c => c.Name).IsUnique();
    }

    public sealed class HealthPlanConfiguration : IEntityTypeConfiguration<HealthPlan>
    {
        public void Configure(EntityTypeBuilder<HealthPlan> b)
        {
            b.HasIndex(p => p.Name).IsUnique();
            b.HasMany(p => p.ServiceItems).WithOne(i => i.HealthPlan).HasForeignKey(i => i.HealthPlanId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class PrescriptionTemplateConfiguration : IEntityTypeConfiguration<PrescriptionTemplate>
    {
        public void Configure(EntityTypeBuilder<PrescriptionTemplate> b)
        {
            b.HasIndex(p => p.Name).IsUnique();
            b.HasMany(p => p.Medications).WithOne(m => m.PrescriptionTemplate).HasForeignKey(m => m.PrescriptionTemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class LaboratoryTestConfiguration : IEntityTypeConfiguration<LaboratoryTest>
    {
        public void Configure(EntityTypeBuilder<LaboratoryTest> b)
        {
            b.HasIndex(t => t.Code).IsUnique();
            b.HasMany(t => t.Parameters).WithOne(p => p.Test).HasForeignKey(p => p.TestId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(t => t.LaboratoryLinks).WithOne(l => l.LaboratoryTest).HasForeignKey(l => l.LaboratoryTestId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class LaboratoryTestLaboratoryConfiguration : IEntityTypeConfiguration<LaboratoryTestLaboratory>
    {
        public void Configure(EntityTypeBuilder<LaboratoryTestLaboratory> b) =>
            b.HasIndex(l => new { l.LaboratoryTestId, l.LaboratoryId }).IsUnique().HasDatabaseName("uk_test_lab");
    }

    public sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
    {
        public void Configure(EntityTypeBuilder<Appointment> b)
        {
            b.HasOne(a => a.ClinicalDetail).WithOne(d => d.Appointment).HasForeignKey<ClinicalAppointmentDetail>(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(a => a.GroomingDetail).WithOne(d => d.Appointment).HasForeignKey<GroomingAppointmentDetail>(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(a => a.SurgicalDetail).WithOne(d => d.Appointment).HasForeignKey<SurgicalAppointmentDetail>(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(a => new { a.BranchId, a.StartDateTime });
        }
    }

    public sealed class ClinicalAppointmentDetailConfiguration : IEntityTypeConfiguration<ClinicalAppointmentDetail>
    {
        public void Configure(EntityTypeBuilder<ClinicalAppointmentDetail> b) => b.HasKey(d => d.AppointmentId);
    }

    public sealed class GroomingAppointmentDetailConfiguration : IEntityTypeConfiguration<GroomingAppointmentDetail>
    {
        public void Configure(EntityTypeBuilder<GroomingAppointmentDetail> b) => b.HasKey(d => d.AppointmentId);
    }

    public sealed class SurgicalAppointmentDetailConfiguration : IEntityTypeConfiguration<SurgicalAppointmentDetail>
    {
        public void Configure(EntityTypeBuilder<SurgicalAppointmentDetail> b)
        {
            b.HasKey(d => d.AppointmentId);
            b.HasOne(d => d.Order).WithOne(o => o.ScheduledDetail).HasForeignKey<SurgicalAppointmentDetail>(d => d.OrderId);
            b.HasIndex(d => d.OrderId).IsUnique().HasDatabaseName("uk_surgical_detail_order");
        }
    }

    public sealed class AttentionsConfiguration : IEntityTypeConfiguration<Attentions>
    {
        public void Configure(EntityTypeBuilder<Attentions> b)
        {
            b.HasOne(a => a.Appointment).WithOne().HasForeignKey<Attentions>(a => a.AppointmentId);
            b.HasIndex(a => a.AppointmentId).IsUnique().HasDatabaseName("uq_attentions_appointment");
            b.Property(a => a.Status).HasMaxLength(32);
            b.HasIndex(a => new { a.BranchId, a.Status });
        }
    }

    public sealed class ClinicalAttentionConfiguration : IEntityTypeConfiguration<ClinicalAttention>
    {
        public void Configure(EntityTypeBuilder<ClinicalAttention> b)
        {
            b.HasOne(c => c.Attention).WithOne().HasForeignKey<ClinicalAttention>(c => c.AttentionId);
            b.HasIndex(c => c.AttentionId).IsUnique();
            b.HasMany(c => c.MedicationAdministrations).WithOne(m => m.ClinicalAttention).HasForeignKey(m => m.ClinicalAttentionId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(c => c.ServiceItems).WithOne(i => i.ClinicalAttention).HasForeignKey(i => i.ClinicalAttentionId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(c => c.SurgicalOrders).WithOne(o => o.ClinicalAttention).HasForeignKey(o => o.ClinicalAttentionId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(c => c.LaboratoryRequests).WithOne(r => r.ClinicalAttention).HasForeignKey(r => r.ClinicalAttentionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ClinicalServiceItemConfiguration : IEntityTypeConfiguration<ClinicalServiceItem>
    {
        public void Configure(EntityTypeBuilder<ClinicalServiceItem> b) =>
            b.HasMany(i => i.Products).WithOne(p => p.ClinicalServiceItem).HasForeignKey(p => p.ClinicalServiceItemId)
                .OnDelete(DeleteBehavior.Cascade);
    }

    public sealed class MedicalRecordEntryConfiguration : IEntityTypeConfiguration<MedicalRecordEntry>
    {
        public void Configure(EntityTypeBuilder<MedicalRecordEntry> b) => b.HasIndex(e => new { e.AnimalId, e.OccurredAt });
    }

    public sealed class LaboratoryRequestConfiguration : IEntityTypeConfiguration<LaboratoryRequest>
    {
        public void Configure(EntityTypeBuilder<LaboratoryRequest> b) =>
            b.HasMany(r => r.Items).WithOne(i => i.LaboratoryRequest).HasForeignKey(i => i.LaboratoryRequestId)
                .OnDelete(DeleteBehavior.Cascade);
    }

    public sealed class LaboratoryRequestItemConfiguration : IEntityTypeConfiguration<LaboratoryRequestItem>
    {
        public void Configure(EntityTypeBuilder<LaboratoryRequestItem> b) =>
            b.HasMany(i => i.Results).WithOne(r => r.RequestItem).HasForeignKey(r => r.RequestItemId).OnDelete(DeleteBehavior.Cascade);
    }

    public sealed class LaboratoryResultValueConfiguration : IEntityTypeConfiguration<LaboratoryResultValue>
    {
        public void Configure(EntityTypeBuilder<LaboratoryResultValue> b) =>
            b.HasIndex(r => new { r.RequestItemId, r.ParameterId }).IsUnique();
    }

    public sealed class HospitalizationConfiguration : IEntityTypeConfiguration<Hospitalization>
    {
        public void Configure(EntityTypeBuilder<Hospitalization> b)
        {
            b.Property(h => h.Status).HasMaxLength(32);
            b.HasMany(h => h.EvolutionNotes).WithOne(n => n.Hospitalization).HasForeignKey(n => n.HospitalizationId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(h => h.TreatmentSchedules).WithOne(t => t.Hospitalization).HasForeignKey(t => t.HospitalizationId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(h => h.VitalSigns).WithOne(v => v.Hospitalization).HasForeignKey(v => v.HospitalizationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class TreatmentScheduleConfiguration : IEntityTypeConfiguration<TreatmentSchedule>
    {
        public void Configure(EntityTypeBuilder<TreatmentSchedule> b) =>
            b.HasMany(t => t.ProductUsages).WithOne(u => u.TreatmentSchedule).HasForeignKey(u => u.TreatmentScheduleId)
                .OnDelete(DeleteBehavior.Cascade);
    }

    public sealed class SurgicalReportConfiguration : IEntityTypeConfiguration<SurgicalReport>
    {
        public void Configure(EntityTypeBuilder<SurgicalReport> b)
        {
            b.HasOne(r => r.Attention).WithOne().HasForeignKey<SurgicalReport>(r => r.AttentionId);
            b.HasIndex(r => r.AttentionId).IsUnique();
            b.HasMany(r => r.AnestheticProtocol).WithOne(d => d.SurgicalReport).HasForeignKey(d => d.SurgicalReportId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(r => r.MaterialsUsed).WithOne(m => m.SurgicalReport).HasForeignKey(m => m.SurgicalReportId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(r => r.PostOperativeIndications).WithOne(i => i.SurgicalReport).HasForeignKey(i => i.SurgicalReportId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class GroomingSessionConfiguration : IEntityTypeConfiguration<GroomingSession>
    {
        public void Configure(EntityTypeBuilder<GroomingSession> b)
        {
            b.HasOne(s => s.Attention).WithOne().HasForeignKey<GroomingSession>(s => s.AttentionId);
            b.HasIndex(s => s.AttentionId).IsUnique();
            b.HasIndex(s => new { s.Status, s.StartedAt }).HasDatabaseName("idx_grooming_status_start");
            b.Property(s => s.PhotoUrls).HasColumnType("text[]");
            b.HasMany(s => s.MaterialsUsed).WithOne(m => m.GroomingSession).HasForeignKey(m => m.GroomingSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
