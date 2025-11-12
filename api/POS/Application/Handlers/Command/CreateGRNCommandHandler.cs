using MediatR;
using POS.Application.Commands.GRN;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateGRNCommandHandler : IRequestHandler<CreateGRNCommand, GRNDto>
    {
        private readonly IGRNRepository _grnRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly IProductRepository _productRepository;

        public CreateGRNCommandHandler(
            IGRNRepository grnRepository,
            IProductBatchRepository batchRepository,
            IProductRepository productRepository)
        {
            _grnRepository = grnRepository;
            _batchRepository = batchRepository;
            _productRepository = productRepository;
        }

        public async Task<GRNDto> Handle(CreateGRNCommand request, CancellationToken cancellationToken)
        {
            var grnNumber = await _grnRepository.GenerateGRNNumberAsync();

            var grn = new GRN
            {
                GRNNumber = grnNumber,
                SupplierId = request.SupplierId,
                ReceivedBy = request.ReceivedBy,
                ReceivedDate = DateTime.Now,
                Notes = request.Notes,
                TotalAmount = request.Items.Sum(i => i.CostPrice * i.Quantity),
                Items = request.Items.Select(i => new GRNItem
                {
                    ProductId = i.ProductId,
                    BatchNumber = i.BatchNumber,
                    Quantity = i.Quantity,
                    CostPrice = i.CostPrice,
                    ProductPrice = i.ProductPrice,
                    SellingPrice = i.SellingPrice,
                    WholesalePrice = i.WholesalePrice,
                    ManufactureDate = i.ManufactureDate,
                    ExpiryDate = i.ExpiryDate
                }).ToList()
            };

            var created = await _grnRepository.AddAsync(grn);

            // Create product batches and check for multiple prices
            foreach (var item in request.Items)
            {
                var batch = new ProductBatch
                {
                    ProductId = item.ProductId,
                    BatchNumber = item.BatchNumber,
                    SupplierId = request.SupplierId,
                    CostPrice = item.CostPrice,
                    ProductPrice = item.ProductPrice,
                    SellingPrice = item.SellingPrice,
                    WholesalePrice = item.WholesalePrice,
                    Quantity = item.Quantity,
                    RemainingQuantity = item.Quantity,
                    ManufactureDate = item.ManufactureDate ?? DateTime.Now,
                    ExpiryDate = item.ExpiryDate,
                    ReceivedDate = DateTime.Now,
                    GRNId = created.Id,
                    IsActive = true
                };

                await _batchRepository.AddAsync(batch);

                // Update product stock
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity += item.Quantity;

                    // ✅ CHECK FOR MULTIPLE PRODUCT PRICES
                    var existingBatches = await _batchRepository.GetActiveBatchesByProductIdAsync(item.ProductId);
                    var distinctPrices = existingBatches
                        .Select(b => Math.Round(b.ProductPrice, 2))
                        .Distinct()
                        .Count();

                    product.HasMultipleProductPrices = distinctPrices > 1;

                    await _productRepository.UpdateAsync(product);
                }
            }

            return new GRNDto
            {
                Id = created.Id,
                GRNNumber = created.GRNNumber,
                SupplierId = created.SupplierId,
                ReceivedDate = created.ReceivedDate,
                ReceivedBy = created.ReceivedBy,
                TotalAmount = created.TotalAmount,
                Notes = created.Notes,
                Items = created.Items.Select(i => new GRNItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    BatchNumber = i.BatchNumber,
                    Quantity = i.Quantity,
                    CostPrice = i.CostPrice,
                    ProductPrice = i.ProductPrice,
                    SellingPrice = i.SellingPrice,
                    WholesalePrice = i.WholesalePrice,
                    ManufactureDate = i.ManufactureDate,
                    ExpiryDate = i.ExpiryDate
                }).ToList()
            };
        }
    }
}