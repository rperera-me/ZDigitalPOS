using PosSystem.Domain.Entities;

namespace PosSystem.Domain.Repositories
{
    public interface ICustomerRepository
    {
        Task<Customer?> GetByIdAsync(int id);
        Task<IEnumerable<Customer>> GetAllAsync();
        Task<Customer> AddAsync(Customer customer);
        Task<Customer> UpdateAsync(Customer customer);
        Task DeleteAsync(int id);
    }
}
