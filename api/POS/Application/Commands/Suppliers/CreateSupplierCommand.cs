using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.Suppliers
{
    public class CreateSupplierCommand : IRequest<SupplierDto>
    {
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
    }
}
