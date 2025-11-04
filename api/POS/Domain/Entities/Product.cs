namespace PosSystem.Domain.Entities
{
    public class Product
    {
        //public int Id { get; set; }
        //public string Barcode { get; set; } = string.Empty;
        //public string Name { get; set; } = string.Empty;
        //public int CategoryId { get; set; }
        //public decimal PriceRetail { get; set; }
        //public decimal PriceWholesale { get; set; }
        //public int StockQuantity { get; set; }

        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public int? DefaultSupplierId { get; set; } // New field

        // Keep legacy prices for backward compatibility
        public decimal PriceRetail { get; set; }
        public decimal PriceWholesale { get; set; }
        public int StockQuantity { get; set; }

        // New: Multi-batch support
        public bool HasMultipleBatches { get; set; } = false;
    }
}
