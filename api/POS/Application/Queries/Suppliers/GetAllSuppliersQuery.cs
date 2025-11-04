using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Suppliers
{
    public class GetAllSuppliersQuery : IRequest<IEnumerable<SupplierDto>>
    {
    }
}
