using MediatR;
using POS.Application.Commands.Categories;
using POS.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, CategoryDto>
    {
        private readonly ICategoryRepository _repository;

        public CreateCategoryCommandHandler(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<CategoryDto> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
        {
            var entity = new Category
            {
                Name = request.Name
            };

            var created = await _repository.AddAsync(entity);

            return new CategoryDto
            {
                Id = created.Id,
                Name = created.Name
            };
        }
    }
}
