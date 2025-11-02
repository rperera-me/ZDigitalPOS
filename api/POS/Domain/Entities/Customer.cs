namespace PosSystem.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public decimal CreditBalance { get; set; }
    }
}
