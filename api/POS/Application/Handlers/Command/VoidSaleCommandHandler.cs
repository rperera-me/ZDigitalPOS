using MediatR;
using POS.Application.Commands.Sales;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class VoidSaleCommandHandler : IRequestHandler<VoidSaleCommand>
    {
        private readonly ISaleRepository _saleRepository;
        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly ICustomerRepository _customerRepository;

        public VoidSaleCommandHandler(
            ISaleRepository saleRepository,
            IProductRepository productRepository,
            IProductBatchRepository batchRepository,
            ICustomerRepository customerRepository)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
            _batchRepository = batchRepository;
            _customerRepository = customerRepository;
        }

        public async Task Handle(VoidSaleCommand request, CancellationToken cancellationToken)
        {
            // Get the sale
            var sale = await _saleRepository.GetByIdAsync(request.SaleId);

            if (sale == null)
                throw new KeyNotFoundException($"Sale ID {request.SaleId} not found");

            if (sale.IsVoided)
                throw new InvalidOperationException("Sale is already voided");

            // RESTORE STOCK: Add back quantities to products and batches
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

            // REVERSE CUSTOMER CREDIT/LOYALTY if applicable
            if (sale.CustomerId.HasValue)
            {
                var customer = await _customerRepository.GetByIdAsync(sale.CustomerId.Value);
                if (customer != null)
                {
                    // Reverse credit if credit payment was made
                    var creditPayment = sale.Payments?.FirstOrDefault(p => p.Type == "Credit");
                    if (creditPayment != null)
                    {
                        customer.CreditBalance -= creditPayment.Amount;
                        if (customer.CreditBalance < 0) customer.CreditBalance = 0;
                    }

                    // Reverse loyalty points if earned
                    if (customer.Type == "loyalty")
                    {
                        int pointsEarned = (int)((sale.FinalAmount ?? sale.TotalAmount) / 100);
                        customer.LoyaltyPoints -= pointsEarned;
                        if (customer.LoyaltyPoints < 0) customer.LoyaltyPoints = 0;
                    }

                    await _customerRepository.UpdateAsync(customer);
                }
            }

            // Mark sale as voided
            sale.IsVoided = true;
            sale.VoidedDate = DateTime.Now;
            await _saleRepository.UpdateAsync(sale);
        }
    }
}
