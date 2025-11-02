using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Sales
{
    public class HoldSaleCommand : IRequest<SaleDto>
    {
        public int SaleId { get; set; }
    }
}
