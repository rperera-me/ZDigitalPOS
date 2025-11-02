using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Categories
{
    public class GetAllCategoriesQuery : IRequest<IEnumerable<CategoryDto>>
    {
    }
}
