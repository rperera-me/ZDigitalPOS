using MediatR;
using POS.Application.Commands.Suppliers;
using POS.Application.DTOs;
using POS.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateSupplierCommandHandler : IRequestHandler<UpdateSupplierCommand, SupplierDto>
    {
        private readonly ISupplierRepository _repository;

        public UpdateSupplierCommandHandler(ISupplierRepository repository)
        {
            _repository = repository;
        }

        public async Task<SupplierDto> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id);
            if (existing == null) throw new KeyNotFoundException("Supplier not found");

            existing.Name = request.Name;
            existing.ContactPerson = request.ContactPerson;
            existing.Phone = request.Phone;
            existing.Email = request.Email;
            existing.Address = request.Address;
            existing.IsActive = request.IsActive;

            var updated = await _repository.UpdateAsync(existing);

            return new SupplierDto
            {
                Id = updated.Id,
                Name = updated.Name,
                ContactPerson = updated.ContactPerson,
                Phone = updated.Phone,
                Email = updated.Email,
                Address = updated.Address,
                IsActive = updated.IsActive
            };
        }
    }
}
