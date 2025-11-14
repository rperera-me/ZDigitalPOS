namespace PosSystem.Domain.Entities
{
    public class SaleItem
    {
        public int Id { get; set; }
        public int SaleId { get; set; }
        public int ProductId { get; set; }
        public int? BatchId { get; set; }
        public string? BatchNumber { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
