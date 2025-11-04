using MediatR;
using POS.Application.Commands.Suppliers;
using POS.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class DeleteSupplierCommandHandler : IRequestHandler<DeleteSupplierCommand>
    {
        private readonly ISupplierRepository _repository;

        public DeleteSupplierCommandHandler(ISupplierRepository repository)
        {
            _repository = repository;
        }

        public async Task Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
        {
            await _repository.DeleteAsync(request.Id);
        }
    }
}
