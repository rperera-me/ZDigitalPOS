using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Suppliers;
using POS.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetAllSuppliersQueryHandler : IRequestHandler<GetAllSuppliersQuery, IEnumerable<SupplierDto>>
    {
        private readonly ISupplierRepository _repository;

        public GetAllSuppliersQueryHandler(ISupplierRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<SupplierDto>> Handle(GetAllSuppliersQuery request, CancellationToken cancellationToken)
        {
            var suppliers = await _repository.GetAllAsync();

            return suppliers.Select(s => new SupplierDto
            {
                Id = s.Id,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Phone = s.Phone,
                Email = s.Email,
                Address = s.Address,
                IsActive = s.IsActive
            });
        }
    }
}
