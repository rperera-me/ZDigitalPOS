using POS.Domain.Entities;

namespace POS.Domain.Repositories
{
    public interface IGRNRepository
    {
        Task<GRN?> GetByIdAsync(int id);
        Task<IEnumerable<GRN>> GetAllAsync();
        Task<IEnumerable<GRN>> GetBySupplierIdAsync(int supplierId);
        Task<GRN> AddAsync(GRN grn);
        Task<string> GenerateGRNNumberAsync();
    }
}
