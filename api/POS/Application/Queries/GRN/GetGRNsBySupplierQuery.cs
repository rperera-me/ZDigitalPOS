using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Queries.GRN
{
    public class GetGRNsBySupplierQuery : IRequest<IEnumerable<GRNDto>>
    {
        public int SupplierId { get; set; }
    }
}
