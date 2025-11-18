using MediatR;
using POS.Application.Commands.GRN;
using POS.Application.DTOs;
using POS.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class UpdateGRNPaymentStatusCommandHandler : IRequestHandler<UpdateGRNPaymentStatusCommand, GRNDto>
    {
        private readonly IGRNRepository _grnRepository;
        private readonly IGRNPaymentRepository _paymentRepository;

        public UpdateGRNPaymentStatusCommandHandler(
            IGRNRepository grnRepository,
            IGRNPaymentRepository paymentRepository)
        {
            _grnRepository = grnRepository;
            _paymentRepository = paymentRepository;
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

            // Fetch updated GRN
            var updatedGRN = await _grnRepository.GetByIdAsync(request.GRNId);

            return new GRNDto
            {
                Id = updatedGRN.Id,
                GRNNumber = updatedGRN.GRNNumber,
                TotalAmount = updatedGRN.TotalAmount,
                PaymentStatus = paymentStatus,
                PaidAmount = totalPaid,
                CreditAmount = creditAmount > 0 ? creditAmount : 0
            };
        }
    }
}
