using MediatR;
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

        public GetHeldSalesQueryHandler(ISaleRepository repository, IProductRepository productRepository)
        {
            _repository = repository;
            _productRepository = productRepository;
        }

        public async Task<IEnumerable<SaleDto>> Handle(GetHeldSalesQuery request, CancellationToken cancellationToken)
        {
            var sales = await _repository.GetHeldSalesAsync();

            // Collect all product IDs from sales
            var productIds = sales.SelectMany(s => s.SaleItems.Select(si => si.ProductId)).Distinct();

            // Fetch product details for those IDs (assume repository method)
            var products = await _productRepository.GetByIdsAsync(productIds);

            // Map productId => productName dictionary
            var productNames = products.ToDictionary(p => p.Id, p => p.Name);

            return sales.Select(s => new SaleDto
            {
                Id = s.Id,
                CashierId = s.CashierId,
                CustomerId = s.CustomerId,
                SaleDate = s.SaleDate,
                IsHeld = s.IsHeld,
                TotalAmount = s.TotalAmount,
                PaymentType = s.PaymentType,
                AmountPaid = s.AmountPaid,
                SaleItems = s.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = productNames.TryGetValue(si.ProductId, out var name) ? name : "",
                    Quantity = si.Quantity,
                    Price = si.Price
                }).ToList()
            });
        }
    }

}
