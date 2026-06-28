namespace PosSystem.Application.DTOs
{
    public class SaleItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int? BatchId { get; set; }
        public string? BatchNumber { get; set; }
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal? RegularPrice { get; set; }
    }
}
