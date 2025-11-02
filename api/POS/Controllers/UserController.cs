using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosSystem.Application.Commands.Users;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Users;
using System.Security.Claims;

namespace PosSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IMediator _mediator;
        public UserController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetById(int id)
        {
            var user = await _mediator.Send(new GetUserByIdQuery { Id = id });
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpGet("username/{username}")]
        public async Task<ActionResult<UserDto>> GetByUsername(string username)
        {
            var user = await _mediator.Send(new GetUserByUsernameQuery { Username = username });
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> Create(CreateUserCommand command)
        {
            var user = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> Update(int id, UpdateUserCommand command)
        {
            if (id != command.Id) return BadRequest();
            var updated = await _mediator.Send(command);
            return Ok(updated);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var userId = int.Parse(userIdClaim);
            var user = await _mediator.Send(new GetUserByIdQuery { Id = userId });

            if (user == null) return NotFound();

            return Ok(user);
        }
    }
}
