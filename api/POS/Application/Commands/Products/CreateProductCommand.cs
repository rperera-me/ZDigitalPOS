using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Products
{
    public class CreateProductCommand : IRequest<ProductDto>
    {
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public decimal PriceRetail { get; set; }
        public decimal PriceWholesale { get; set; }
        public int StockQuantity { get; set; }
    }
}
