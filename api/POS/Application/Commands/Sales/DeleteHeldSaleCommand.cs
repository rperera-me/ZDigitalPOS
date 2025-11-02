using MediatR;

namespace POS.Application.Commands.Sales
{
    public class DeleteHeldSaleCommand : IRequest
    {
        public int SaleId { get; set; }
    }
}
