using MediatR;
using POS.Application.Commands.Categories;
using POS.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, CategoryDto>
    {
        private readonly ICategoryRepository _repository;

        public UpdateCategoryCommandHandler(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<CategoryDto> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repository.GetByIdAsync(request.Id);
            if (existing == null) throw new KeyNotFoundException("Category not found");

            existing.Name = request.Name;

            var updated = await _repository.UpdateAsync(existing);

            return new CategoryDto
            {
                Id = updated.Id,
                Name = updated.Name
            };
        }
    }
}
