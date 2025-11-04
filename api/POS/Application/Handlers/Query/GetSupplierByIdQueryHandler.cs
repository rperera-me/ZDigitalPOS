using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Suppliers;
using POS.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetSupplierByIdQueryHandler : IRequestHandler<GetSupplierByIdQuery, SupplierDto?>
    {
        private readonly ISupplierRepository _repository;

        public GetSupplierByIdQueryHandler(ISupplierRepository repository)
        {
            _repository = repository;
        }

        public async Task<SupplierDto?> Handle(GetSupplierByIdQuery request, CancellationToken cancellationToken)
        {
            var supplier = await _repository.GetByIdAsync(request.Id);
            if (supplier == null) return null;

            return new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address,
                IsActive = supplier.IsActive
            };
        }
    }
}
