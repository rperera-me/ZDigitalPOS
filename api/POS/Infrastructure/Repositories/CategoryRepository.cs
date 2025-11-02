using Dapper;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace POS.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly DapperContext _context;

        public CategoryRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Category>> GetAllAsync()
        {
            const string sql = "SELECT Id, Name FROM Categories ORDER BY Name";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Category>(sql);
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            const string sql = "SELECT Id, Name FROM Categories WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<Category>(sql, new { Id = id });
        }

        public async Task<Category> AddAsync(Category category)
        {
            const string sql = @"INSERT INTO Categories (Name) VALUES (@Name);
                             SELECT CAST(SCOPE_IDENTITY() as int)";
            using var connection = _context.CreateConnection();
            var id = await connection.ExecuteScalarAsync<int>(sql, new { category.Name });
            category.Id = id;
            return category;
        }

        public async Task<Category> UpdateAsync(Category category)
        {
            const string sql = "UPDATE Categories SET Name = @Name WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { category.Name, category.Id });
            return category;
        }

        public async Task DeleteAsync(int id)
        {
            const string sql = "DELETE FROM Categories WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id });
        }
    }
}
