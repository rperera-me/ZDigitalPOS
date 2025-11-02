using POS.Application.DTOs;
using PosSystem.Domain.Entities;

namespace PosSystem.Domain.Repositories
{
    public interface ISaleRepository
    {
        Task<Sale?> GetByIdAsync(int id);
        Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime start, DateTime end);
        Task<IEnumerable<Sale>> GetSalesByCashierAsync(int cashierId);
        Task<IEnumerable<Sale>> GetHeldSalesAsync();
        Task<Sale> AddAsync(Sale sale);
        Task<Sale> UpdateAsync(Sale sale);
        Task<decimal> GetTodaySalesAsync();
        Task<string> GetLastInvoiceNumberAsync();
        Task<List<BestSellerDto>> GetBestSellersAsync();
        Task ReleaseHeldSaleAsync(int saleId);
    }
}
