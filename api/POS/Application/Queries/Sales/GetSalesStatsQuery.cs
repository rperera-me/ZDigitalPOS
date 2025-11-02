using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Sales
{
    public class GetSalesStatsQuery : IRequest<DashboardStatsDto>
    {
    }
}
