using MediatR;
using Microsoft.AspNetCore.Mvc;
using PosSystem.Application.Commands.Users;
using PosSystem.Application.DTOs;

namespace PosSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthenticationResultDto>> Login(AuthenticateUserCommand command)
        {
            var result = await _mediator.Send(command);
            if (!result.IsSuccess)
            {
                return Unauthorized(new { message = result.ErrorMessage });
            }
            return Ok(result);
        }
    }
}
