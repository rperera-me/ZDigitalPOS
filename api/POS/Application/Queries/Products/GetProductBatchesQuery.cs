using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Products
{
    public class GetProductBatchesQuery : IRequest<IEnumerable<ProductBatchDto>>
    {
        public int ProductId { get; set; }
    }
}
