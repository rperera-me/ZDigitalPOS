namespace PosSystem.Domain.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public decimal StockQuantity { get; set; }
        public bool HasMultipleProductPrices { get; set; } = false;
        public bool IsBestSelling { get; set; } = false;
        public string MeasureType { get; set; } = "Unit";
    }
}
