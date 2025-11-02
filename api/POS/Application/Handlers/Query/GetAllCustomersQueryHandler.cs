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

            return customers.Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                CreditBalance = c.CreditBalance
            });
        }
    }

}
