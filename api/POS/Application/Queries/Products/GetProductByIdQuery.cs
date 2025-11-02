using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Queries.Products
{
    public class GetProductByIdQuery : IRequest<ProductDto?>
    {
        public int Id { get; set; }
    }
}
