using MediatR;
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

        public CreateSaleCommandHandler(ISaleRepository saleRepository, IProductRepository productRepository)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
        }

        public async Task<SaleDto> Handle(CreateSaleCommand request, CancellationToken cancellationToken)
        {
            // Map SaleItems DTOs to entities
            var saleItems = new List<SaleItem>();
            foreach (var itemDto in request.SaleItems)
            {
                // Optional: Validate product stock here
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null) throw new KeyNotFoundException($"Product ID {itemDto.ProductId} not found");

                saleItems.Add(new SaleItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    Price = itemDto.Price
                });
            }

            var sale = new Sale
            {
                CashierId = request.CashierId,
                CustomerId = request.CustomerId,
                SaleDate = DateTime.Now,
                IsHeld = request.IsHeld,
                TotalAmount = request.TotalAmount,
                PaymentType = request.PaymentType,
                AmountPaid = request.AmountPaid,
                SaleItems = saleItems
            };

            var createdSale = await _saleRepository.AddAsync(sale);

            return new SaleDto
            {
                Id = createdSale.Id,
                CashierId = createdSale.CashierId,
                CustomerId = createdSale.CustomerId,
                SaleDate = createdSale.SaleDate,
                IsHeld = createdSale.IsHeld,
                TotalAmount = createdSale.TotalAmount,
                PaymentType = createdSale.PaymentType,
                AmountPaid = createdSale.AmountPaid,
                SaleItems = createdSale.SaleItems.Select(si => new SaleItemDto
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
