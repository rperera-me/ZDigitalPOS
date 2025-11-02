using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Queries.Customers
{
    public class GetAllCustomersQuery : IRequest<IEnumerable<CustomerDto>>
    {
    }
}
