using MediatR;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
    {
        private readonly IProductRepository _repository;

        public CreateProductCommandHandler(IProductRepository repository)
        {
            _repository = repository;
        }

        public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            var entity = new Product
            {
                Barcode = request.Barcode,
                Name = request.Name,
                CategoryId = request.CategoryId,
                PriceRetail = request.PriceRetail,
                PriceWholesale = request.PriceWholesale,
                StockQuantity = request.StockQuantity
            };

            var created = await _repository.AddAsync(entity);

            return new ProductDto
            {
                Id = created.Id,
                Barcode = created.Barcode,
                Name = created.Name,
                CategoryId = created.CategoryId,
                PriceRetail = created.PriceRetail,
                PriceWholesale = created.PriceWholesale,
                StockQuantity = created.StockQuantity
            };
        }
    }

}
