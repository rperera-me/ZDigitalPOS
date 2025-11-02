using Dapper;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace PosSystem.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly DapperContext _context;
        public UserRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<User> AddAsync(User user)
        {
            var sql = @"INSERT INTO Users (Username, PasswordHash, Role)
                        VALUES (@Username, @PasswordHash, @Role);
                        SELECT CAST(SCOPE_IDENTITY() as int)";
            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, user);
            user.Id = id;

            return user;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM Users WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            var sql = "SELECT * FROM Users WHERE Username = @Username";
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Username = username });
        }

        public async Task UpdateAsync(User user)
        {
            var sql = @"UPDATE Users SET Username = @Username, PasswordHash = @PasswordHash, Role = @Role WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, user);
        }
    }
}
