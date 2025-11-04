namespace POS.Domain.Entities
{
    public class ProductBatch
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public decimal CostPrice { get; set; }
        public decimal ProductPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal WholesalePrice { get; set; }
        public int Quantity { get; set; }
        public int RemainingQuantity { get; set; }
        public DateTime ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime ReceivedDate { get; set; } = DateTime.Now;
        public int? GRNId { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
