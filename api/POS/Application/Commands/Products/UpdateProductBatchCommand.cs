using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.Products
{
    public class UpdateProductBatchCommand : IRequest<ProductBatchDto>
    {
        public int Id { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal WholesalePrice { get; set; }
    }
}
