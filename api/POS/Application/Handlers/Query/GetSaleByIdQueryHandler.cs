using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetSaleByIdQueryHandler : IRequestHandler<GetSaleByIdQuery, SaleDto?>
    {
        private readonly ISaleRepository _repository;

        public GetSaleByIdQueryHandler(ISaleRepository repository)
        {
            _repository = repository;
        }

        public async Task<SaleDto?> Handle(GetSaleByIdQuery request, CancellationToken cancellationToken)
        {
            var sale = await _repository.GetByIdAsync(request.Id);

            if (sale == null) return null;

            return new SaleDto
            {
                Id = sale.Id,
                CashierId = sale.CashierId,
                CustomerId = sale.CustomerId,
                SaleDate = sale.SaleDate,
                IsHeld = sale.IsHeld,
                TotalAmount = sale.TotalAmount,
                PaymentType = sale.PaymentType,
                AmountPaid = sale.AmountPaid,
                SaleItems = sale.SaleItems.Select(si => new SaleItemDto
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
