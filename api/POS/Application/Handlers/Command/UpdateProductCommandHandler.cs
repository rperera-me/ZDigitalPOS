using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using POS.Infrastructure.Repositories;
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

            var batches = (await _batchRepository.GetActiveBatchesByProductIdAsync(updated.Id))
                .OrderBy(b => b.ReceivedDate)
                .ToList();

            var dto = new ProductDto
            {
                Id = updated.Id,
                Barcode = updated.Barcode,
                Name = updated.Name,
                CategoryId = updated.CategoryId,
                CategoryName = category?.Name ?? "",
                StockQuantity = updated.StockQuantity,
                HasMultipleProductPrices = updated.HasMultipleProductPrices,
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
