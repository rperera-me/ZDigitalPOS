using PosSystem.Domain.Entities;

namespace PosSystem.Domain.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByUsernameAsync(string username);
        Task<User> AddAsync(User user);
        Task UpdateAsync(User user);
    }
}
