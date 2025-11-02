using MediatR;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDto>
    {
        private readonly IProductRepository _repository;

        public UpdateProductCommandHandler(IProductRepository repository)
        {
            _repository = repository;
        }

        public async Task<ProductDto> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id);
            if (existing == null) throw new KeyNotFoundException("Product not found");

            existing.Barcode = request.Barcode;
            existing.Name = request.Name;
            existing.CategoryId = request.CategoryId;
            existing.PriceRetail = request.PriceRetail;
            existing.PriceWholesale = request.PriceWholesale;
            existing.StockQuantity = request.StockQuantity;

            var updated = await _repository.UpdateAsync(existing);

            return new ProductDto
            {
                Id = updated.Id,
                Barcode = updated.Barcode,
                Name = updated.Name,
                CategoryId = updated.CategoryId,
                PriceRetail = updated.PriceRetail,
                PriceWholesale = updated.PriceWholesale,
                StockQuantity = updated.StockQuantity
            };
        }
    }

}
