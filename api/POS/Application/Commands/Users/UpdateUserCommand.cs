using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Commands.Users
{
    public class UpdateUserCommand : IRequest<UserDto>
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string Role { get; set; } = "Cashier";
    }
}
