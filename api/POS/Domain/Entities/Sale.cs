using POS.Domain.Entities;

namespace PosSystem.Domain.Entities
{
    public class Sale
    {
        public int Id { get; set; }
        public int CashierId { get; set; }
        public int? CustomerId { get; set; }
        public DateTime SaleDate { get; set; }
        public bool IsHeld { get; set; }
        public decimal TotalAmount { get; set; }

        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? FinalAmount { get; set; }

        public List<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
        public List<Payment> Payments { get; set; } = new List<Payment>();

        public string PaymentType { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public decimal Change { get; set; }
    }
}
