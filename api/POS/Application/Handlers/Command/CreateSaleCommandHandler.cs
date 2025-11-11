using MediatR;
using POS.Application.DTOs;
using POS.Domain.Entities;
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
        private readonly ICustomerRepository _customerRepository;

        public CreateSaleCommandHandler(
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

        public async Task<SaleDto> Handle(CreateSaleCommand request, CancellationToken cancellationToken)
        {
            var saleItems = new List<SaleItem>();
            var payments = new List<Payment>();

            // Process sale items and update inventory
            foreach (var itemDto in request.SaleItems)
            {
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                    throw new KeyNotFoundException($"Product ID {itemDto.ProductId} not found");

                // Check stock availability
                if (product.StockQuantity < itemDto.Quantity)
                    throw new InvalidOperationException($"Insufficient stock for {product.Name}");

                // If batch/source is specified, deduct from specific batch
                if (itemDto.BatchId.HasValue && itemDto.BatchId.Value > 0)
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
                    BatchId = itemDto.BatchId,
                    BatchNumber = itemDto.BatchNumber,
                    Quantity = itemDto.Quantity,
                    Price = itemDto.Price
                });
            }

            // Process payments
            if (request.Payments != null && request.Payments.Any())
            {
                foreach (var paymentDto in request.Payments)
                {
                    payments.Add(new Payment
                    {
                        Type = paymentDto.Type,
                        Amount = paymentDto.Amount,
                        CardLastFour = paymentDto.CardLastFour
                    });
                }
            }

            // Calculate final amount
            var finalAmount = request.FinalAmount > 0 ? request.FinalAmount : request.TotalAmount;

            var sale = new Sale
            {
                CashierId = request.CashierId,
                CustomerId = request.CustomerId,
                SaleDate = DateTime.Now,
                IsHeld = request.IsHeld,
                TotalAmount = request.TotalAmount,
                DiscountType = request.DiscountType,
                DiscountValue = request.DiscountValue,
                DiscountAmount = request.DiscountAmount,
                FinalAmount = finalAmount,
                PaymentType = request.PaymentType,
                AmountPaid = request.AmountPaid,
                Change = request.Change,
                SaleItems = saleItems,
                Payments = payments
            };

            var createdSale = await _saleRepository.AddAsync(sale);

            // Handle customer loyalty points and credit (only for completed sales)
            if (request.CustomerId.HasValue && !request.IsHeld)
            {
                var customer = await _customerRepository.GetByIdAsync(request.CustomerId.Value);
                if (customer != null)
                {
                    // Check if credit payment was made
                    var creditPayment = payments.FirstOrDefault(p => p.Type == "Credit");
                    if (creditPayment != null)
                    {
                        customer.CreditBalance += creditPayment.Amount;
                        // Reset loyalty points when credit is added
                        if (customer.Type == "loyalty")
                        {
                            customer.LoyaltyPoints = 0;
                        }
                    }

                    // Handle loyalty points (only for loyalty customers without credit)
                    if (customer.Type == "loyalty")
                    {
                        if (customer.CreditBalance > 0)
                        {
                            // Customer has credit - set loyalty points to 0
                            customer.LoyaltyPoints = 0;
                        }
                        else
                        {
                            // Add 1 loyalty point for every Rs.100 spent
                            int pointsToAdd = (int)(finalAmount / 100);
                            customer.LoyaltyPoints += pointsToAdd;
                        }
                    }

                    await _customerRepository.UpdateAsync(customer);
                }
            }

            // Fetch customer details for response
            CustomerDto? customerDto = null;
            if (createdSale.CustomerId.HasValue)
            {
                var customer = await _customerRepository.GetByIdAsync(createdSale.CustomerId.Value);
                if (customer != null)
                {
                    customerDto = new CustomerDto
                    {
                        Id = customer.Id,
                        Name = customer.Name,
                        Phone = customer.Phone,
                        Address = customer.Address,
                        NICNumber = customer.NICNumber,
                        Type = customer.Type,
                        CreditBalance = customer.CreditBalance,
                        LoyaltyPoints = customer.LoyaltyPoints,
                        CreatedAt = customer.CreatedAt
                    };
                }
            }

            return new SaleDto
            {
                Id = createdSale.Id,
                CashierId = createdSale.CashierId,
                CustomerId = createdSale.CustomerId,
                Customer = customerDto,
                SaleDate = createdSale.SaleDate,
                IsHeld = createdSale.IsHeld,
                TotalAmount = createdSale.TotalAmount,
                DiscountType = createdSale.DiscountType,
                DiscountValue = createdSale.DiscountValue,
                DiscountAmount = createdSale.DiscountAmount,
                FinalAmount = createdSale.FinalAmount ?? createdSale.TotalAmount,
                PaymentType = createdSale.PaymentType,
                AmountPaid = createdSale.AmountPaid,
                Change = createdSale.Change,
                SaleItems = createdSale.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    BatchId = si.BatchId,
                    BatchNumber = si.BatchNumber,
                    Quantity = si.Quantity,
                    Price = si.Price
                }).ToList(),
                Payments = createdSale.Payments.Select(p => new PaymentDto
                {
                    Id = p.Id,
                    Type = p.Type,
                    Amount = p.Amount,
                    CardLastFour = p.CardLastFour
                }).ToList()
            };
        }
    }
}
