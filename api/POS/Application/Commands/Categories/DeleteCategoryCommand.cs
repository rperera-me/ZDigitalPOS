using MediatR;

namespace POS.Application.Commands.Categories
{
    public class DeleteCategoryCommand : IRequest
    {
        public int Id { get; set; }
    }
}
