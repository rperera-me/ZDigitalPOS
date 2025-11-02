using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Commands.Users
{
    public class CreateUserCommand : IRequest<UserDto>
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Cashier";
    }
}
