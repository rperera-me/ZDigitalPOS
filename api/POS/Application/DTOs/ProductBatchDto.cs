namespace POS.Application.DTOs
{
    public class ProductBatchDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public int? SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public decimal CostPrice { get; set; }
        public decimal ProductPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal WholesalePrice { get; set; }
        public int Quantity { get; set; }
        public int RemainingQuantity { get; set; }
        public DateTime? ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime ReceivedDate { get; set; }
    }
}
