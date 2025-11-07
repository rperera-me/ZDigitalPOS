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

            // ✅ Group ONLY by ProductPrice (MRP) - no batch logic
            var priceGroups = batches
                .GroupBy(b => new {
                    ProductPrice = Math.Round(b.ProductPrice, 2),
                    SellingPrice = Math.Round(b.SellingPrice, 2),
                    WholesalePrice = Math.Round(b.WholesalePrice, 2)
                })
                .Select(g => new ProductPriceVariantDto
                {
                    ProductPrice = g.Key.ProductPrice,
                    SellingPrice = g.Key.SellingPrice,
                    WholesalePrice = g.Key.WholesalePrice,
                    TotalStock = g.Sum(b => b.RemainingQuantity),
                    Sources = g.Select(b => new PriceVariantSourceDto
                    {
                        GRNId = b.GRNId,
                        GRNNumber = "",
                        SourceId = b.Id, // Just ID, no batch logic
                        SourceReference = b.BatchNumber, // Optional reference
                        Stock = b.RemainingQuantity,
                        ReceivedDate = b.ReceivedDate
                    }).ToList()
                })
                .OrderBy(pv => pv.ProductPrice)
                .ToList();

            // Populate GRN numbers
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
                        source.GRNNumber = "Initial Stock";
                    }
                }
            }

            return priceGroups;
        }
    }
}
