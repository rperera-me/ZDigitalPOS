using MediatR;
using POS.Application.DTOs;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Repositories;
using PosSystem.Infrastructure.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetHeldSalesQueryHandler : IRequestHandler<GetHeldSalesQuery, IEnumerable<SaleDto>>
    {
        private readonly ISaleRepository _repository;
        private readonly IProductRepository _productRepository;
        private readonly ICustomerRepository _customerRepository;

        public GetHeldSalesQueryHandler(
            ISaleRepository repository,
            IProductRepository productRepository,
            ICustomerRepository customerRepository)
        {
            _repository = repository;
            _productRepository = productRepository;
            _customerRepository = customerRepository;
        }

        public async Task<IEnumerable<SaleDto>> Handle(GetHeldSalesQuery request, CancellationToken cancellationToken)
        {
            var sales = await _repository.GetHeldSalesAsync();

            // ✅ UPDATED - Collect all product IDs from sales
            var productIds = sales.SelectMany(s => s.SaleItems.Select(si => si.ProductId)).Distinct();

            // Fetch product details for those IDs
            var products = await _productRepository.GetByIdsAsync(productIds);

            // Map productId => productName dictionary
            var productNames = products.ToDictionary(p => p.Id, p => p.Name);

            var saleDtos = new List<SaleDto>();

            foreach (var sale in sales)
            {
                // ✅ UPDATED - Fetch customer details
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
                            Type = customer.Type,
                            CreditBalance = customer.CreditBalance,
                            LoyaltyPoints = customer.LoyaltyPoints
                        };
                    }
                }

                saleDtos.Add(new SaleDto
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
                        ProductName = productNames.TryGetValue(si.ProductId, out var name) ? name : "Unknown",
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
                });
            }

            return saleDtos;
        }
    }
}
