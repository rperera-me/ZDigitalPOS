using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Categories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetCategoryByIdQueryHandler : IRequestHandler<GetCategoryByIdQuery, CategoryDto?>
    {
        private readonly ICategoryRepository _repository;

        public GetCategoryByIdQueryHandler(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<CategoryDto?> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
        {
            var category = await _repository.GetByIdAsync(request.Id);

            if (category == null) return null;

            return new CategoryDto
            {
                Id = category.Id,
                Name = category.Name
            };
        }
    }
}
