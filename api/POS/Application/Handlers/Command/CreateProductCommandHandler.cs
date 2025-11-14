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

        public CreateProductCommandHandler(
            IProductRepository productRepository,
            IProductBatchRepository batchRepository,
            ICategoryRepository categoryRepository,
            ISupplierRepository supplierRepository)
        {
            _productRepository = productRepository;
            _batchRepository = batchRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            if (request.StockQuantity > 0)
            {
                if (!request.CostPrice.HasValue || request.CostPrice.Value < 0)
                    throw new ArgumentException("Cost price must be >= 0 when stock quantity > 0");

                if (!request.ProductPrice.HasValue || request.ProductPrice.Value < 0)
                    throw new ArgumentException("Product price (MRP) must be >= 0 when stock quantity > 0");

                if (!request.SellingPrice.HasValue || request.SellingPrice.Value < 0)
                    throw new ArgumentException("Selling price must be >= 0 when stock quantity > 0");

                if (!request.WholesalePrice.HasValue || request.WholesalePrice.Value < 0)
                    throw new ArgumentException("Wholesale price must be >= 0 when stock quantity > 0");
            }

            var entity = new Product
            {
                Barcode = request.Barcode,
                Name = request.Name,
                CategoryId = request.CategoryId,
                StockQuantity = request.StockQuantity,
                HasMultipleProductPrices = false
            };

            var created = await _productRepository.AddAsync(entity);

            // ✅ If stock quantity > 0 and price information is provided, create initial batch
            if (request.StockQuantity > 0 && request.ProductPrice.HasValue)
            {
                var batch = new ProductBatch
                {
                    ProductId = created.Id,
                    BatchNumber = "INITIAL",
                    SupplierId = null,
                    CostPrice = request.CostPrice ?? 0,
                    ProductPrice = request.ProductPrice.Value,
                    SellingPrice = request.SellingPrice ?? request.ProductPrice.Value,
                    WholesalePrice = request.WholesalePrice ?? request.ProductPrice.Value,
                    Quantity = request.StockQuantity,
                    RemainingQuantity = request.StockQuantity,
                    ManufactureDate = request.ManufactureDate ?? DateTime.Now,
                    ExpiryDate = request.ExpiryDate,
                    ReceivedDate = DateTime.Now,
                    IsActive = true
                };

                await _batchRepository.AddAsync(batch);
            }

            // Fetch names for DTO
            var category = await _categoryRepository.GetByIdAsync(created.CategoryId);
            // ✅ Get batches to calculate price ranges
            var batches = await _batchRepository.GetActiveBatchesByProductIdAsync(created.Id);

            var dto = new ProductDto
            {
                Id = created.Id,
                Barcode = created.Barcode,
                Name = created.Name,
                CategoryId = created.CategoryId,
                CategoryName = category?.Name ?? "",
                StockQuantity = created.StockQuantity,
                HasMultipleProductPrices = created.HasMultipleProductPrices
            };

            // ✅ Calculate price ranges
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
