using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Categories
{
    public class GetCategoryByIdQuery : IRequest<CategoryDto?>
    {
        public int Id { get; set; }
    }
}
