using POS.Application.DTOs;

namespace PosSystem.Application.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public bool HasMultipleProductPrices { get; set; }
        public List<ProductBatchDto>? Batches { get; set; }
    }

    public class ProductPriceVariantDto
    {
        public decimal ProductPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal WholesalePrice { get; set; }
        public int TotalStock { get; set; }
        public List<PriceVariantSourceDto> Sources { get; set; } = new List<PriceVariantSourceDto>();
    }

    public class PriceVariantSourceDto
    {
        public int? GRNId { get; set; }
        public string GRNNumber { get; set; } = string.Empty;
        public int SourceId { get; set; }
        public string? SourceReference { get; set; }
        public int Stock { get; set; }
        public DateTime ReceivedDate { get; set; }
    }
}
