namespace PosSystem.Controllers
{
    using MediatR;
    using Microsoft.AspNetCore.Mvc;
    using POS.Application.Commands.Categories;
    using POS.Application.DTOs;
    using POS.Application.Queries.Categories;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CategoryController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET: api/category
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
        {
            var categories = await _mediator.Send(new GetAllCategoriesQuery());
            return Ok(categories);
        }

        // GET: api/category/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetById(int id)
        {
            var category = await _mediator.Send(new GetCategoryByIdQuery { Id = id });
            if (category == null)
                return NotFound();
            return Ok(category);
        }

        // POST: api/category
        [HttpPost]
        public async Task<ActionResult<CategoryDto>> Create(CreateCategoryCommand command)
        {
            var createdCategory = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetById), new { id = createdCategory.Id }, createdCategory);
        }

        // PUT: api/category/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<CategoryDto>> Update(int id, UpdateCategoryCommand command)
        {
            if (id != command.Id)
                return BadRequest("ID mismatch");

            var updatedCategory = await _mediator.Send(command);
            return Ok(updatedCategory);
        }

        // DELETE: api/category/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _mediator.Send(new DeleteCategoryCommand { Id = id });
            return NoContent();
        }
    }

}
