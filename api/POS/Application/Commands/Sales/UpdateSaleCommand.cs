using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Sales
{
    public class UpdateSaleCommand : IRequest<SaleDto>
    {
        public int Id { get; set; }
        public bool IsHeld { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public List<SaleItemDto> SaleItems { get; set; } = new List<SaleItemDto>();
    }
}
