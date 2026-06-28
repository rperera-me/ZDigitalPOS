namespace POS.Application.DTOs
{
    public class LowStockItemDto
    {
        public string Barcode { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public decimal Available { get; set; }
    }
}
