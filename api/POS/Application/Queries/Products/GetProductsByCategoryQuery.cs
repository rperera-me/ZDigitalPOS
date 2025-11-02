using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Queries.Products
{
    public class GetProductsByCategoryQuery : IRequest<IEnumerable<ProductDto>>
    {
        public int CategoryId { get; set; }
    }
}
