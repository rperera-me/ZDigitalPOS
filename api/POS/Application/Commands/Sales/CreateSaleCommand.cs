using MediatR;
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
        public string PaymentType { get; set; } = string.Empty; // Cash, Card, Credit
        public decimal AmountPaid { get; set; }
        public List<SaleItemDto> SaleItems { get; set; } = new List<SaleItemDto>();
    }
}
