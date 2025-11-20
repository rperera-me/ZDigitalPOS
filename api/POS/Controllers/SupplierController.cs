using MediatR;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Commands.Suppliers;
using POS.Application.DTOs;
using POS.Application.Queries.Suppliers;
using POS.Domain.Repositories;

namespace POS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupplierController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IGRNRepository _grnRepository;

        public SupplierController(IMediator mediator, IGRNRepository grnRepository)
        {
            _mediator = mediator;
            _grnRepository = grnRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetAll()
        {
            var suppliers = await _mediator.Send(new GetAllSuppliersQuery());
            return Ok(suppliers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierDto>> GetById(int id)
        {
            var supplier = await _mediator.Send(new GetSupplierByIdQuery { Id = id });
            if (supplier == null) return NotFound();
            return Ok(supplier);
        }

        [HttpGet("{id}/details")]
        public async Task<ActionResult<SupplierDetailDto>> GetSupplierDetails(int id)
        {
            var supplier = await _mediator.Send(new GetSupplierByIdQuery { Id = id });
            if (supplier == null) return NotFound();

            var grns = await _grnRepository.GetBySupplierIdAsync(id);

            var totalCredit = grns
                .Where(g => g.PaymentStatus != "paid")
                .Sum(g => g.CreditAmount);

            var lastGRN = grns.OrderByDescending(g => g.ReceivedDate).FirstOrDefault();

            return Ok(new SupplierDetailDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address,
                IsActive = supplier.IsActive,
                TotalCreditAmount = totalCredit,
                LastVisitedDate = lastGRN?.ReceivedDate,
                TotalGRNs = grns.Count(),
                UnpaidGRNs = grns.Count(g => g.PaymentStatus == "unpaid"),
                PartiallyPaidGRNs = grns.Count(g => g.PaymentStatus == "partial")
            });
        }

        [HttpPost]
        public async Task<ActionResult<SupplierDto>> Create(CreateSupplierCommand command)
        {
            var supplier = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SupplierDto>> Update(int id, UpdateSupplierCommand command)
        {
            if (id != command.Id) return BadRequest();
            var updated = await _mediator.Send(command);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _mediator.Send(new DeleteSupplierCommand { Id = id });
            return NoContent();
        }
    }
}
