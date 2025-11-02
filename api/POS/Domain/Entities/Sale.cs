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
        public List<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
        public string PaymentType { get; set; } = string.Empty; // e.g., Cash, Card, Credit
        public decimal AmountPaid { get; set; }
    }
}
