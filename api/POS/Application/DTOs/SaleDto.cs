namespace PosSystem.Application.DTOs
{
    public class SaleDto
    {
        public int Id { get; set; }
        public int CashierId { get; set; }
        public int? CustomerId { get; set; }
        public DateTime SaleDate { get; set; }
        public bool IsHeld { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public List<SaleItemDto> SaleItems { get; set; } = new List<SaleItemDto>();
    }
}
