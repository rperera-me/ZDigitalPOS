using POS.Domain.Entities;

namespace POS.Domain.Repositories
{
    public interface IPaymentRepository
    {
        Task<Payment> AddAsync(Payment payment);
        Task<IEnumerable<Payment>> GetBySaleIdAsync(int saleId);
        Task DeleteBySaleIdAsync(int saleId);
    }
}
