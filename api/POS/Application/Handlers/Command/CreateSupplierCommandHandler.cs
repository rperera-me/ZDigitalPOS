using MediatR;
using POS.Application.Commands.Suppliers;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, SupplierDto>
    {
        private readonly ISupplierRepository _repository;

        public CreateSupplierCommandHandler(ISupplierRepository repository)
        {
            _repository = repository;
        }

        public async Task<SupplierDto> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
        {
            var entity = new Supplier
            {
                Name = request.Name,
                ContactPerson = request.ContactPerson,
                Phone = request.Phone,
                Email = request.Email,
                Address = request.Address,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            var created = await _repository.AddAsync(entity);

            return new SupplierDto
            {
                Id = created.Id,
                Name = created.Name,
                ContactPerson = created.ContactPerson,
                Phone = created.Phone,
                Email = created.Email,
                Address = created.Address,
                IsActive = created.IsActive
            };
        }
    }
}
