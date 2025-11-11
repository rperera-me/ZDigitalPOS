namespace POS.Application.Handlers.Query
{
    using MediatR;
    using PosSystem.Application.DTOs;
    using PosSystem.Application.Queries.Customers;
    using PosSystem.Domain.Repositories;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;

    public class GetAllCustomersQueryHandler : IRequestHandler<GetAllCustomersQuery, IEnumerable<CustomerDto>>
    {
        private readonly ICustomerRepository _repository;

        public GetAllCustomersQueryHandler(ICustomerRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<CustomerDto>> Handle(GetAllCustomersQuery request, CancellationToken cancellationToken)
        {
            var customers = await _repository.GetAllAsync();

            // ✅ UPDATED - Filter out walk-in customers and return full details
            return customers
                .Select(c => new CustomerDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Phone = c.Phone,
                    Address = c.Address,
                    NICNumber = c.NICNumber,
                    Type = c.Type,
                    CreditBalance = c.CreditBalance,
                    LoyaltyPoints = c.LoyaltyPoints
                });
        }
    }
}
