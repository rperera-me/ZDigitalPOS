using MediatR;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using POS.Infrastructure.Repositories;
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
            var batches = (await _batchRepository.GetActiveBatchesByProductIdAsync(created.Id))
                .OrderBy(b => b.ReceivedDate)
                .ToList();

            var dto = new ProductDto
            {
                Id = created.Id,
                Barcode = created.Barcode,
                Name = created.Name,
                CategoryId = created.CategoryId,
                CategoryName = category?.Name ?? "",
                StockQuantity = created.StockQuantity,
                HasMultipleProductPrices = created.HasMultipleProductPrices,
                Batches = await MapBatchesToDto(batches)
            };
            return dto;
        }

        private async Task<List<ProductBatchDto>> MapBatchesToDto(List<ProductBatch> batches)
        {
            var batchDtos = new List<ProductBatchDto>();

            foreach (var batch in batches)
            {
                var supplier = batch.SupplierId.HasValue
                    ? await _supplierRepository.GetByIdAsync(batch.SupplierId.Value)
                    : null;

                batchDtos.Add(new ProductBatchDto
                {
                    Id = batch.Id,
                    ProductId = batch.ProductId,
                    BatchNumber = batch.BatchNumber,
                    SupplierId = batch.SupplierId,
                    SupplierName = supplier?.Name ?? "Initial Stock",
                    CostPrice = batch.CostPrice,
                    ProductPrice = batch.ProductPrice,
                    SellingPrice = batch.SellingPrice,
                    WholesalePrice = batch.WholesalePrice,
                    Quantity = batch.Quantity,
                    RemainingQuantity = batch.RemainingQuantity,
                    ManufactureDate = batch.ManufactureDate,
                    ExpiryDate = batch.ExpiryDate,
                    ReceivedDate = batch.ReceivedDate
                });
            }

            return batchDtos;
        }
    }
}
