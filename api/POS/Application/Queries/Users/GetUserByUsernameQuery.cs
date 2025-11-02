using MediatR;

using PosSystem.Application.DTOs;
namespace PosSystem.Application.Queries.Users
{
    public class GetUserByUsernameQuery : IRequest<UserDto?>
    {
        public string Username { get; set; } = string.Empty;
    }
}
