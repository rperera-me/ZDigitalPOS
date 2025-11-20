namespace POS.Application.DTOs
{
    public class SupplierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; }
    }

    public class SupplierDetailDto : SupplierDto
    {
        public decimal TotalCreditAmount { get; set; }
        public DateTime? LastVisitedDate { get; set; }
        public int TotalGRNs { get; set; }
        public int UnpaidGRNs { get; set; }
        public int PartiallyPaidGRNs { get; set; }
    }
}
