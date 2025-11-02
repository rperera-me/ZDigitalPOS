using MediatR;

namespace PosSystem.Application.Commands.Products
{
    public class DeleteProductCommand : IRequest
    {
        public int Id { get; set; }
    }
}
