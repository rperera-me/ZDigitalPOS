using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Sales;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetSalesStatsQueryHandler : IRequestHandler<GetSalesStatsQuery, DashboardStatsDto>
    {
        private readonly ISaleRepository _saleRepository;

        public GetSalesStatsQueryHandler(ISaleRepository saleRepository)
        {
            _saleRepository = saleRepository;
        }

        public async Task<DashboardStatsDto> Handle(GetSalesStatsQuery request, CancellationToken cancellationToken)
        {
            var todaySale = await _saleRepository.GetTodaySalesAsync();
            var lastInvoiceNumber = await _saleRepository.GetLastInvoiceNumberAsync();

            return new DashboardStatsDto
            {
                TodaySale = todaySale,
                LastInvoice = lastInvoiceNumber
            };
        }
    }
}
