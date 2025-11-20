using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.GRN
{
    public class GetGRNPaymentsQuery : IRequest<IEnumerable<GRNPaymentDto>>
    {
        public int GRNId { get; set; }
    }
}
