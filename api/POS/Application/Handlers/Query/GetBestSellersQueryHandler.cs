using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Dashboard;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetBestSellersQueryHandler : IRequestHandler<GetBestSellersQuery, List<BestSellerDto>>
    {
        private readonly ISaleRepository _saleRepository;

        public GetBestSellersQueryHandler(ISaleRepository saleRepository)
        {
            _saleRepository = saleRepository;
        }

        public async Task<List<BestSellerDto>> Handle(GetBestSellersQuery request, CancellationToken cancellationToken)
        {
            return await _saleRepository.GetBestSellersAsync();
        }
    }
}
