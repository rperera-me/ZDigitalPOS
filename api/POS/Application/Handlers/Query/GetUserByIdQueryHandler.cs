using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Users;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDto?>
    {
        private readonly IUserRepository _repository;

        public GetUserByIdQueryHandler(IUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<UserDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByIdAsync(request.Id);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Role = user.Role
            };
        }
    }

}
