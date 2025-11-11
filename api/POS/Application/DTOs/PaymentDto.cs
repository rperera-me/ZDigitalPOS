namespace POS.Application.DTOs
{
    public class PaymentDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? CardLastFour { get; set; }
    }
}
