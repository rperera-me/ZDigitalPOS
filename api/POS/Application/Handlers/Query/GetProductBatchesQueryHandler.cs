using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Products;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetProductBatchesQueryHandler : IRequestHandler<GetProductBatchesQuery, IEnumerable<ProductBatchDto>>
    {
        private readonly IProductBatchRepository _batchRepository;
        private readonly IProductRepository _productRepository;
        private readonly ISupplierRepository _supplierRepository;

        public GetProductBatchesQueryHandler(
            IProductBatchRepository batchRepository,
            IProductRepository productRepository,
            ISupplierRepository supplierRepository)
        {
            _batchRepository = batchRepository;
            _productRepository = productRepository;
            _supplierRepository = supplierRepository;
        }

        public async Task<IEnumerable<ProductBatchDto>> Handle(GetProductBatchesQuery request, CancellationToken cancellationToken)
        {
            var batches = await _batchRepository.GetActiveBatchesByProductIdAsync(request.ProductId);
            var product = await _productRepository.GetByIdAsync(request.ProductId);

            var batchDtos = new List<ProductBatchDto>();

            foreach (var batch in batches)
            {
                var supplier = await _supplierRepository.GetByIdAsync(batch.SupplierId ?? 0);

                batchDtos.Add(new ProductBatchDto
                {
                    Id = batch.Id,
                    ProductId = batch.ProductId,
                    ProductName = product?.Name ?? "",
                    BatchNumber = batch.BatchNumber,
                    SupplierId = batch.SupplierId,
                    SupplierName = supplier?.Name ?? "",
                    CostPrice = batch.CostPrice,
                    ProductPrice = batch.ProductPrice,
                    SellingPrice = batch.SellingPrice,
                    WholesalePrice = batch.WholesalePrice,
                    Quantity = batch.Quantity,
                    RemainingQuantity = batch.RemainingQuantity,
                    ManufactureDate = batch.ManufactureDate,
                    ExpiryDate = batch.ExpiryDate,
                    ReceivedDate = batch.ReceivedDate
                });
            }

            return batchDtos;
        }
    }
}
