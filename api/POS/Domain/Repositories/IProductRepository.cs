using PosSystem.Domain.Entities;

namespace PosSystem.Domain.Repositories
{
    public interface IProductRepository
    {
        Task<Product?> GetByIdAsync(int id);
        Task<Product?> GetByBarcodeAsync(string barcode);
        Task<IEnumerable<Product>> GetByCategoryIdAsync(int categoryId);
        Task<IEnumerable<Product>> GetAllAsync();
        Task<Product> AddAsync(Product product);
        Task<Product> UpdateAsync(Product product);
        Task DeleteAsync(int id);
        Task<IEnumerable<Product>> GetByIdsAsync(IEnumerable<int> productIds);
    }
}
