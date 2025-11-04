using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.GRN;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetAllGRNsQueryHandler : IRequestHandler<GetAllGRNsQuery, IEnumerable<GRNDto>>
    {
        private readonly IGRNRepository _grnRepository;
        private readonly ISupplierRepository _supplierRepository;
        private readonly IUserRepository _userRepository;
        private readonly IProductRepository _productRepository;

        public GetAllGRNsQueryHandler(
            IGRNRepository grnRepository,
            ISupplierRepository supplierRepository,
            IUserRepository userRepository,
            IProductRepository productRepository)
        {
            _grnRepository = grnRepository;
            _supplierRepository = supplierRepository;
            _userRepository = userRepository;
            _productRepository = productRepository;
        }

        public async Task<IEnumerable<GRNDto>> Handle(GetAllGRNsQuery request, CancellationToken cancellationToken)
        {
            var grns = await _grnRepository.GetAllAsync();
            var grnDtos = new List<GRNDto>();

            foreach (var grn in grns)
            {
                var supplier = await _supplierRepository.GetByIdAsync(grn.SupplierId);
                var user = await _userRepository.GetByIdAsync(grn.ReceivedBy);

                var itemDtos = new List<GRNItemDto>();
                foreach (var item in grn.Items)
                {
                    var product = await _productRepository.GetByIdAsync(item.ProductId);
                    itemDtos.Add(new GRNItemDto
                    {
                        Id = item.Id,
                        ProductId = item.ProductId,
                        ProductName = product?.Name ?? "",
                        BatchNumber = item.BatchNumber,
                        Quantity = item.Quantity,
                        CostPrice = item.CostPrice,
                        SellingPrice = item.SellingPrice,
                        WholesalePrice = item.WholesalePrice,
                        ManufactureDate = item.ManufactureDate,
                        ExpiryDate = item.ExpiryDate
                    });
                }

                grnDtos.Add(new GRNDto
                {
                    Id = grn.Id,
                    GRNNumber = grn.GRNNumber,
                    SupplierId = grn.SupplierId,
                    SupplierName = supplier?.Name ?? "",
                    ReceivedDate = grn.ReceivedDate,
                    ReceivedBy = grn.ReceivedBy,
                    ReceivedByName = user?.Username ?? "",
                    TotalAmount = grn.TotalAmount,
                    Notes = grn.Notes,
                    Items = itemDtos
                });
            }

            return grnDtos;
        }
    }
}
