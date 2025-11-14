namespace POS.Domain.Entities
{
    public class Payment
    {
        public int Id { get; set; }
        public int SaleId { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? CardLastFour { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
