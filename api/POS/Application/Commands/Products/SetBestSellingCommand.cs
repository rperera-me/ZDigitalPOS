using MediatR;

namespace PosSystem.Application.Commands.Products
{
    public class SetBestSellingCommand : IRequest
    {
        public int Id { get; set; }
        public bool IsBestSelling { get; set; }
    }
}
