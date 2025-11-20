using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.GRN;
using POS.Domain.Repositories;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetGRNPaymentsQueryHandler : IRequestHandler<GetGRNPaymentsQuery, IEnumerable<GRNPaymentDto>>
    {
        private readonly IGRNPaymentRepository _paymentRepository;
        private readonly IUserRepository _userRepository;

        public GetGRNPaymentsQueryHandler(
            IGRNPaymentRepository paymentRepository,
            IUserRepository userRepository)
        {
            _paymentRepository = paymentRepository;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<GRNPaymentDto>> Handle(GetGRNPaymentsQuery request, CancellationToken cancellationToken)
        {
            var payments = await _paymentRepository.GetByGRNIdAsync(request.GRNId);
            var paymentDtos = new List<GRNPaymentDto>();

            foreach (var payment in payments)
            {
                var user = await _userRepository.GetByIdAsync(payment.RecordedBy);

                paymentDtos.Add(new GRNPaymentDto
                {
                    Id = payment.Id,
                    GRNId = payment.GRNId,
                    PaymentDate = payment.PaymentDate,
                    PaymentType = payment.PaymentType,
                    Amount = payment.Amount,
                    ChequeNumber = payment.ChequeNumber,
                    ChequeDate = payment.ChequeDate,
                    Notes = payment.Notes,
                    RecordedBy = payment.RecordedBy,
                    RecordedByName = user?.Username ?? ""
                });
            }

            return paymentDtos.OrderByDescending(p => p.PaymentDate);
        }
    }
}
