using Dapper;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace POS.Infrastructure.Repositories
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly DapperContext _context;

        public SupplierRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<Supplier> AddAsync(Supplier supplier)
        {
            var sql = @"INSERT INTO Suppliers (Name, ContactPerson, Phone, Email, Address, IsActive, CreatedAt)
                        VALUES (@Name, @ContactPerson, @Phone, @Email, @Address, @IsActive, @CreatedAt);
                        SELECT CAST(SCOPE_IDENTITY() as int)";
            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, supplier);
            supplier.Id = id;
            return supplier;
        }

        public async Task DeleteAsync(int id)
        {
            var sql = "UPDATE Suppliers SET IsActive = 0 WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<IEnumerable<Supplier>> GetAllAsync()
        {
            var sql = "SELECT * FROM Suppliers ORDER BY Name";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Supplier>(sql);
        }

        public async Task<IEnumerable<Supplier>> GetActiveAsync()
        {
            var sql = "SELECT * FROM Suppliers WHERE IsActive = 1 ORDER BY Name";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Supplier>(sql);
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM Suppliers WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Supplier>(sql, new { Id = id });
        }

        public async Task<Supplier> UpdateAsync(Supplier supplier)
        {
            var sql = @"UPDATE Suppliers SET Name = @Name, ContactPerson = @ContactPerson, 
                        Phone = @Phone, Email = @Email, Address = @Address, IsActive = @IsActive 
                        WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, supplier);
            return supplier;
        }
    }
}
