using MediatR;
using POS.Application.Commands.Sales;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class DeleteHeldSaleCommandHandler : IRequestHandler<DeleteHeldSaleCommand>
    {
        private readonly ISaleRepository _saleRepository;

        public DeleteHeldSaleCommandHandler(ISaleRepository saleRepository)
        {
            _saleRepository = saleRepository;
        }

        public async Task Handle(DeleteHeldSaleCommand request, CancellationToken cancellationToken)
        {
            await _saleRepository.ReleaseHeldSaleAsync(request.SaleId);
        }
    }
}
