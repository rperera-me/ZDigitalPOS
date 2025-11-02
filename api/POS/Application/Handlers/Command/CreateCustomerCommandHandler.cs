namespace POS.Application.Handlers.Command
{
    using MediatR;
    using PosSystem.Application.Commands.Customers;
    using PosSystem.Application.DTOs;
    using PosSystem.Domain.Entities;
    using PosSystem.Domain.Repositories;
    using System.Threading;
    using System.Threading.Tasks;

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
                CreditBalance = request.CreditBalance
            };

            var created = await _repository.AddAsync(entity);

            return new CustomerDto
            {
                Id = created.Id,
                Name = created.Name,
                Phone = created.Phone,
                CreditBalance = created.CreditBalance
            };
        }
    }

}
