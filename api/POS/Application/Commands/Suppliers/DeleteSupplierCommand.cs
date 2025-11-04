using MediatR;

namespace POS.Application.Commands.Suppliers
{
    public class DeleteSupplierCommand : IRequest
    {
        public int Id { get; set; }
    }
}
