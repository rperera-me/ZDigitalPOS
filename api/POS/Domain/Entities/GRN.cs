namespace POS.Domain.Entities
{
    public class GRN
    {
        public int Id { get; set; }
        public string GRNNumber { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public DateTime ReceivedDate { get; set; } = DateTime.Now;
        public int ReceivedBy { get; set; }
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

        public List<GRNItem> Items { get; set; } = new List<GRNItem>();
    }

    public class GRNItem
    {
        public int Id { get; set; }
        public int GRNId { get; set; }
        public int ProductId { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public decimal ProductPrice { get; set; }
        public DateTime? ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class GRNPayment
    {
        public int Id { get; set; }
        public int GRNId { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.Now;
        public string PaymentType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? ChequeNumber { get; set; }
        public DateTime? ChequeDate { get; set; }
        public string? Notes { get; set; }
        public int RecordedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
