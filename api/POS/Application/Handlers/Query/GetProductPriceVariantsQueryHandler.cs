using MediatR;
using POS.Application.Queries.Products;
using POS.Domain.Repositories;
using PosSystem.Application.DTOs;

namespace POS.Application.Handlers.Query
{
    public class GetProductPriceVariantsQueryHandler : IRequestHandler<GetProductPriceVariantsQuery, List<ProductPriceVariantDto>>
    {
        private readonly IProductBatchRepository _batchRepository;
        private readonly IGRNRepository _grnRepository;

        public GetProductPriceVariantsQueryHandler(
            IProductBatchRepository batchRepository,
            IGRNRepository grnRepository)
        {
            _batchRepository = batchRepository;
            _grnRepository = grnRepository;
        }

        public async Task<List<ProductPriceVariantDto>> Handle(GetProductPriceVariantsQuery request, CancellationToken cancellationToken)
        {
            var batches = await _batchRepository.GetActiveBatchesByProductIdAsync(request.ProductId);

            // Group by ProductPrice (the price printed on product)
            var priceGroups = batches
                .GroupBy(b => new { b.ProductPrice, b.SellingPrice, b.WholesalePrice })
                .Select(g => new ProductPriceVariantDto
                {
                    ProductPrice = g.Key.ProductPrice,
                    SellingPrice = g.Key.SellingPrice,
                    WholesalePrice = g.Key.WholesalePrice,
                    TotalStock = g.Sum(b => b.RemainingQuantity),
                    Sources = g.Select(b => new PriceVariantSourceDto
                    {
                        GRNId = b.GRNId, // Can be null for initial stock
                        GRNNumber = "", // Will be populated below
                        BatchId = b.Id, // ✅ ADDED - Include batch ID
                        BatchNumber = b.BatchNumber,
                        Stock = b.RemainingQuantity,
                        ReceivedDate = b.ReceivedDate
                    }).ToList()
                })
                .OrderBy(pv => pv.ProductPrice)
                .ToList();

            // Populate GRN numbers (only for batches that have GRN)
            foreach (var variant in priceGroups)
            {
                foreach (var source in variant.Sources)
                {
                    if (source.GRNId.HasValue && source.GRNId.Value > 0)
                    {
                        var grn = await _grnRepository.GetByIdAsync(source.GRNId.Value);
                        source.GRNNumber = grn?.GRNNumber ?? "";
                    }
                    else
                    {
                        source.GRNNumber = "Initial Stock"; // ✅ Label for initial inventory
                    }
                }
            }

            return priceGroups;
        }
    }
}
