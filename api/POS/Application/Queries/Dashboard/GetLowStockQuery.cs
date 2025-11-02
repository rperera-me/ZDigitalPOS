using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Dashboard
{
    public class GetLowStockQuery : IRequest<List<LowStockItemDto>> { }
}
