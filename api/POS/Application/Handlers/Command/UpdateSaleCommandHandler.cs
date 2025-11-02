using MediatR;
using PosSystem.Application.Commands.Sales;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateSaleCommandHandler : IRequestHandler<UpdateSaleCommand, SaleDto>
    {
        private readonly ISaleRepository _saleRepository;

        public UpdateSaleCommandHandler(ISaleRepository saleRepository)
        {
            _saleRepository = saleRepository;
        }

        public async Task<SaleDto> Handle(UpdateSaleCommand request, CancellationToken cancellationToken)
        {
            var existing = await _saleRepository.GetByIdAsync(request.Id);
            if (existing == null) throw new KeyNotFoundException("Sale not found");

            existing.IsHeld = request.IsHeld;
            existing.TotalAmount = request.TotalAmount;
            existing.PaymentType = request.PaymentType;
            existing.AmountPaid = request.AmountPaid;

            // Update sale items logic here depending on your requirements,
            // e.g. remove old items, add new ones, update quantities, etc.

            var updated = await _saleRepository.UpdateAsync(existing);

            return new SaleDto
            {
                Id = updated.Id,
                CashierId = updated.CashierId,
                CustomerId = updated.CustomerId,
                SaleDate = updated.SaleDate,
                IsHeld = updated.IsHeld,
                TotalAmount = updated.TotalAmount,
                PaymentType = updated.PaymentType,
                AmountPaid = updated.AmountPaid,
                SaleItems = updated.SaleItems.Select(si => new SaleItemDto
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
