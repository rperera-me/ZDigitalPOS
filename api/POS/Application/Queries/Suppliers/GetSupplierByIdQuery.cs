using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Suppliers
{
    public class GetSupplierByIdQuery : IRequest<SupplierDto?>
    {
        public int Id { get; set; }
    }
}
