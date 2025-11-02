using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Queries.Sales
{
    public class GetHeldSalesQuery : IRequest<IEnumerable<SaleDto>>
    {
    }
}
