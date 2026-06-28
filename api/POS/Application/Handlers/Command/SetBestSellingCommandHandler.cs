using MediatR;
using PosSystem.Application.Commands.Products;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class SetBestSellingCommandHandler : IRequestHandler<SetBestSellingCommand>
    {
        private readonly IProductRepository _productRepository;

        public SetBestSellingCommandHandler(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task Handle(SetBestSellingCommand request, CancellationToken cancellationToken)
        {
            var product = await _productRepository.GetByIdAsync(request.Id);
            if (product == null) throw new KeyNotFoundException("Product not found");

            await _productRepository.SetBestSellingAsync(request.Id, request.IsBestSelling);
        }
    }
}
