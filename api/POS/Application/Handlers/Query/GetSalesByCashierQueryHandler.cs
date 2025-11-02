using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetSalesByCashierQueryHandler : IRequestHandler<GetSalesByCashierQuery, IEnumerable<SaleDto>>
    {
        private readonly ISaleRepository _repository;

        public GetSalesByCashierQueryHandler(ISaleRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<SaleDto>> Handle(GetSalesByCashierQuery request, CancellationToken cancellationToken)
        {
            var sales = await _repository.GetSalesByCashierAsync(request.CashierId);

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
                    Quantity = si.Quantity,
                    Price = si.Price
                }).ToList()
            });
        }
    }

}
