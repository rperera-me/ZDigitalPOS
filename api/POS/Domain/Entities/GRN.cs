namespace POS.Domain.Entities
{
    public class GRN
    {
        public int Id { get; set; }
        public string GRNNumber { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public DateTime ReceivedDate { get; set; } = DateTime.Now;
        public int ReceivedBy { get; set; } // UserId
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public List<GRNItem> Items { get; set; } = new List<GRNItem>();
    }

    public class GRNItem
    {
        public int Id { get; set; }
        public int GRNId { get; set; }
        public int ProductId { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal CostPrice { get; set; }
        public decimal ProductPrice { get; set; }
        public DateTime? ManufactureDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
