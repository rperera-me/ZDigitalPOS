using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Categories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetAllCategoriesQueryHandler : IRequestHandler<GetAllCategoriesQuery, IEnumerable<CategoryDto>>
    {
        private readonly ICategoryRepository _repository;

        public GetAllCategoriesQueryHandler(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<CategoryDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
        {
            var categories = await _repository.GetAllAsync();

            return categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name
            });
        }
    }
}
