using MediatR;
using POS.Application.Commands.Sales;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class DeleteHeldSaleCommandHandler : IRequestHandler<DeleteHeldSaleCommand>
    {
        private readonly ISaleRepository _saleRepository;
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;

        public DeleteHeldSaleCommandHandler(
            ISaleRepository saleRepository,
            IProductRepository productRepository,
            IProductBatchRepository batchRepository)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
            _batchRepository = batchRepository;
        }

        public async Task Handle(DeleteHeldSaleCommand request, CancellationToken cancellationToken)
        {
            // ✅ Get the held sale first
            var sale = await _saleRepository.GetByIdAsync(request.SaleId);

            if (sale == null)
                throw new KeyNotFoundException($"Sale ID {request.SaleId} not found");

            if (!sale.IsHeld)
                throw new InvalidOperationException("Can only delete held sales");

            // ✅ RESTORE STOCK: Add back quantities to products and batches
            foreach (var item in sale.SaleItems)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity += item.Quantity;
                    await _productRepository.UpdateAsync(product);
                }

                if (item.BatchId.HasValue && item.BatchId.Value > 0)
                {
                    var batch = await _batchRepository.GetByIdAsync(item.BatchId.Value);
                    if (batch != null)
                    {
                        batch.RemainingQuantity += item.Quantity;
                        await _batchRepository.UpdateAsync(batch);
                    }
                }
            }

            // ✅ CHANGED: Use proper delete method (not ReleaseHeldSaleAsync)
            // Assuming you need to add a DeleteAsync method to ISaleRepository
            await _saleRepository.DeleteAsync(request.SaleId);
        }
    }
}
