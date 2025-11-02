using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Users
{
    public class AuthenticateUserCommand : IRequest<AuthenticationResultDto>
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
