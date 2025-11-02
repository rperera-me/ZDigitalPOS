using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.Categories
{
    public class UpdateCategoryCommand : IRequest<CategoryDto>
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
