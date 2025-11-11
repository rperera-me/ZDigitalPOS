using MediatR;
using PosSystem.Application.Commands.Customers;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, CustomerDto>
    {
        private readonly ICustomerRepository _repository;

        public CreateCustomerCommandHandler(ICustomerRepository repository)
        {
            _repository = repository;
        }

        public async Task<CustomerDto> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
        {
            var entity = new Customer
            {
                Name = request.Name,
                Phone = request.Phone,
                Address = request.Address,
                NICNumber = request.NICNumber,
                Type = request.Type,
                CreditBalance = request.CreditBalance,
                LoyaltyPoints = 0,
                CreatedAt = DateTime.Now
            };

            var created = await _repository.AddAsync(entity);

            return new CustomerDto
            {
                Id = created.Id,
                Name = created.Name,
                Phone = created.Phone,
                Address = created.Address,
                NICNumber = created.NICNumber,
                Type = created.Type,
                CreditBalance = created.CreditBalance,
                LoyaltyPoints = created.LoyaltyPoints,
                CreatedAt = created.CreatedAt
            };
        }
    }

}
