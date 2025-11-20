using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Commands.GRN;
using POS.Application.DTOs;
using POS.Application.Queries.GRN;

namespace POS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GRNController : ControllerBase
    {
        private readonly IMediator _mediator;

        public GRNController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GRNDto>>> GetAll()
        {
            var grns = await _mediator.Send(new GetAllGRNsQuery());
            return Ok(grns);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GRNDto>> GetById(int id)
        {
            var grn = await _mediator.Send(new GetGRNByIdQuery { Id = id });
            if (grn == null) return NotFound();
            return Ok(grn);
        }

        [HttpGet("supplier/{supplierId}")]
        public async Task<ActionResult<IEnumerable<GRNDto>>> GetBySupplier(int supplierId)
        {
            var grns = await _mediator.Send(new GetGRNsBySupplierQuery { SupplierId = supplierId });
            return Ok(grns);
        }

        [HttpGet("{id}/payments")]
        public async Task<ActionResult<IEnumerable<GRNPaymentDto>>> GetPayments(int id)
        {
            var payments = await _mediator.Send(new GetGRNPaymentsQuery { GRNId = id });
            return Ok(payments);
        }

        [HttpPost]
        public async Task<ActionResult<GRNDto>> Create(CreateGRNCommand command)
        {
            var grn = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = grn.Id }, grn);
        }

        [HttpPost("{id}/payment")]
        public async Task<ActionResult<GRNPaymentDto>> AddPayment(int id, AddGRNPaymentCommand command)
        {
            command.GRNId = id;
            var payment = await _mediator.Send(command);
            return Ok(payment);
        }

        [HttpPut("{id}/payment-status")]
        public async Task<ActionResult<GRNDto>> UpdatePaymentStatus(int id)
        {
            var result = await _mediator.Send(new UpdateGRNPaymentStatusCommand { GRNId = id });
            return Ok(result);
        }
    }
}
