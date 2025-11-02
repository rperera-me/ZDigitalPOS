using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetSalesByDateRangeQueryHandler : IRequestHandler<GetSalesByDateRangeQuery, IEnumerable<SaleDto>>
    {
        private readonly ISaleRepository _repository;

        public GetSalesByDateRangeQueryHandler(ISaleRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<SaleDto>> Handle(GetSalesByDateRangeQuery request, CancellationToken cancellationToken)
        {
            var sales = await _repository.GetSalesByDateRangeAsync(request.StartDate, request.EndDate);

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
