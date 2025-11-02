using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, IEnumerable<ProductDto>>
    {
        private readonly IProductRepository _repository;

        public GetAllProductsQueryHandler(IProductRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ProductDto>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
        {
            var products = await _repository.GetAllAsync();

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
