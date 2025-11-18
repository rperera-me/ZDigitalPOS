using POS.Domain.Entities;

namespace POS.Domain.Repositories
{
    public interface IProductBatchRepository
    {
        Task<ProductBatch?> GetByIdAsync(int id);
        Task<IEnumerable<ProductBatch>> GetByProductIdAsync(int productId);
        Task<IEnumerable<ProductBatch>> GetActiveBatchesByProductIdAsync(int productId);
        Task<ProductBatch> AddAsync(ProductBatch batch);
        Task<ProductBatch> UpdateAsync(ProductBatch batch);
        Task DeleteAsync(int id);
        Task<ProductBatch> UpdatePricesAsync(ProductBatch batch);
    }
}
