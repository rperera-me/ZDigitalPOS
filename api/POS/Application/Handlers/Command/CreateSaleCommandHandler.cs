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
        private readonly IPaymentRepository _paymentRepository;
        private readonly IUserRepository _userRepository;

        public CreateSaleCommandHandler(
            ISaleRepository saleRepository,
            IProductRepository productRepository,
            IProductBatchRepository batchRepository,
            ICustomerRepository customerRepository,
            IPaymentRepository paymentRepository,
            IUserRepository userRepository)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
            _batchRepository = batchRepository;
            _customerRepository = customerRepository;
            _paymentRepository = paymentRepository;
            _userRepository = userRepository;
        }

        public async Task<SaleDto> Handle(CreateSaleCommand request, CancellationToken cancellationToken)
        {
            if (request.SaleItems == null || !request.SaleItems.Any())
                throw new InvalidOperationException("Sale must have at least one item");

            if (!request.IsHeld && (request.Payments == null || !request.Payments.Any()))
                throw new InvalidOperationException("Completed sales must have at least one payment method");

            var saleItems = new List<SaleItem>();

            // Track enriched data per item (product name + batch regular price) in the same order as saleItems
            var itemMeta = new List<(string ProductName, decimal RegularPrice)>();

            foreach (var itemDto in request.SaleItems)
            {
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                    throw new KeyNotFoundException($"Product ID {itemDto.ProductId} not found");

                if (product.StockQuantity < itemDto.Quantity)
                    throw new InvalidOperationException(
                        $"Insufficient stock for {product.Name}. Available: {product.StockQuantity}, Requested: {itemDto.Quantity}");

                decimal regularPrice = itemDto.Price; // fallback: same as selling price (no savings)

                if (itemDto.BatchId.HasValue && itemDto.BatchId.Value > 0)
                {
                    var batch = await _batchRepository.GetByIdAsync(itemDto.BatchId.Value);
                    if (batch == null)
                        throw new KeyNotFoundException($"Batch ID {itemDto.BatchId} not found");

                    if (batch.RemainingQuantity < itemDto.Quantity)
                        throw new InvalidOperationException(
                            $"Insufficient stock in batch {batch.BatchNumber}. Available: {batch.RemainingQuantity}, Requested: {itemDto.Quantity}");

                    batch.RemainingQuantity -= itemDto.Quantity;
                    await _batchRepository.UpdateAsync(batch);

                    // ProductPrice is the listed / MRP price; sellingPrice is what the customer paid
                    regularPrice = batch.ProductPrice;
                }

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

                itemMeta.Add((product.Name, regularPrice));
            }

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
                Payments = new List<Payment>()
            };

            var createdSale = await _saleRepository.AddAsync(sale);

            // Generate invoice number from confirmed DB id + sale date
            var invoiceNo = $"INV-{createdSale.SaleDate:yyyy-MM}-{createdSale.Id:D6}";

            if (request.Payments != null && request.Payments.Any())
            {
                foreach (var paymentDto in request.Payments)
                {
                    var payment = new Payment
                    {
                        SaleId = createdSale.Id,
                        Type = paymentDto.Type,
                        Amount = paymentDto.Amount,
                        CardLastFour = paymentDto.CardLastFour,
                        CreatedAt = DateTime.Now
                    };
                    await _paymentRepository.AddAsync(payment);
                }

                var savedPayments = await _paymentRepository.GetBySaleIdAsync(createdSale.Id);
                createdSale.Payments = savedPayments.ToList();
            }

            // Update customer loyalty / credit for completed sales
            if (request.CustomerId.HasValue && !request.IsHeld)
            {
                var customer = await _customerRepository.GetByIdAsync(request.CustomerId.Value);
                if (customer != null)
                {
                    var creditPayment = request.Payments?.FirstOrDefault(p => p.Type == "Credit");
                    if (creditPayment != null)
                    {
                        customer.CreditBalance += creditPayment.Amount;
                        if (customer.Type == "loyalty")
                            customer.LoyaltyPoints = 0;
                    }

                    if (customer.Type == "loyalty")
                    {
                        if (customer.CreditBalance > 0)
                            customer.LoyaltyPoints = 0;
                        else
                            customer.LoyaltyPoints += (int)(finalAmount / 100);
                    }

                    await _customerRepository.UpdateAsync(customer);
                }
            }

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
                        LoyaltyPoints = customer.LoyaltyPoints
                    };
                }
            }

            var cashier = await _userRepository.GetByIdAsync(createdSale.CashierId);

            // Build enriched sale items using the meta collected during processing
            var saleItemDtos = createdSale.SaleItems
                .Zip(itemMeta, (si, meta) => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = meta.ProductName,
                    BatchId = si.BatchId,
                    BatchNumber = si.BatchNumber,
                    Quantity = si.Quantity,
                    Price = si.Price,
                    RegularPrice = meta.RegularPrice
                })
                .ToList();

            return new SaleDto
            {
                Id = createdSale.Id,
                InvoiceNo = invoiceNo,
                CashierId = createdSale.CashierId,
                CashierName = cashier?.Username ?? "",
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
                SaleItems = saleItemDtos,
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
