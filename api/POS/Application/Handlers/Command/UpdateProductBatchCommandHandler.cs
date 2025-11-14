using MediatR;
using POS.Application.Commands.Products;
using POS.Application.DTOs;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateProductBatchCommandHandler : IRequestHandler<UpdateProductBatchCommand, ProductBatchDto>
    {
        private readonly IProductBatchRepository _batchRepository;
        private readonly IProductRepository _productRepository;
        private readonly ISupplierRepository _supplierRepository;

        public UpdateProductBatchCommandHandler(
            IProductBatchRepository batchRepository,
            IProductRepository productRepository,
            ISupplierRepository supplierRepository)
        {
            _batchRepository = batchRepository;
            _productRepository = productRepository;
            _supplierRepository = supplierRepository;
        }

        public async Task<ProductBatchDto> Handle(UpdateProductBatchCommand request, CancellationToken cancellationToken)
        {
            // Get existing batch
            var batch = await _batchRepository.GetByIdAsync(request.Id);
            if (batch == null)
                throw new KeyNotFoundException($"Batch with ID {request.Id} not found");

            // Validate prices
            if (request.SellingPrice <= 0)
                throw new ArgumentException("Selling price must be greater than 0");

            if (request.WholesalePrice <= 0)
                throw new ArgumentException("Wholesale price must be greater than 0");

            // Update only selling and wholesale prices
            batch.SellingPrice = request.SellingPrice;
            batch.WholesalePrice = request.WholesalePrice;

            var updated = await _batchRepository.UpdateAsync(batch);

            // ✅ After updating batch, recalculate product's HasMultipleProductPrices flag
            var product = await _productRepository.GetByIdAsync(batch.ProductId);
            if (product != null)
            {
                var allBatches = await _batchRepository.GetActiveBatchesByProductIdAsync(batch.ProductId);
                var distinctPrices = allBatches
                    .Select(b => Math.Round(b.ProductPrice, 2))
                    .Distinct()
                    .Count();

                product.HasMultipleProductPrices = distinctPrices > 1;
                await _productRepository.UpdateAsync(product);
            }

            // Get related entities for DTO
            var productEntity = await _productRepository.GetByIdAsync(updated.ProductId);
            var supplier = await _supplierRepository.GetByIdAsync(updated.SupplierId ?? 0);

            return new ProductBatchDto
            {
                Id = updated.Id,
                ProductId = updated.ProductId,
                ProductName = productEntity?.Name ?? "",
                BatchNumber = updated.BatchNumber,
                SupplierId = updated.SupplierId,
                SupplierName = supplier?.Name ?? "",
                CostPrice = updated.CostPrice,
                ProductPrice = updated.ProductPrice,
                SellingPrice = updated.SellingPrice,
                WholesalePrice = updated.WholesalePrice,
                Quantity = updated.Quantity,
                RemainingQuantity = updated.RemainingQuantity,
                ManufactureDate = updated.ManufactureDate,
                ExpiryDate = updated.ExpiryDate,
                ReceivedDate = updated.ReceivedDate
            };
        }
    }
}
