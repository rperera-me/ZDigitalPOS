using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Queries.Sales
{
    public class GetSaleByIdQuery : IRequest<SaleDto?>
    {
        public int Id { get; set; }
    }
}
