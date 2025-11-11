using MediatR;
using POS.Application.DTOs;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetSaleByIdQueryHandler : IRequestHandler<GetSaleByIdQuery, SaleDto?>
    {
        private readonly ISaleRepository _repository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IProductRepository _productRepository;

        public GetSaleByIdQueryHandler(
            ISaleRepository repository,
            ICustomerRepository customerRepository,
            IProductRepository productRepository)
        {
            _repository = repository;
            _customerRepository = customerRepository;
            _productRepository = productRepository;
        }

        public async Task<SaleDto?> Handle(GetSaleByIdQuery request, CancellationToken cancellationToken)
        {
            var sale = await _repository.GetByIdAsync(request.Id);

            if (sale == null) return null;

            // ✅ UPDATED - Fetch customer details if exists
            CustomerDto? customerDto = null;
            if (sale.CustomerId.HasValue)
            {
                var customer = await _customerRepository.GetByIdAsync(sale.CustomerId.Value);
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

            // ✅ UPDATED - Fetch product names for sale items
            var productIds = sale.SaleItems.Select(si => si.ProductId).Distinct();
            var products = await _productRepository.GetByIdsAsync(productIds);
            var productDict = products.ToDictionary(p => p.Id, p => p.Name);

            return new SaleDto
            {
                Id = sale.Id,
                CashierId = sale.CashierId,
                CustomerId = sale.CustomerId,
                Customer = customerDto,
                SaleDate = sale.SaleDate,
                IsHeld = sale.IsHeld,
                TotalAmount = sale.TotalAmount,
                DiscountType = sale.DiscountType,
                DiscountValue = sale.DiscountValue,
                DiscountAmount = sale.DiscountAmount,
                FinalAmount = sale.FinalAmount ?? sale.TotalAmount,
                PaymentType = sale.PaymentType,
                AmountPaid = sale.AmountPaid,
                Change = sale.Change,
                SaleItems = sale.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = productDict.ContainsKey(si.ProductId) ? productDict[si.ProductId] : "Unknown",
                    BatchId = si.BatchId,
                    BatchNumber = si.BatchNumber,
                    Quantity = si.Quantity,
                    Price = si.Price
                }).ToList(),
                Payments = sale.Payments.Select(p => new PaymentDto
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
