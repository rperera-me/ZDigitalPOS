namespace PosSystem.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? NICNumber { get; set; }
        public string Type { get; set; } = "walk-in"; // walk-in, loyalty, wholesale
        public decimal CreditBalance { get; set; }
        public int LoyaltyPoints { get; set; } = 0;
    }
}
