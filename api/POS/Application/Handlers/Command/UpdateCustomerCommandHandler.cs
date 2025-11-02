using MediatR;
using PosSystem.Application.Commands.Customers;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, CustomerDto>
    {
        private readonly ICustomerRepository _repository;

        public UpdateCustomerCommandHandler(ICustomerRepository repository)
        {
            _repository = repository;
        }

        public async Task<CustomerDto> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id);
            if (existing == null) throw new KeyNotFoundException("Customer not found");

            existing.Name = request.Name;
            existing.Phone = request.Phone;
            existing.CreditBalance = request.CreditBalance;

            var updated = await _repository.UpdateAsync(existing);

            return new CustomerDto
            {
                Id = updated.Id,
                Name = updated.Name,
                Phone = updated.Phone,
                CreditBalance = updated.CreditBalance
            };
        }
    }

}
