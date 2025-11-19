using MediatR;
using POS.Application.DTOs;
using POS.Application.Queries.Customers;
using POS.Domain.Repositories;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;

namespace POS.Application.Handlers.Query
{
    public class GetCustomerPurchaseHistoryQueryHandler
        : IRequestHandler<GetCustomerPurchaseHistoryQuery, IEnumerable<CustomerPurchaseDto>>
    {
        private readonly ISaleRepository _saleRepository;
        private readonly IPaymentRepository _paymentRepository;

        public GetCustomerPurchaseHistoryQueryHandler(
            ISaleRepository saleRepository,
            IPaymentRepository paymentRepository)
        {
            _saleRepository = saleRepository;
            _paymentRepository = paymentRepository;
        }

        public async Task<IEnumerable<CustomerPurchaseDto>> Handle(
            GetCustomerPurchaseHistoryQuery request,
            CancellationToken cancellationToken)
        {
            var sales = await _saleRepository.GetSalesByCustomerAsync(request.CustomerId);

            var purchases = new List<CustomerPurchaseDto>();

            foreach (var sale in sales)
            {
                var payments = await _paymentRepository.GetBySaleIdAsync(sale.Id);

                purchases.Add(new CustomerPurchaseDto
                {
                    SaleId = sale.Id,
                    SaleDate = sale.SaleDate,
                    TotalAmount = sale.TotalAmount,
                    FinalAmount = sale.FinalAmount ?? sale.TotalAmount,
                    PaymentType = sale.PaymentType,
                    Payments = payments.Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        Type = p.Type,
                        Amount = p.Amount,
                        CardLastFour = p.CardLastFour
                    }).ToList(),
                    ItemCount = sale.SaleItems?.Sum(si => si.Quantity) ?? 0,
                    IsVoided = sale.IsVoided
                });
            }

            return purchases.OrderByDescending(p => p.SaleDate);
        }
    }
}
