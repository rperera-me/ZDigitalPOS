using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Products
{
    public class UpdateProductCommand : IRequest<ProductDto>
    {
        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public decimal StockQuantity { get; set; }
        public bool IsBestSelling { get; set; }
        public string MeasureType { get; set; } = "Unit";
    }
}
