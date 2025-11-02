using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.Categories
{
    public class CreateCategoryCommand : IRequest<CategoryDto>
    {
        public string Name { get; set; } = string.Empty;
    }
}
