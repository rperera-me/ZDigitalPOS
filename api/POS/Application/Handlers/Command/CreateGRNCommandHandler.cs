using MediatR;
using POS.Application.Commands.GRN;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class CreateGRNCommandHandler : IRequestHandler<CreateGRNCommand, GRNDto>
    {
        private readonly IGRNRepository _grnRepository;
        private readonly IProductBatchRepository _batchRepository;
        private readonly IProductRepository _productRepository;
        private readonly IGRNPaymentRepository _grnPaymentRepository;

        public CreateGRNCommandHandler(
            IGRNRepository grnRepository,
            IProductBatchRepository batchRepository,
            IProductRepository productRepository,
            IGRNPaymentRepository grnPaymentRepository)
        {
            _grnRepository = grnRepository;
            _batchRepository = batchRepository;
            _productRepository = productRepository;
            _grnPaymentRepository = grnPaymentRepository;
        }

        public async Task<GRNDto> Handle(CreateGRNCommand request, CancellationToken cancellationToken)
        {
            var grnNumber = await _grnRepository.GenerateGRNNumberAsync();
            var totalAmount = request.Items.Sum(i => i.CostPrice * i.Quantity);

            // ✅ FIXED: Calculate payment status and credit amount
            var paidAmount = request.PaidAmount;
            var creditAmount = totalAmount - paidAmount;

            string paymentStatus = "unpaid";
            if (paidAmount >= totalAmount)
                paymentStatus = "paid";
            else if (paidAmount > 0)
                paymentStatus = "partial";

            var grn = new GRN
            {
                GRNNumber = grnNumber,
                SupplierId = request.SupplierId,
                ReceivedBy = request.ReceivedBy,
                ReceivedDate = DateTime.Now,
                Notes = request.Notes,
                TotalAmount = totalAmount,
                // ✅ ADD THESE FIELDS
                PaymentStatus = paymentStatus,
                PaidAmount = paidAmount,
                CreditAmount = creditAmount > 0 ? creditAmount : 0,
                Items = request.Items.Select(i => new GRNItem
                {
                    ProductId = i.ProductId,
                    BatchNumber = GenerateBatchNumber(grnNumber),
                    Quantity = i.Quantity,
                    CostPrice = i.CostPrice,
                    ProductPrice = i.ProductPrice,
                    ManufactureDate = i.ManufactureDate,
                    ExpiryDate = i.ExpiryDate
                }).ToList()
            };

            var created = await _grnRepository.AddAsync(grn);

            // ✅ Record initial payment if payment was made
            if (request.PaidAmount > 0 && !string.IsNullOrEmpty(request.PaymentType))
            {
                var initialPayment = new GRNPayment
                {
                    GRNId = created.Id,
                    PaymentType = request.PaymentType,
                    Amount = request.PaidAmount,
                    ChequeNumber = request.ChequeNumber,
                    ChequeDate = request.ChequeDate,
                    Notes = request.PaymentNotes,
                    RecordedBy = request.ReceivedBy,
                    PaymentDate = request.PaymentDate ?? DateTime.Now
                };
                await _grnPaymentRepository.AddAsync(initialPayment);
            }

            // Create product batches and check for multiple prices
            foreach (var item in request.Items)
            {
                var batch = new ProductBatch
                {
                    ProductId = item.ProductId,
                    BatchNumber = GenerateBatchNumber(grnNumber),
                    SupplierId = request.SupplierId,
                    CostPrice = item.CostPrice,
                    ProductPrice = item.ProductPrice,
                    SellingPrice = item.ProductPrice,
                    WholesalePrice = item.ProductPrice,
                    Quantity = item.Quantity,
                    RemainingQuantity = item.Quantity,
                    ManufactureDate = item.ManufactureDate ?? DateTime.Now,
                    ExpiryDate = item.ExpiryDate,
                    ReceivedDate = DateTime.Now,
                    GRNId = created.Id,
                    IsActive = true
                };

                await _batchRepository.AddAsync(batch);

                // Update product stock
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity += item.Quantity;

                    // Check for multiple product prices
                    var existingBatches = await _batchRepository.GetActiveBatchesByProductIdAsync(item.ProductId);
                    var distinctPrices = existingBatches
                        .Select(b => Math.Round(b.ProductPrice, 2))
                        .Distinct()
                        .Count();

                    product.HasMultipleProductPrices = distinctPrices > 1;

                    await _productRepository.UpdateAsync(product);
                }
            }

            return new GRNDto
            {
                Id = created.Id,
                GRNNumber = created.GRNNumber,
                SupplierId = created.SupplierId,
                ReceivedDate = created.ReceivedDate,
                ReceivedBy = created.ReceivedBy,
                TotalAmount = created.TotalAmount,
                Notes = created.Notes,
                // ✅ INCLUDE PAYMENT STATUS FIELDS IN RESPONSE
                PaymentStatus = paymentStatus,
                PaidAmount = paidAmount,
                CreditAmount = creditAmount > 0 ? creditAmount : 0,
                Items = created.Items.Select(i => new GRNItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    BatchNumber = i.BatchNumber,
                    Quantity = i.Quantity,
                    CostPrice = i.CostPrice,
                    ProductPrice = i.ProductPrice,
                    ManufactureDate = i.ManufactureDate,
                    ExpiryDate = i.ExpiryDate
                }).ToList()
            };
        }

        private string GenerateBatchNumber(string grnNumber)
        {
            return $"{grnNumber}-{DateTime.Now:HHmmss}";
        }
    }
}