using MediatR;

namespace PosSystem.Application.Commands.Customers
{
    public class DeleteCustomerCommand : IRequest
    {
        public int Id { get; set; }
    }
}
