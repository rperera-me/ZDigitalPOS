using MediatR;

namespace PosSystem.Application.DTOs
{
    public class CustomerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? NICNumber { get; set; }
        public string Type { get; set; } = "loyalty"; // loyalty, wholesale
        public decimal CreditBalance { get; set; }
        public int LoyaltyPoints { get; set; } = 0;
    }
}
