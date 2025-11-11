using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Customers;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetCustomerByIdQueryHandler : IRequestHandler<GetCustomerByIdQuery, CustomerDto?>
    {
        private readonly ICustomerRepository _repository;

        public GetCustomerByIdQueryHandler(ICustomerRepository repository)
        {
            _repository = repository;
        }

        public async Task<CustomerDto?> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
        {
            var customer = await _repository.GetByIdAsync(request.Id);

            if (customer == null) return null;

            return new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Phone = customer.Phone,
                Address = customer.Address,
                NICNumber = customer.NICNumber,
                Type = customer.Type,
                CreditBalance = customer.CreditBalance,
                LoyaltyPoints = customer.LoyaltyPoints
            };
        }
    }
}
