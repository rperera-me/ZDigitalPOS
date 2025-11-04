using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.GRN
{
    public class GetGRNByIdQuery : IRequest<GRNDto?>
    {
        public int Id { get; set; }
    }
}
