using MediatR;
using POS.Application.Commands.GRN;
using POS.Application.DTOs;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Command
{
    public class AddGRNPaymentCommandHandler : IRequestHandler<AddGRNPaymentCommand, GRNPaymentDto>
    {
        private readonly IGRNPaymentRepository _paymentRepository;
        private readonly IGRNRepository _grnRepository;
        private readonly IUserRepository _userRepository;

        public AddGRNPaymentCommandHandler(
            IGRNPaymentRepository paymentRepository,
            IGRNRepository grnRepository,
            IUserRepository userRepository)
        {
            _paymentRepository = paymentRepository;
            _grnRepository = grnRepository;
            _userRepository = userRepository;
        }

        public async Task<GRNPaymentDto> Handle(AddGRNPaymentCommand request, CancellationToken cancellationToken)
        {
            // Validate GRN exists
            var grn = await _grnRepository.GetByIdAsync(request.GRNId);
            if (grn == null)
                throw new KeyNotFoundException($"GRN with ID {request.GRNId} not found");

            // Create payment record
            var payment = new GRNPayment
            {
                GRNId = request.GRNId,
                PaymentType = request.PaymentType,
                Amount = request.Amount,
                ChequeNumber = request.ChequeNumber,
                ChequeDate = request.ChequeDate,
                Notes = request.Notes,
                RecordedBy = request.RecordedBy,
                PaymentDate = DateTime.Now
            };

            var created = await _paymentRepository.AddAsync(payment);

            // Calculate new payment status
            var allPayments = await _paymentRepository.GetByGRNIdAsync(request.GRNId);
            var totalPaid = allPayments.Sum(p => p.Amount);
            var creditAmount = grn.TotalAmount - totalPaid;

            string paymentStatus = "unpaid";
            if (totalPaid >= grn.TotalAmount)
                paymentStatus = "paid";
            else if (totalPaid > 0)
                paymentStatus = "partial";

            // Update GRN payment status
            await _grnRepository.UpdatePaymentStatusAsync(
                request.GRNId,
                paymentStatus,
                totalPaid,
                creditAmount > 0 ? creditAmount : 0
            );

            // Get user name
            var user = await _userRepository.GetByIdAsync(created.RecordedBy);

            return new GRNPaymentDto
            {
                Id = created.Id,
                GRNId = created.GRNId,
                PaymentDate = created.PaymentDate,
                PaymentType = created.PaymentType,
                Amount = created.Amount,
                ChequeNumber = created.ChequeNumber,
                ChequeDate = created.ChequeDate,
                Notes = created.Notes,
                RecordedBy = created.RecordedBy,
                RecordedByName = user?.Username ?? ""
            };
        }
    }
}
