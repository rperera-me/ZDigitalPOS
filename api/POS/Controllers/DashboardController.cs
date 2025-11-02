using MediatR;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Queries.Dashboard;
using POS.Application.Queries.Sales;

namespace POS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DashboardController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _mediator.Send(new GetSalesStatsQuery());
            return Ok(stats);
        }

        [HttpGet("lowstock")]
        public async Task<IActionResult> GetLowStock()
        {
            var items = await _mediator.Send(new GetLowStockQuery());
            return Ok(items);
        }

        [HttpGet("bestsellers")]
        public async Task<IActionResult> GetBestSellers()
        {
            var sellers = await _mediator.Send(new GetBestSellersQuery());
            return Ok(sellers);
        }
    }
}
