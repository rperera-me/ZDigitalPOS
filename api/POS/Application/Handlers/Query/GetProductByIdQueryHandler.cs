using MediatR;
using POS.Domain.Repositories;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDto?>
    {
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ISupplierRepository _supplierRepository;

        public GetProductByIdQueryHandler(
            IProductRepository productRepository,
            IProductBatchRepository batchRepository,
            ICategoryRepository categoryRepository,
            ISupplierRepository supplierRepository)
        {
            _productRepository = productRepository;
            _batchRepository = batchRepository;
            _categoryRepository = categoryRepository;
            _supplierRepository = supplierRepository;
        }

        public async Task<ProductDto?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
        {
            var product = await _productRepository.GetByIdAsync(request.Id);
            if (product == null) return null;

            // Get category name
            var category = await _categoryRepository.GetByIdAsync(product.CategoryId);

            // Get supplier name if exists
            string? supplierName = null;
            if (product.DefaultSupplierId.HasValue)
            {
                var supplier = await _supplierRepository.GetByIdAsync(product.DefaultSupplierId.Value);
                supplierName = supplier?.Name;
            }

            // ✅ Get active batches to calculate price ranges
            var batches = await _batchRepository.GetActiveBatchesByProductIdAsync(product.Id);

            var dto = new ProductDto
            {
                Id = product.Id,
                Barcode = product.Barcode,
                Name = product.Name,
                CategoryId = product.CategoryId,
                CategoryName = category?.Name ?? "",
                DefaultSupplierId = product.DefaultSupplierId,
                DefaultSupplierName = supplierName,
                StockQuantity = product.StockQuantity,
                HasMultipleProductPrices = product.HasMultipleProductPrices
            };

            // ✅ Calculate price ranges from active batches
            if (batches.Any())
            {
                dto.MinCostPrice = batches.Min(b => b.CostPrice);
                dto.MaxCostPrice = batches.Max(b => b.CostPrice);
                dto.MinProductPrice = batches.Min(b => b.ProductPrice);
                dto.MaxProductPrice = batches.Max(b => b.ProductPrice);
                dto.MinSellingPrice = batches.Min(b => b.SellingPrice);
                dto.MaxSellingPrice = batches.Max(b => b.SellingPrice);
                dto.MinWholesalePrice = batches.Min(b => b.WholesalePrice);
                dto.MaxWholesalePrice = batches.Max(b => b.WholesalePrice);
            }

            return dto;
        }
    }
}
