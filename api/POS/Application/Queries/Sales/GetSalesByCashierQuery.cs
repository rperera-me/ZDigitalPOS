using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Queries.Sales
{
    public class GetSalesByCashierQuery : IRequest<IEnumerable<SaleDto>>
    {
        public int CashierId { get; set; }
    }
}
