namespace PosSystem.Application.DTOs
{
    public class SaleItemDto
    {
        //public int Id { get; set; }
        //public int ProductId { get; set; }
        //public string? ProductName { get; set; }
        //public int Quantity { get; set; }
        //public decimal Price { get; set; }

        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int? BatchId { get; set; } // New
        public string? BatchNumber { get; set; } // New
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
