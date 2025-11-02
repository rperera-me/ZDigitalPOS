using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDto?>
    {
        private readonly IProductRepository _repository;

        public GetProductByIdQueryHandler(IProductRepository repository)
        {
            _repository = repository;
        }

        public async Task<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
        {
            var product = await _repository.GetByIdAsync(request.Id);

            if (product == null) return null;

            return new ProductDto
            {
                Id = product.Id,
                Barcode = product.Barcode,
                Name = product.Name,
                CategoryId = product.CategoryId,
                PriceRetail = product.PriceRetail,
                PriceWholesale = product.PriceWholesale,
                StockQuantity = product.StockQuantity
            };
        }
    }

}
