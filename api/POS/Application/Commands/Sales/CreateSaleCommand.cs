using MediatR;
using POS.Application.DTOs;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Sales
{
    public class CreateSaleCommand : IRequest<SaleDto>
    {
        public int CashierId { get; set; }
        public int? CustomerId { get; set; }
        public DateTime SaleDate { get; set; }
        public bool IsHeld { get; set; }

        public decimal TotalAmount { get; set; }
        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }

        public string PaymentType { get; set; } = string.Empty; // Cash, Card, Credit, Mixed
        public decimal AmountPaid { get; set; }
        public decimal Change { get; set; }

        public List<SaleItemDto> SaleItems { get; set; } = new List<SaleItemDto>();
        public List<PaymentDto> Payments { get; set; } = new List<PaymentDto>();
    }
}
