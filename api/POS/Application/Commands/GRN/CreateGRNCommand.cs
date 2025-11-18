using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.GRN
{
    public class CreateGRNCommand : IRequest<GRNDto>
    {
        public int SupplierId { get; set; }
        public int ReceivedBy { get; set; }
        public string? Notes { get; set; }
        public string PaymentStatus { get; set; } = "unpaid";
        public decimal PaidAmount { get; set; }
        public string? PaymentType { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string? ChequeNumber { get; set; }
        public DateTime? ChequeDate { get; set; }
        public string? PaymentNotes { get; set; }

        public List<GRNItemDto> Items { get; set; } = new List<GRNItemDto>();
    }
}
