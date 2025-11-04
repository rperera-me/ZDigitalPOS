using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.GRN
{
    public class GetAllGRNsQuery : IRequest<IEnumerable<GRNDto>>
    {
    }
}
