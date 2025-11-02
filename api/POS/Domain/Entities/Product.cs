namespace PosSystem.Domain.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public decimal PriceRetail { get; set; }
        public decimal PriceWholesale { get; set; }
        public int StockQuantity { get; set; }
    }
}
