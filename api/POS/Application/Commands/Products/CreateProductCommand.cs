using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Products
{
    public class CreateProductCommand : IRequest<ProductDto>
    {
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public decimal StockQuantity { get; set; }
        public string MeasureType { get; set; } = "Unit";
        public decimal? CostPrice { get; set; }
        public decimal? ProductPrice { get; set; }
        public decimal? WholesalePrice { get; set; }
        public decimal? SellingPrice { get; set; }
        public DateTime? ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
