using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetProductsByCategoryQueryHandler : IRequestHandler<GetProductsByCategoryQuery, IEnumerable<ProductDto>>
    {
        private readonly IProductRepository _repository;

        public GetProductsByCategoryQueryHandler(IProductRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ProductDto>> Handle(GetProductsByCategoryQuery request, CancellationToken cancellationToken)
        {
            var products = await _repository.GetByCategoryIdAsync(request.CategoryId);

            return products.Select(p => new ProductDto
            {
                Id = p.Id,
                Barcode = p.Barcode,
                Name = p.Name,
                CategoryId = p.CategoryId,
                PriceRetail = p.PriceRetail,
                PriceWholesale = p.PriceWholesale,
                StockQuantity = p.StockQuantity
            });
        }
    }

}
