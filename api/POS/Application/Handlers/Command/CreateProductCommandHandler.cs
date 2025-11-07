using MediatR;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
    {
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ISupplierRepository _supplierRepository;

        public CreateProductCommandHandler(
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

        public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            var entity = new Product
            {
                Barcode = request.Barcode,
                Name = request.Name,
                CategoryId = request.CategoryId,
                DefaultSupplierId = request.DefaultSupplierId,
                PriceRetail = request.PriceRetail,
                PriceWholesale = request.PriceWholesale,
                StockQuantity = request.StockQuantity,
                HasMultipleProductPrices = false // Will be set to true when second different price is added via GRN
            };

            var created = await _productRepository.AddAsync(entity);

            // If stock quantity > 0 and price information is provided, create initial price source
            if (request.StockQuantity > 0 && request.ProductPrice.HasValue)
            {
                var batch = new ProductBatch
                {
                    ProductId = created.Id,
                    BatchNumber = request.BatchNumber ?? "INITIAL",
                    SupplierId = request.DefaultSupplierId ?? 0,
                    CostPrice = request.CostPrice ?? 0,
                    ProductPrice = request.ProductPrice.Value,
                    SellingPrice = request.SellingPrice ?? request.PriceRetail,
                    WholesalePrice = request.PriceWholesale,
                    Quantity = request.StockQuantity,
                    RemainingQuantity = request.StockQuantity,
                    ManufactureDate = request.ManufactureDate ?? DateTime.Now,
                    ExpiryDate = request.ExpiryDate,
                    ReceivedDate = DateTime.Now,
                    IsActive = true
                };

                await _batchRepository.AddAsync(batch);
            }

            // Fetch category and supplier names for DTO
            var category = await _categoryRepository.GetByIdAsync(created.CategoryId);
            var supplier = request.DefaultSupplierId.HasValue
                ? await _supplierRepository.GetByIdAsync(request.DefaultSupplierId.Value)
                : null;

            return new ProductDto
            {
                Id = created.Id,
                Barcode = created.Barcode,
                Name = created.Name,
                CategoryId = created.CategoryId,
                CategoryName = category?.Name ?? "",
                DefaultSupplierId = created.DefaultSupplierId,
                DefaultSupplierName = supplier?.Name,
                PriceRetail = created.PriceRetail,
                PriceWholesale = created.PriceWholesale,
                StockQuantity = created.StockQuantity,
                HasMultipleProductPrices = created.HasMultipleProductPrices
            };
        }
    }

}
