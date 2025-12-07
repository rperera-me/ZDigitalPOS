using MediatR;
using POS.Application.DTOs;
using POS.Domain.Entities;
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

            var category = await _categoryRepository.GetByIdAsync(product.CategoryId);

            var batches = (await _batchRepository.GetActiveBatchesByProductIdAsync(product.Id))
                .OrderBy(b => b.ReceivedDate)
                .ToList();

            return new ProductDto
            {
                Id = product.Id,
                Barcode = product.Barcode,
                Name = product.Name,
                CategoryId = product.CategoryId,
                CategoryName = category?.Name ?? "",
                StockQuantity = product.StockQuantity,
                HasMultipleProductPrices = product.HasMultipleProductPrices,
                Batches = await MapBatchesToDto(batches) // Use same helper method
            };
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
