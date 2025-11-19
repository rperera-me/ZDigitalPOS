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
            if (existing == null)
                throw new KeyNotFoundException($"Customer with ID {request.Id} not found");

            // Update fields
            existing.Name = request.Name?.Trim() ?? throw new ArgumentException("Customer name is required");
            existing.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
            existing.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
            existing.NICNumber = string.IsNullOrWhiteSpace(request.NICNumber) ? null : request.NICNumber.Trim();
            existing.Type = request.Type;
            existing.CreditBalance = request.CreditBalance;
            existing.LoyaltyPoints = request.LoyaltyPoints;

            var updated = await _repository.UpdateAsync(existing);

            return new CustomerDto
            {
                Id = updated.Id,
                Name = updated.Name,
                Phone = updated.Phone,
                Address = updated.Address,
                NICNumber = updated.NICNumber,
                Type = updated.Type,
                CreditBalance = updated.CreditBalance,
                LoyaltyPoints = updated.LoyaltyPoints
            };
        }
    }
}