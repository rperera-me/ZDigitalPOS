using MediatR;
using PosSystem.Application.DTOs;

namespace POS.Application.Queries.Products
{
    public class GetProductPriceVariantsQuery : IRequest<List<ProductPriceVariantDto>>
    {
        public int ProductId { get; set; }
    }
}
