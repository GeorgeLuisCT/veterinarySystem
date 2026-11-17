using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Inventory.Domain;

namespace VetSaas.Modules.Clinic.Domain;

// ---- Catálogos ----

[Table("clinical_services")]
public class ClinicalService
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public ClinicalServiceCategory ClinicalServiceCategory { get; set; }
    public string? Description { get; set; }
    [Column(TypeName = "numeric(19,2)")] public decimal Price { get; set; }
    public int? ReminderPeriod { get; set; }
    public TimeUnit? ReminderPeriodUnit { get; set; }
    public List<string> RequiredSampleTypes { get; set; } = new();
    public ICollection<Product> RequiredProducts { get; set; } = new List<Product>();
    public ICollection<BranchClinicalService> BranchLinks { get; set; } = new List<BranchClinicalService>();
}

[Table("branch_clinical_services")]
public class BranchClinicalService
{
    public long Id { get; set; }
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    public long ClinicalServiceId { get; set; }
    public ClinicalService ClinicalService { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}

[Table("cages")]
public class Cage
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public CageSize Size { get; set; }
    public bool IsOccupied { get; set; }
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
}

[Table("health_plans")]
public class HealthPlan
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    [Column(TypeName = "numeric(19,2)")] public decimal Price { get; set; }
    public string? Notes { get; set; }
    public List<HealthPlanServiceItem> ServiceItems { get; set; } = new();
}

[Table("health_plan_service_items")]
public class HealthPlanServiceItem
{
    public long Id { get; set; }
    public long HealthPlanId { get; set; }
    public HealthPlan HealthPlan { get; set; } = null!;
    public long ClinicalServiceId { get; set; }
    public ClinicalService ClinicalService { get; set; } = null!;
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}

[Table("prescription_templates")]
public class PrescriptionTemplate
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Purpose { get; set; } = null!;
    public string? Notes { get; set; }
    public List<PrescriptionTemplateMedication> Medications { get; set; } = new();
}

[Table("prescription_template_medications")]
public class PrescriptionTemplateMedication
{
    public long Id { get; set; }
    public long PrescriptionTemplateId { get; set; }
    public PrescriptionTemplate PrescriptionTemplate { get; set; } = null!;
    public long? ProductId { get; set; }
    public Product? Product { get; set; }
    public string? CustomMedicationName { get; set; }
    [Column(TypeName = "numeric(12,3)")] public decimal DosageAmount { get; set; }
    public ProductUnitType? DosageUnit { get; set; }
    public int FrequencyValue { get; set; }
    [MaxLength(20)] public FrequencyUnit FrequencyUnit { get; set; }
    public int DurationValue { get; set; }
    [MaxLength(20)] public TimeUnit DurationUnit { get; set; }
    public string? Instructions { get; set; }
}

[Table("laboratory_tests")]
public class LaboratoryTest
{
    public long Id { get; set; }
    [MaxLength(40)] public string Code { get; set; } = null!;
    [MaxLength(200)] public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool Active { get; set; } = true;
    [Column(TypeName = "numeric(10,2)")] public decimal Price { get; set; }
    public ICollection<LaboratoryTestParameter> Parameters { get; set; } = new List<LaboratoryTestParameter>();
    public ICollection<LaboratoryTestLaboratory> LaboratoryLinks { get; set; } = new List<LaboratoryTestLaboratory>();
}

[Table("laboratory_test_laboratories")]
public class LaboratoryTestLaboratory
{
    public long Id { get; set; }
    public long LaboratoryTestId { get; set; }
    public LaboratoryTest LaboratoryTest { get; set; } = null!;
    public long LaboratoryId { get; set; }
    public Laboratory Laboratory { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}

[Table("laboratory_test_parameters")]
public class LaboratoryTestParameter
{
    public long Id { get; set; }
    [Column("test_id")] public long TestId { get; set; }
    public LaboratoryTest Test { get; set; } = null!;
    [MaxLength(80)] public string Name { get; set; } = null!;
    [MaxLength(16)] public LabValueType ValueType { get; set; }
    [MaxLength(24)] public LabUnit Unit { get; set; }
    [MaxLength(400)] public string? AllowedOptions { get; set; }
    public double? RefMin { get; set; }
    public double? RefMax { get; set; }
    [MaxLength(200)] public string? RefText { get; set; }
    [MaxLength(32)] public AnimalSpecies? Species { get; set; }
    [MaxLength(16)] public AnimalSex? Sex { get; set; }
    public int? AgeMinMonths { get; set; }
    public int? AgeMaxMonths { get; set; }
    public int? Decimals { get; set; }
}

// ---- Agenda y atenciones ----

[Table("appointments")]
public class Appointment
{
    public long Id { get; set; }
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    [Column("employee_id")] public long? AssignedEmployeeId { get; set; }
    public Employee? AssignedEmployee { get; set; }
    public DateTime StartDateTime { get; set; }
    public int? EstimatedDurationMinutes { get; set; }
    [MaxLength(32)] public AppointmentType Type { get; set; }
    [MaxLength(32)] public AppointmentStatus Status { get; set; }
    [MaxLength(160)] public string? RequesterName { get; set; }
    [MaxLength(160)] public string? RequesterEmail { get; set; }
    [MaxLength(64)] public string? RequesterPhone { get; set; }
    public string? RequestNotes { get; set; }
    public ClinicalAppointmentDetail? ClinicalDetail { get; set; }
    public GroomingAppointmentDetail? GroomingDetail { get; set; }
    public SurgicalAppointmentDetail? SurgicalDetail { get; set; }
}

[Table("clinical_appointment_details")]
public class ClinicalAppointmentDetail
{
    public long AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;
    public long ClinicalServiceId { get; set; }
    public ClinicalService ClinicalService { get; set; } = null!;
    public long VeterinarianId { get; set; }
    public Employee Veterinarian { get; set; } = null!;
    public string? ConsultationReason { get; set; }
    public string? ClinicalNotes { get; set; }
}

[Table("grooming_appointment_details")]
public class GroomingAppointmentDetail
{
    public long AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;
    public long ClinicalServiceId { get; set; }
    public ClinicalService ClinicalService { get; set; } = null!;
    public long StylistId { get; set; }
    public Employee Stylist { get; set; } = null!;
    public string? OwnerSpecialNotes { get; set; }
}

[Table("surgical_appointment_details")]
public class SurgicalAppointmentDetail
{
    public long AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;
    [Column("order_id")] public long? OrderId { get; set; }
    public SurgicalOrder? Order { get; set; }
    public long FinalServiceId { get; set; }
    public ClinicalService FinalService { get; set; } = null!;
    public long SurgeonId { get; set; }
    public Employee Surgeon { get; set; } = null!;
    public long? AnesthetistId { get; set; }
    public Employee? Anesthetist { get; set; }
    public long? OperatingRoomId { get; set; }
    public OperatingRoom? OperatingRoom { get; set; }
    public string? PrepInstructions { get; set; }
}

/// <summary>Atención (llegada del paciente a la sucursal): clínica, peluquería o cirugía.</summary>
[Table("attentions")]
public class Attentions
{
    public long Id { get; set; }
    public long? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    public long AttendingEmployeeId { get; set; }
    public Employee AttendingEmployee { get; set; } = null!;
    public long? SurgicalOrderId { get; set; }
    public SurgicalOrder? SurgicalOrder { get; set; }
    public DateTime CheckInTime { get; set; }
    [MaxLength(32)] public AttentionType? Type { get; set; }
    public bool IsEmergency { get; set; }
    public AttentionsStatus Status { get; set; }
    [Column("clinical_service_id")] public long? ServiceId { get; set; }
    public ClinicalService? Service { get; set; }
}

[Table("clinical_attention")]
public class ClinicalAttention
{
    public long Id { get; set; }
    /// <summary>Control de concurrencia optimista (columna de sistema xmin de PostgreSQL).</summary>
    [Timestamp] public uint Version { get; set; }
    public long AttentionId { get; set; }
    public Attentions Attention { get; set; } = null!;
    public DateTime VisitDate { get; set; }
    [MaxLength(24)] public ClinicalAttentionStatus Status { get; set; } = ClinicalAttentionStatus.OPEN;
    public string? Subjective { get; set; }
    public string? Objective { get; set; }
    public string? Assessment { get; set; }
    public string? Plan { get; set; }
    public double? WeightKg { get; set; }
    public double? TemperatureCelsius { get; set; }
    public int? HeartRate { get; set; }
    public int? RespiratoryRate { get; set; }
    public ICollection<MedicationAdministration> MedicationAdministrations { get; set; } = new List<MedicationAdministration>();
    public ICollection<ClinicalServiceItem> ServiceItems { get; set; } = new List<ClinicalServiceItem>();
    public ICollection<SurgicalOrder> SurgicalOrders { get; set; } = new List<SurgicalOrder>();
    public ICollection<LaboratoryRequest> LaboratoryRequests { get; set; } = new List<LaboratoryRequest>();
}

[Table("clinical_service_items")]
public class ClinicalServiceItem
{
    public long Id { get; set; }
    public long ClinicalAttentionId { get; set; }
    public ClinicalAttention ClinicalAttention { get; set; } = null!;
    public long ClinicalServiceId { get; set; }
    public ClinicalService ClinicalService { get; set; } = null!;
    [Column(TypeName = "numeric(12,2)")] public decimal UnitPrice { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal Quantity { get; set; }
    [Column(TypeName = "numeric(14,2)")] public decimal Subtotal { get; set; }
    public long? SaleDetailId { get; set; }
    public string? Notes { get; set; }
    public ICollection<ClinicalServiceProduct> Products { get; set; } = new List<ClinicalServiceProduct>();
}

[Table("clinical_service_product")]
public class ClinicalServiceProduct
{
    public long Id { get; set; }
    public long? ClinicalServiceItemId { get; set; }
    public ClinicalServiceItem? ClinicalServiceItem { get; set; }
    public long? ProductId { get; set; }
    public Product? Product { get; set; }
    public decimal? Dose { get; set; }
    public ProductUnitType? Unit { get; set; }
    public AdministrationRoute? AdministrationRoute { get; set; }
}

[Table("medication_administrations")]
public class MedicationAdministration
{
    public long Id { get; set; }
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public DateTime AdministeredAt { get; set; }
    [Column(TypeName = "numeric(10,2)")] public decimal? DoseAmount { get; set; }
    [MaxLength(24)] public ProductUnitType? DoseUnit { get; set; }
    [MaxLength(24)] public AdministrationRoute? Route { get; set; }
    public int? FrequencyValue { get; set; }
    [MaxLength(20)] public FrequencyUnit? FrequencyUnit { get; set; }
    [Column("administered_by_employee_id")] public long? AdministeredById { get; set; }
    public Employee? AdministeredBy { get; set; }
    public string? Notes { get; set; }
    public long? ClinicalAttentionId { get; set; }
    public ClinicalAttention? ClinicalAttention { get; set; }
}

[Table("medical_record_entries")]
public class MedicalRecordEntry
{
    public long Id { get; set; }
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    public DateTime OccurredAt { get; set; }
    [MaxLength(32)] public MedicalRecordCategory Category { get; set; }
    public long? ClinicalServiceId { get; set; }
    public ClinicalService? ClinicalService { get; set; }
    public long? SourceId { get; set; }
    [MaxLength(180)] public string? Title { get; set; }
    public string? Notes { get; set; }
    public long? BranchId { get; set; }
    public Branch? Branch { get; set; }
    [Column("created_by_employee_id")] public long? CreatedById { get; set; }
    public Employee? CreatedBy { get; set; }
    [MaxLength(16)] public RecordVisibility Visibility { get; set; } = RecordVisibility.INTERNAL;
}

[Table("reminders")]
public class Reminder
{
    public long Id { get; set; }
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    [MaxLength(50)] public ReminderType ReminderType { get; set; }
    public DateOnly DueDate { get; set; }
    public ReminderStatus Status { get; set; }
}

// ---- Laboratorio ----

[Table("laboratory_requests")]
public class LaboratoryRequest
{
    public long Id { get; set; }
    public long? ClinicalAttentionId { get; set; }
    public ClinicalAttention? ClinicalAttention { get; set; }
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    public long? RequestingEmployeeId { get; set; }
    public Employee? RequestingEmployee { get; set; }
    public long LaboratoryId { get; set; }
    public Laboratory Laboratory { get; set; } = null!;
    [MaxLength(24)] public LabRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ClinicalNotes { get; set; }
    public ICollection<LaboratoryRequestItem> Items { get; set; } = new List<LaboratoryRequestItem>();
}

[Table("laboratory_request_items")]
public class LaboratoryRequestItem
{
    public long Id { get; set; }
    public long LaboratoryRequestId { get; set; }
    public LaboratoryRequest LaboratoryRequest { get; set; } = null!;
    [Column("test_id")] public long TestId { get; set; }
    public LaboratoryTest Test { get; set; } = null!;
    [MaxLength(16)] public LabRequestItemStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime? RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? ReportedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal UnitPrice { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal Quantity { get; set; }
    [Column(TypeName = "numeric(14,2)")] public decimal Subtotal { get; set; }
    public long? SaleDetailId { get; set; }
    public ICollection<LaboratoryResultValue> Results { get; set; } = new List<LaboratoryResultValue>();
}

[Table("laboratory_result_values")]
public class LaboratoryResultValue
{
    public long Id { get; set; }
    [Column("request_item_id")] public long RequestItemId { get; set; }
    public LaboratoryRequestItem RequestItem { get; set; } = null!;
    [Column("parameter_id")] public long ParameterId { get; set; }
    public LaboratoryTestParameter Parameter { get; set; } = null!;
    public double? NumericValue { get; set; }
    [MaxLength(400)] public string? TextValue { get; set; }
    public bool? BooleanValue { get; set; }
    [MaxLength(32)] public string? UnitOverride { get; set; }
    public bool? OutOfRange { get; set; }
    [MaxLength(120)] public string? Flag { get; set; }
    public string? Comment { get; set; }
}

// ---- Hospitalización ----

[Table("hospitalizations")]
public class Hospitalization
{
    public long Id { get; set; }
    [Timestamp] public uint Version { get; set; }
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    public long CageId { get; set; }
    public Cage Cage { get; set; } = null!;
    public long? AttentionId { get; set; }
    public Attentions? Attention { get; set; }
    [MaxLength(32)] public AdmissionTiming AdmissionTiming { get; set; } = AdmissionTiming.NONE;
    [MaxLength(32)] public HospitalizationCause? Cause { get; set; }
    public long? ClinicalServiceId { get; set; }
    public ClinicalService? ClinicalService { get; set; }
    public DateTime AdmissionDate { get; set; }
    public DateTime? DischargeDate { get; set; }
    public string? AdmissionNotes { get; set; }
    public HospitalizationStatus Status { get; set; }
    public List<EvolutionNote> EvolutionNotes { get; set; } = new();
    public List<TreatmentSchedule> TreatmentSchedules { get; set; } = new();
    public List<HospitalizationVitalSign> VitalSigns { get; set; } = new();
}

[Table("evolution_notes")]
public class EvolutionNote
{
    public long Id { get; set; }
    public long HospitalizationId { get; set; }
    public Hospitalization Hospitalization { get; set; } = null!;
    [Column("author_employee_id")] public long AuthorId { get; set; }
    public Employee Author { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string Note { get; set; } = null!;
}

[Table("hospitalization_vital_signs")]
public class HospitalizationVitalSign
{
    public long Id { get; set; }
    public long HospitalizationId { get; set; }
    public Hospitalization Hospitalization { get; set; } = null!;
    [Column("recorded_by_employee_id")] public long RecordedById { get; set; }
    public Employee RecordedBy { get; set; } = null!;
    public DateTime RecordedAt { get; set; }
    public double? WeightKg { get; set; }
    public double? TemperatureCelsius { get; set; }
    public int? HeartRate { get; set; }
    public int? RespiratoryRate { get; set; }
}

[Table("treatment_schedules")]
public class TreatmentSchedule
{
    public long Id { get; set; }
    public long HospitalizationId { get; set; }
    public Hospitalization Hospitalization { get; set; } = null!;
    public string TreatmentName { get; set; } = null!;
    public DateTime ScheduledTime { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    [Column("completed_by_employee_id")] public long? CompletedById { get; set; }
    public Employee? CompletedBy { get; set; }
    public string? Notes { get; set; }
    public List<TreatmentScheduleProductUsage> ProductUsages { get; set; } = new();
}

[Table("treatment_schedule_products")]
public class TreatmentScheduleProductUsage
{
    public long Id { get; set; }
    public long TreatmentScheduleId { get; set; }
    public TreatmentSchedule TreatmentSchedule { get; set; } = null!;
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;
    [Column(TypeName = "numeric(19,4)")] public decimal Quantity { get; set; }
    [MaxLength(32)] public ProductUnitType Unit { get; set; }
}

// ---- Cirugía ----

[Table("surgical_orders")]
public class SurgicalOrder
{
    public long Id { get; set; }
    public long AnimalId { get; set; }
    public Animal Animal { get; set; } = null!;
    public long RecommendedServiceId { get; set; }
    public ClinicalService RecommendedService { get; set; } = null!;
    public long RequestedById { get; set; }
    public Employee RequestedBy { get; set; } = null!;
    [MaxLength(32)] public SurgicalOrderStatus Status { get; set; } = SurgicalOrderStatus.PENDING;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public SurgicalAppointmentDetail? ScheduledDetail { get; set; }
    public long? ClinicalAttentionId { get; set; }
    public ClinicalAttention? ClinicalAttention { get; set; }
    public long? OperatingRoomId { get; set; }
    public OperatingRoom? OperatingRoom { get; set; }
}

[Table("surgical_reports")]
public class SurgicalReport
{
    public long Id { get; set; }
    [Timestamp] public uint Version { get; set; }
    public long AttentionId { get; set; }
    public Attentions Attention { get; set; } = null!;
    [MaxLength(24)] public SurgicalReportStatus Status { get; set; } = SurgicalReportStatus.DRAFT;
    public DateTime? SurgeryStartAt { get; set; }
    public DateTime? SurgeryEndAt { get; set; }
    public long? SurgeonId { get; set; }
    public Employee? Surgeon { get; set; }
    public long? AnesthesiologistId { get; set; }
    public Employee? Anesthesiologist { get; set; }
    public long? OperatingRoomId { get; set; }
    public OperatingRoom? OperatingRoom { get; set; }
    public long? AssistantId { get; set; }
    public Employee? Assistant { get; set; }
    public string? Monitoring { get; set; }
    public string? Findings { get; set; }
    public string? SurgicalTechniqueDescription { get; set; }
    public ICollection<AnestheticDrug> AnestheticProtocol { get; set; } = new List<AnestheticDrug>();
    public ICollection<SurgicalMaterial> MaterialsUsed { get; set; } = new List<SurgicalMaterial>();
    public ICollection<PostOperativeIndication> PostOperativeIndications { get; set; } = new List<PostOperativeIndication>();
}

[Table("anesthetic_drugs")]
public class AnestheticDrug
{
    public long Id { get; set; }
    public long SurgicalReportId { get; set; }
    public SurgicalReport SurgicalReport { get; set; } = null!;
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;
    [MaxLength(32)] public AnestheticPhase Phase { get; set; }
    [Column(TypeName = "numeric(10,4)")] public decimal DoseAmount { get; set; }
    [MaxLength(24)] public ProductUnitType DoseUnit { get; set; }
    [MaxLength(24)] public AdministrationRoute? Route { get; set; }
}

[Table("surgical_materials")]
public class SurgicalMaterial
{
    public long Id { get; set; }
    public long SurgicalReportId { get; set; }
    public SurgicalReport SurgicalReport { get; set; } = null!;
    public long? ProductId { get; set; }
    public Product? Product { get; set; }
    [MaxLength(255)] public string? UnregisteredProductName { get; set; }
    public int Quantity { get; set; }
    [MaxLength(24)] public ProductUnitType UnitType { get; set; }
}

[Table("post_operative_indications")]
public class PostOperativeIndication
{
    public long Id { get; set; }
    public long SurgicalReportId { get; set; }
    public SurgicalReport SurgicalReport { get; set; } = null!;
    public long? ProductId { get; set; }
    public Product? Product { get; set; }
    public string? NonDrugInstruction { get; set; }
    [Column(TypeName = "numeric(10,4)")] public decimal? DoseAmount { get; set; }
    [MaxLength(24)] public ProductUnitType? DoseUnit { get; set; }
    public int? FrequencyValue { get; set; }
    [MaxLength(20)] public FrequencyUnit? FrequencyUnit { get; set; }
    [MaxLength(24)] public AdministrationRoute? Route { get; set; }
}

// ---- Peluquería ----

[Table("grooming_sessions")]
public class GroomingSession
{
    public long Id { get; set; }
    [Timestamp] public uint Version { get; set; }
    public long AttentionId { get; set; }
    public Attentions Attention { get; set; } = null!;
    [MaxLength(24)] public GroomingStatus Status { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public long? AssignedProfessionalId { get; set; }
    public Employee? AssignedProfessional { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal? ChargedPrice { get; set; }
    public long? SaleDetailId { get; set; }
    public string? BehaviorNotes { get; set; }
    public string? ClinicalObservations { get; set; }
    public List<string> PhotoUrls { get; set; } = new();
    public ICollection<GroomingMaterialUsed> MaterialsUsed { get; set; } = new List<GroomingMaterialUsed>();
}

[Table("grooming_materials_used")]
public class GroomingMaterialUsed
{
    public long Id { get; set; }
    public long GroomingSessionId { get; set; }
    public GroomingSession GroomingSession { get; set; } = null!;
    public long? ProductId { get; set; }
    public Product? Product { get; set; }
    [MaxLength(255)] public string? UnregisteredProductName { get; set; }
    [Column(TypeName = "numeric(12,3)")] public decimal Quantity { get; set; }
    [MaxLength(24)] public ProductUnitType UnitType { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal? UnitPrice { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal? Subtotal { get; set; }
}
