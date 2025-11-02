using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Dashboard;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetLowStockQueryHandler : IRequestHandler<GetLowStockQuery, List<LowStockItemDto>>
    {
        private readonly IProductRepository _productRepository;

        public GetLowStockQueryHandler(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<List<LowStockItemDto>> Handle(GetLowStockQuery request, CancellationToken cancellationToken)
        {
            var products = await _productRepository.GetAllAsync();
            var lowStock = products
                .Where(p => p.StockQuantity <= 5) // or your threshold for low stock
                .Select(p => new LowStockItemDto
                {
                    Barcode = p.Barcode,
                    Item = p.Name,
                    Available = p.StockQuantity
                })
                .ToList();

            return lowStock;
        }
    }
}
