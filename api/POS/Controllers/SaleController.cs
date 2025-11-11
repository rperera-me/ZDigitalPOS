using MediatR;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Commands.Sales;
using POS.Application.DTOs;
using PosSystem.Application.Commands.Sales;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Sales;
using PosSystem.Domain.Repositories;

namespace PosSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SaleController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ISaleRepository _saleRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IProductRepository _productRepository;

        public SaleController(
            IMediator mediator,
            ISaleRepository saleRepository,
            ICustomerRepository customerRepository,
            IProductRepository productRepository)
        {
            _mediator = mediator;
            _saleRepository = saleRepository;
            _customerRepository = customerRepository;
            _productRepository = productRepository;
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

        [HttpGet("last")]
        public async Task<ActionResult<SaleDto>> GetLastSale()
        {
            // Get the most recent completed sale
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);
            var sales = await _saleRepository.GetSalesByDateRangeAsync(today.AddDays(-7), tomorrow);
            var lastSale = sales.Where(s => !s.IsHeld).OrderByDescending(s => s.SaleDate).FirstOrDefault();

            if (lastSale == null)
                return NotFound(new { message = "No sales found" });

            // Get customer details if exists
            CustomerDto? customerDto = null;
            if (lastSale.CustomerId.HasValue)
            {
                var customer = await _customerRepository.GetByIdAsync(lastSale.CustomerId.Value);
                if (customer != null)
                {
                    customerDto = new CustomerDto
                    {
                        Id = customer.Id,
                        Name = customer.Name,
                        Phone = customer.Phone,
                        Type = customer.Type,
                        CreditBalance = customer.CreditBalance,
                        LoyaltyPoints = customer.LoyaltyPoints
                    };
                }
            }

            // Get product names for sale items
            var productIds = lastSale.SaleItems.Select(si => si.ProductId).Distinct();
            var products = await _productRepository.GetByIdsAsync(productIds);
            var productDict = products.ToDictionary(p => p.Id, p => p.Name);

            var saleDto = new SaleDto
            {
                Id = lastSale.Id,
                CashierId = lastSale.CashierId,
                CustomerId = lastSale.CustomerId,
                Customer = customerDto,
                SaleDate = lastSale.SaleDate,
                IsHeld = lastSale.IsHeld,
                TotalAmount = lastSale.TotalAmount,
                DiscountType = lastSale.DiscountType,
                DiscountValue = lastSale.DiscountValue,
                DiscountAmount = lastSale.DiscountAmount,
                FinalAmount = lastSale.FinalAmount ?? lastSale.TotalAmount,
                PaymentType = lastSale.PaymentType,
                AmountPaid = lastSale.AmountPaid,
                Change = lastSale.Change,
                SaleItems = lastSale.SaleItems.Select(si => new SaleItemDto
                {
                    Id = si.Id,
                    ProductId = si.ProductId,
                    ProductName = productDict.ContainsKey(si.ProductId) ? productDict[si.ProductId] : "Unknown",
                    BatchId = si.BatchId,
                    BatchNumber = si.BatchNumber,
                    Quantity = si.Quantity,
                    Price = si.Price
                }).ToList(),
                Payments = lastSale.Payments.Select(p => new PaymentDto
                {
                    Id = p.Id,
                    Type = p.Type,
                    Amount = p.Amount,
                    CardLastFour = p.CardLastFour
                }).ToList()
            };

            return Ok(saleDto);
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
