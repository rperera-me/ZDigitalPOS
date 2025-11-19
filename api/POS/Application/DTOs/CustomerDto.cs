using MediatR;
using POS.Application.DTOs;

namespace PosSystem.Application.DTOs
{
    public class CustomerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? NICNumber { get; set; }
        public string Type { get; set; } = "loyalty"; // loyalty, wholesale
        public decimal CreditBalance { get; set; }
        public int LoyaltyPoints { get; set; } = 0;
    }

    public class CustomerPurchaseDto
    {
        public int SaleId { get; set; }
        public DateTime SaleDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public List<PaymentDto> Payments { get; set; } = new List<PaymentDto>();
        public int ItemCount { get; set; }
        public bool IsVoided { get; set; }
    }
}
