using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.Dashboard
{
    public class GetBestSellersQuery : IRequest<List<BestSellerDto>> { }
}
