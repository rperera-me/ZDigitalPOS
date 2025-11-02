using MediatR;
using PosSystem.Application.DTOs;

namespace POS.Application.Queries.Products
{
    public class GetProductByBarcodeQuery: IRequest<ProductDto>
    {
        public string Barcode { get; set; }
    }
}
