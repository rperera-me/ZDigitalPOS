using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.GRN
{
    public class AddGRNPaymentCommand : IRequest<GRNPaymentDto>
    {
        public int GRNId { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? ChequeNumber { get; set; }
        public DateTime? ChequeDate { get; set; }
        public string? Notes { get; set; }
        public int RecordedBy { get; set; }
    }
}
