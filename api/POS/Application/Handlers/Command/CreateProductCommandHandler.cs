using MediatR;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Application.Commands.Products;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
    {
        //private readonly IProductRepository _repository;

        //public CreateProductCommandHandler(IProductRepository repository)
        //{
        //    _repository = repository;
        //}

        //public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        //{
        //    var entity = new Product
        //    {
        //        Barcode = request.Barcode,
        //        Name = request.Name,
        //        CategoryId = request.CategoryId,
        //        PriceRetail = request.PriceRetail,
        //        PriceWholesale = request.PriceWholesale,
        //        StockQuantity = request.StockQuantity
        //    };

        //    var created = await _repository.AddAsync(entity);

        //    return new ProductDto
        //    {
        //        Id = created.Id,
        //        Barcode = created.Barcode,
        //        Name = created.Name,
        //        CategoryId = created.CategoryId,
        //        PriceRetail = created.PriceRetail,
        //        PriceWholesale = created.PriceWholesale,
        //        StockQuantity = created.StockQuantity
        //    };
        //}

        private readonly IProductRepository _productRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ISupplierRepository _supplierRepository;

        public CreateProductCommandHandler(
            IProductRepository productRepository,
            IProductBatchRepository batchRepository,
            ICategoryRepository categoryRepository,
            ISupplierRepository supplierRepository)
        {
            _productRepository = productRepository;
            _batchRepository = batchRepository;
            _categoryRepository = categoryRepository;
            _supplierRepository = supplierRepository;
        }

        public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            var entity = new Product
            {
                Barcode = request.Barcode,
                Name = request.Name,
                CategoryId = request.CategoryId,
                DefaultSupplierId = request.DefaultSupplierId,
                PriceRetail = request.PriceRetail,
                PriceWholesale = request.PriceWholesale,
                StockQuantity = request.StockQuantity,
                HasMultipleBatches = !string.IsNullOrEmpty(request.BatchNumber)
            };

            var created = await _productRepository.AddAsync(entity);

            // If batch information is provided, create initial batch
            if (!string.IsNullOrEmpty(request.BatchNumber) && request.DefaultSupplierId.HasValue)
            {
                var batch = new ProductBatch
                {
                    ProductId = created.Id,
                    BatchNumber = request.BatchNumber,
                    SupplierId = request.DefaultSupplierId.Value,
                    CostPrice = request.CostPrice ?? 0,
                    ProductPrice = request.ProductPrice ?? request.PriceRetail,
                    SellingPrice = request.SellingPrice ?? request.PriceRetail,
                    WholesalePrice = request.PriceWholesale,
                    Quantity = request.StockQuantity,
                    RemainingQuantity = request.StockQuantity,
                    ManufactureDate = request.ManufactureDate ?? DateTime.Now,
                    ExpiryDate = request.ExpiryDate,
                    ReceivedDate = DateTime.Now,
                    IsActive = true
                };

                await _batchRepository.AddAsync(batch);
            }

            // Fetch category and supplier names for DTO
            var category = await _categoryRepository.GetByIdAsync(created.CategoryId);
            var supplier = request.DefaultSupplierId.HasValue
                ? await _supplierRepository.GetByIdAsync(request.DefaultSupplierId.Value)
                : null;

            return new ProductDto
            {
                Id = created.Id,
                Barcode = created.Barcode,
                Name = created.Name,
                CategoryId = created.CategoryId,
                CategoryName = category?.Name ?? "",
                DefaultSupplierId = created.DefaultSupplierId,
                DefaultSupplierName = supplier?.Name,
                PriceRetail = created.PriceRetail,
                PriceWholesale = created.PriceWholesale,
                StockQuantity = created.StockQuantity,
                HasMultipleBatches = created.HasMultipleBatches
            };
        }
    }

}
