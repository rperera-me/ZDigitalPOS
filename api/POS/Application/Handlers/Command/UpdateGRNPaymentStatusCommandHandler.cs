using MediatR;
using POS.Application.Commands.GRN;
using POS.Application.DTOs;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateGRNPaymentStatusCommandHandler : IRequestHandler<UpdateGRNPaymentStatusCommand, GRNDto>
    {
        private readonly IGRNRepository _grnRepository;
        private readonly IGRNPaymentRepository _paymentRepository;
        private readonly ISupplierRepository _supplierRepository; // ✅ ADD THIS
        private readonly IUserRepository _userRepository; // ✅ ADD THIS
        private readonly IProductRepository _productRepository; // ✅ ADD THIS

        public UpdateGRNPaymentStatusCommandHandler(
            IGRNRepository grnRepository,
            IGRNPaymentRepository paymentRepository,
            ISupplierRepository supplierRepository, // ✅ ADD THIS
            IUserRepository userRepository, // ✅ ADD THIS
            IProductRepository productRepository) // ✅ ADD THIS
        {
            _grnRepository = grnRepository;
            _paymentRepository = paymentRepository;
            _supplierRepository = supplierRepository; // ✅ ADD THIS
            _userRepository = userRepository; // ✅ ADD THIS
            _productRepository = productRepository; // ✅ ADD THIS
        }

        public async Task<GRNDto> Handle(UpdateGRNPaymentStatusCommand request, CancellationToken cancellationToken)
        {
            var grn = await _grnRepository.GetByIdAsync(request.GRNId);
            if (grn == null)
                throw new KeyNotFoundException($"GRN with ID {request.GRNId} not found");

            // Recalculate payment status
            var payments = await _paymentRepository.GetByGRNIdAsync(request.GRNId);
            var totalPaid = payments.Sum(p => p.Amount);
            var creditAmount = grn.TotalAmount - totalPaid;

            string paymentStatus = "unpaid";
            if (totalPaid >= grn.TotalAmount)
                paymentStatus = "paid";
            else if (totalPaid > 0)
                paymentStatus = "partial";

            await _grnRepository.UpdatePaymentStatusAsync(
                request.GRNId,
                paymentStatus,
                totalPaid,
                creditAmount > 0 ? creditAmount : 0
            );

            // ✅ ADD THIS: Fetch complete updated GRN with all related data
            var updatedGRN = await _grnRepository.GetByIdAsync(request.GRNId);

            // ✅ ADD THIS: Get supplier and user names
            var supplier = await _supplierRepository.GetByIdAsync(updatedGRN.SupplierId);
            var user = await _userRepository.GetByIdAsync(updatedGRN.ReceivedBy);

            // ✅ ADD THIS: Map items with product names
            var itemDtos = new List<GRNItemDto>();
            foreach (var item in updatedGRN.Items)
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
                    ProductPrice = item.ProductPrice,
                    ManufactureDate = item.ManufactureDate,
                    ExpiryDate = item.ExpiryDate
                });
            }

            // ✅ RETURN COMPLETE DTO instead of minimal one
            return new GRNDto
            {
                Id = updatedGRN.Id,
                GRNNumber = updatedGRN.GRNNumber,
                SupplierId = updatedGRN.SupplierId,
                SupplierName = supplier?.Name ?? "",
                ReceivedDate = updatedGRN.ReceivedDate,
                ReceivedBy = updatedGRN.ReceivedBy,
                ReceivedByName = user?.Username ?? "",
                TotalAmount = updatedGRN.TotalAmount,
                Notes = updatedGRN.Notes,
                PaymentStatus = paymentStatus,
                PaidAmount = totalPaid,
                CreditAmount = creditAmount > 0 ? creditAmount : 0,
                Items = itemDtos,
                Payments = payments.Select(p => new GRNPaymentDto
                {
                    Id = p.Id,
                    GRNId = p.GRNId,
                    PaymentDate = p.PaymentDate,
                    PaymentType = p.PaymentType,
                    Amount = p.Amount,
                    ChequeNumber = p.ChequeNumber,
                    ChequeDate = p.ChequeDate,
                    Notes = p.Notes,
                    RecordedBy = p.RecordedBy,
                    RecordedByName = user?.Username ?? ""
                }).ToList()
            };
        }
    }
}
