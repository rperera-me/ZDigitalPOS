using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Customers
{
    public class CreateCustomerCommand : IRequest<CustomerDto>
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? NICNumber { get; set; }
        public string Type { get; set; } = "loyalty";
        public decimal CreditBalance { get; set; }
    }
}
