using MediatR;
using POS.Domain.Repositories;
using PosSystem.Application.Commands.Sales;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateSaleCommandHandler : IRequestHandler<CreateSaleCommand, SaleDto>
    {
        private readonly ISaleRepository _saleRepository;
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;

        public CreateSaleCommandHandler(
            ISaleRepository saleRepository,
            IProductRepository productRepository,
            IProductBatchRepository batchRepository)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
            _batchRepository = batchRepository;
        }

        public async Task<SaleDto> Handle(CreateSaleCommand request, CancellationToken cancellationToken)
        {
            var saleItems = new List<SaleItem>();

            foreach (var itemDto in request.SaleItems)
            {
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                    throw new KeyNotFoundException($"Product ID {itemDto.ProductId} not found");

                // If product has batches, deduct from specific batch
                if (itemDto.BatchId.HasValue)
                {
                    var batch = await _batchRepository.GetByIdAsync(itemDto.BatchId.Value);
                    if (batch == null)
                        throw new KeyNotFoundException($"Batch ID {itemDto.BatchId} not found");

                    if (batch.RemainingQuantity < itemDto.Quantity)
                        throw new InvalidOperationException($"Insufficient stock in batch {batch.BatchNumber}");

                    // Deduct from batch
                    batch.RemainingQuantity -= itemDto.Quantity;
                    await _batchRepository.UpdateAsync(batch);
                }

                // Deduct from product total stock
                product.StockQuantity -= itemDto.Quantity;
                await _productRepository.UpdateAsync(product);

                saleItems.Add(new SaleItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    Price = itemDto.Price
                });
            }

            var sale = new Sale
            {
                CashierId = request.CashierId,
                CustomerId = request.CustomerId,
                SaleDate = DateTime.Now,
                IsHeld = request.IsHeld,
                TotalAmount = request.TotalAmount,
                PaymentType = request.PaymentType,
                AmountPaid = request.AmountPaid,
                SaleItems = saleItems
            };

            var createdSale = await _saleRepository.AddAsync(sale);

            return new SaleDto
            {
                Id = createdSale.Id,
                CashierId = createdSale.CashierId,
                CustomerId = createdSale.CustomerId,
                SaleDate = createdSale.SaleDate,
                IsHeld = createdSale.IsHeld,
                TotalAmount = createdSale.TotalAmount,
                PaymentType = createdSale.PaymentType,
                AmountPaid = createdSale.AmountPaid,
                SaleItems = createdSale.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    Quantity = si.Quantity,
                    Price = si.Price
                }).ToList()
            };
        }
    }
}
