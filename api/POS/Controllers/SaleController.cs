using MediatR;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Commands.Sales;
using PosSystem.Application.Commands.Sales;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Entities;

namespace PosSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SaleController : ControllerBase
    {
        private readonly IMediator _mediator;
        public SaleController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SaleDto>> GetById(int id)
        {
            var sale = await _mediator.Send(new GetSaleByIdQuery { Id = id });
            if (sale == null) return NotFound();
            return Ok(sale);
        }

        [HttpGet("daterange")]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetByDateRange([FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            var sales = await _mediator.Send(new GetSalesByDateRangeQuery { StartDate = start, EndDate = end });
            return Ok(sales);
        }

        [HttpGet("cashier/{cashierId}")]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetByCashier(int cashierId)
        {
            var sales = await _mediator.Send(new GetSalesByCashierQuery { CashierId = cashierId });
            return Ok(sales);
        }

        [HttpGet("held")]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetHeldSales()
        {
            var heldSales = await _mediator.Send(new GetHeldSalesQuery());
            return Ok(heldSales);
        }

        [HttpPost]
        public async Task<ActionResult<SaleDto>> Create(CreateSaleCommand command)
        {
            var sale = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SaleDto>> Update(int id, UpdateSaleCommand command)
        {
            if (id != command.Id) return BadRequest();
            var updated = await _mediator.Send(command);
            return Ok(updated);
        }

        [HttpPost("{id}/hold")]
        public async Task<IActionResult> HoldSale(int id)
        {
            await _mediator.Send(new HoldSaleCommand { SaleId = id });
            return NoContent();
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteSale(int id)
        {
            await _mediator.Send(new CompleteSaleCommand { SaleId = id });
            return NoContent();
        }

        [HttpDelete("held/{saleId}")]
        public async Task<IActionResult> DeleteHeldSale(int saleId)
        {
            await _mediator.Send(new DeleteHeldSaleCommand { SaleId = saleId });
            return NoContent();
        }
    }
}
