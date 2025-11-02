using Dapper;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace PosSystem.Infrastructure.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly DapperContext _context;

        public CustomerRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<Customer> AddAsync(Customer customer)
        {
            var sql = @"INSERT INTO Customers (Name, Phone, CreditBalance)
                        VALUES (@Name, @Phone, @CreditBalance);
                        SELECT CAST(SCOPE_IDENTITY() as int)";
            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, customer);
            customer.Id = id;
            return customer;
        }

        public async Task DeleteAsync(int id)
        {
            var sql = "DELETE FROM Customers WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<IEnumerable<Customer>> GetAllAsync()
        {
            var sql = "SELECT * FROM Customers";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Customer>(sql);
        }

        public async Task<Customer?> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM Customers WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Customer>(sql, new { Id = id });
        }

        public async Task<Customer> UpdateAsync(Customer customer)
        {
            var sql = @"UPDATE Customers SET Name = @Name, Phone = @Phone, CreditBalance = @CreditBalance
                        WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, customer);
            return customer;
        }
    }
}
