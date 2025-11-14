using MediatR;

namespace POS.Application.Commands.Sales
{
    public class VoidSaleCommand : IRequest
    {
        public int SaleId { get; set; }
    }
}
