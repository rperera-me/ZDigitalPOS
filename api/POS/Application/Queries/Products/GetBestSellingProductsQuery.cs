using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Queries.Products
{
    public class GetBestSellingProductsQuery : IRequest<IEnumerable<ProductDto>>
    {
    }
}
