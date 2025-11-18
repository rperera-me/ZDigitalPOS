using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.GRN
{
    public class UpdateGRNPaymentStatusCommand : IRequest<GRNDto>
    {
        public int GRNId { get; set; }
    }
}
