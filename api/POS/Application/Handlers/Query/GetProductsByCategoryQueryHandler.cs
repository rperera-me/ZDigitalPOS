using MediatR;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetProductsByCategoryQueryHandler : IRequestHandler<GetProductsByCategoryQuery, IEnumerable<ProductDto>>
    {
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ISupplierRepository _supplierRepository;

        public GetProductsByCategoryQueryHandler(
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

        public async Task<IEnumerable<ProductDto>> Handle(GetProductsByCategoryQuery request, CancellationToken cancellationToken)
        {
            var products = await _productRepository.GetByCategoryIdAsync(request.CategoryId);
            var productDtos = new List<ProductDto>();

            foreach (var product in products)
            {
                var category = await _categoryRepository.GetByIdAsync(product.CategoryId);

                var batches = (await _batchRepository.GetActiveBatchesByProductIdAsync(product.Id))
                .OrderBy(b => b.ReceivedDate)
                .ToList();

                var dto = new ProductDto
                {
                    Id = product.Id,
                    Barcode = product.Barcode,
                    Name = product.Name,
                    CategoryId = product.CategoryId,
                    CategoryName = category?.Name ?? "",
                    StockQuantity = product.StockQuantity,
                    HasMultipleProductPrices = product.HasMultipleProductPrices,
                    Batches = await MapBatchesToDto(batches)
                };

                productDtos.Add(dto);
            }

            return productDtos;
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
