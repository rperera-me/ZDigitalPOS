using MediatR;
using POS.Domain.Repositories;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDto>
    {
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ISupplierRepository _supplierRepository;

        public UpdateProductCommandHandler(
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

        public async Task<ProductDto> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
        {
            var existing = await _productRepository.GetByIdAsync(request.Id);
            if (existing == null) throw new KeyNotFoundException("Product not found");

            existing.Barcode = request.Barcode;
            existing.Name = request.Name;
            existing.CategoryId = request.CategoryId;
            existing.StockQuantity = request.StockQuantity;

            var updated = await _productRepository.UpdateAsync(existing);

            // Fetch names for DTO
            var category = await _categoryRepository.GetByIdAsync(updated.CategoryId);
            var supplier = updated.DefaultSupplierId.HasValue
                ? await _supplierRepository.GetByIdAsync(updated.DefaultSupplierId.Value)
                : null;

            // ✅ Get batches to calculate price ranges
            var batches = await _batchRepository.GetActiveBatchesByProductIdAsync(updated.Id);

            var dto = new ProductDto
            {
                Id = updated.Id,
                Barcode = updated.Barcode,
                Name = updated.Name,
                CategoryId = updated.CategoryId,
                CategoryName = category?.Name ?? "",
                DefaultSupplierId = updated.DefaultSupplierId,
                DefaultSupplierName = supplier?.Name,
                StockQuantity = updated.StockQuantity,
                HasMultipleProductPrices = updated.HasMultipleProductPrices
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
