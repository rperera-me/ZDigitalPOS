namespace PosSystem.Domain.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public int? DefaultSupplierId { get; set; }
        public decimal PriceRetail { get; set; }
        public decimal PriceWholesale { get; set; }
        public int StockQuantity { get; set; }
        public bool HasMultipleProductPrices { get; set; } = false;
    }
}
