using MediatR;
using Microsoft.AspNetCore.Mvc;
using POS.Application.Queries.Products;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.DTOs;
using PosSystem.Application.Queries.Products;

namespace PosSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ProductController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetById(int id)
        {
            var product = await _mediator.Send(new GetProductByIdQuery { Id = id });
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetByCategory(int categoryId)
        {
            var products = await _mediator.Send(new GetProductsByCategoryQuery { CategoryId = categoryId });
            return Ok(products);
        }

        [HttpGet("barcode/{barcode}")]
        public async Task<ActionResult<ProductDto>> GetByBarcode(string barcode)
        {
            var product = await _mediator.Send(new GetProductByBarcodeQuery { Barcode = barcode });
            return Ok(product);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        {
            var products = await _mediator.Send(new GetAllProductsQuery());
            return Ok(products);
        }

        [HttpPost]
        public async Task<ActionResult<ProductDto>> Create(CreateProductCommand command)
        {
            var product = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDto>> Update(int id, UpdateProductCommand command)
        {
            if (id != command.Id) return BadRequest();
            var updated = await _mediator.Send(command);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _mediator.Send(new DeleteProductCommand { Id = id });
            return NoContent();
        }
    }
}
