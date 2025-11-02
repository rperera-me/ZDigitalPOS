using MediatR;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Users;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetUserByUsernameQueryHandler : IRequestHandler<GetUserByUsernameQuery, UserDto?>
    {
        private readonly IUserRepository _repository;

        public GetUserByUsernameQueryHandler(IUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<UserDto?> Handle(GetUserByUsernameQuery request, CancellationToken cancellationToken)
        {
            var user = await _repository.GetByUsernameAsync(request.Username);

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
