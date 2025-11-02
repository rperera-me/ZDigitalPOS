using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Queries.Customers
{
    public class GetCustomerByIdQuery : IRequest<CustomerDto?>
    {
        public int Id { get; set; }
    }
}
