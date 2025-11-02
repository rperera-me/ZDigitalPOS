using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Queries.Products
{
    public class GetAllProductsQuery : IRequest<IEnumerable<ProductDto>>
    {
    }
}
