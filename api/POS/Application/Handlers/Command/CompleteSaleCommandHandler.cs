using MediatR;
using PosSystem.Application.Commands.Sales;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CompleteSaleCommandHandler : IRequestHandler<CompleteSaleCommand, SaleDto>
    {
        private readonly ISaleRepository _saleRepository;

        public CompleteSaleCommandHandler(ISaleRepository saleRepository)
        {
            _saleRepository = saleRepository;
        }

        public async Task<SaleDto> Handle(CompleteSaleCommand request, CancellationToken cancellationToken)
        {
            var sale = await _saleRepository.GetByIdAsync(request.SaleId);
            if (sale == null) throw new KeyNotFoundException("Sale not found");

            sale.IsHeld = false;

            var updatedSale = await _saleRepository.UpdateAsync(sale);

            return new SaleDto
            {
                Id = updatedSale.Id,
                CashierId = updatedSale.CashierId,
                CustomerId = updatedSale.CustomerId,
                SaleDate = updatedSale.SaleDate,
                IsHeld = updatedSale.IsHeld,
                TotalAmount = updatedSale.TotalAmount,
                PaymentType = updatedSale.PaymentType,
                AmountPaid = updatedSale.AmountPaid,
                SaleItems = updatedSale.SaleItems.Select(si => new SaleItemDto
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
