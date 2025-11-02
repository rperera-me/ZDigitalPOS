using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Queries.Sales
{
    public class GetSalesByDateRangeQuery : IRequest<IEnumerable<SaleDto>>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
