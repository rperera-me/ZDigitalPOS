using MediatR;
using PosSystem.Application.DTOs;

namespace POS.Application.Queries.Customers
{
    public class GetCustomerPurchaseHistoryQuery : IRequest<IEnumerable<CustomerPurchaseDto>>
    {
        public int CustomerId { get; set; }
    }
}
