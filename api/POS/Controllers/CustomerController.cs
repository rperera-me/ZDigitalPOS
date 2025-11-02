using MediatR;
using Microsoft.AspNetCore.Mvc;
using PosSystem.Application.Commands.Customers;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Customers;

namespace PosSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly IMediator _mediator;
        public CustomerController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetById(int id)
        {
            var customer = await _mediator.Send(new GetCustomerByIdQuery { Id = id });
            if (customer == null) return NotFound();
            return Ok(customer);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
        {
            var customers = await _mediator.Send(new GetAllCustomersQuery());
            return Ok(customers);
        }

        [HttpPost]
        public async Task<ActionResult<CustomerDto>> Create(CreateCustomerCommand command)
        {
            var customer = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CustomerDto>> Update(int id, UpdateCustomerCommand command)
        {
            if (id != command.Id) return BadRequest();
            var updated = await _mediator.Send(command);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _mediator.Send(new DeleteCustomerCommand { Id = id });
            return NoContent();
        }
    }
}
