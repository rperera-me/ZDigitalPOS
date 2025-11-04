using POS.Application.DTOs;

namespace PosSystem.Application.DTOs
{
    public class ProductDto
    {
        //public int Id { get; set; }
        //public string Barcode { get; set; } = string.Empty;
        //public string Name { get; set; } = string.Empty;
        //public int CategoryId { get; set; }
        //public string CategoryName { get; set; } = string.Empty;
        //public decimal PriceRetail { get; set; }
        //public decimal PriceWholesale { get; set; }
        //public int StockQuantity { get; set; }

        public int Id { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int? DefaultSupplierId { get; set; } // New
        public string? DefaultSupplierName { get; set; } // New
        public decimal PriceRetail { get; set; }
        public decimal PriceWholesale { get; set; }
        public int StockQuantity { get; set; }
        public bool HasMultipleBatches { get; set; } // New
        public List<ProductBatchDto>? Batches { get; set; } // New
    }
}
