using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Customers
{
    public class UpdateCustomerCommand : IRequest<CustomerDto>
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public decimal CreditBalance { get; set; }
    }
}
