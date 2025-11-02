using MediatR;
using POS.Application.Queries.Products;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetProductByBarcodeQueryHandler : IRequestHandler<GetProductByBarcodeQuery, ProductDto>
    {
        private readonly IProductRepository _productRepository;

        public GetProductByBarcodeQueryHandler(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<ProductDto?> Handle(GetProductByBarcodeQuery request, CancellationToken cancellationToken)
        {
            var product = await _productRepository.GetByBarcodeAsync(request.Barcode);

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
