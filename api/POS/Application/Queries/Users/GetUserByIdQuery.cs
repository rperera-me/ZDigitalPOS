using MediatR;
using PosSystem.Application.DTOs;

namespace PosSystem.Application.Queries.Users
{
    public class GetUserByIdQuery : IRequest<UserDto?>
    {
        public int Id { get; set; }
    }
}
