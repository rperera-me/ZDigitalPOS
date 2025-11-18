namespace POS.Application.DTOs
{
    public class GRNDto
    {
        public int Id { get; set; }
        public string GRNNumber { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public DateTime ReceivedDate { get; set; }
        public int ReceivedBy { get; set; }
        public string ReceivedByName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public string PaymentStatus { get; set; } = "unpaid";
        public decimal PaidAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public string? PaymentType { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? ChequeNumber { get; set; }
        public DateTime? ChequeDate { get; set; }
        public string? PaymentNotes { get; set; }

        public List<GRNItemDto> Items { get; set; } = new List<GRNItemDto>();
        public List<GRNPaymentDto> Payments { get; set; } = new List<GRNPaymentDto>();
    }

    public class GRNItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public decimal ProductPrice { get; set; }
        public DateTime? ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class GRNPaymentDto
    {
        public int Id { get; set; }
        public int GRNId { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? ChequeNumber { get; set; }
        public DateTime? ChequeDate { get; set; }
        public string? Notes { get; set; }
        public int RecordedBy { get; set; }
        public string RecordedByName { get; set; } = string.Empty;
    }
}
