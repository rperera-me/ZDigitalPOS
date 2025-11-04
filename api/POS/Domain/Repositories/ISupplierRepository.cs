using POS.Domain.Entities;

namespace POS.Domain.Repositories
{
    public interface ISupplierRepository
    {
        Task<Supplier?> GetByIdAsync(int id);
        Task<IEnumerable<Supplier>> GetAllAsync();
        Task<IEnumerable<Supplier>> GetActiveAsync();
        Task<Supplier> AddAsync(Supplier supplier);
        Task<Supplier> UpdateAsync(Supplier supplier);
        Task DeleteAsync(int id);
    }
}
