using Dapper;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace POS.Infrastructure.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly DapperContext _context;

        public PaymentRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<Payment> AddAsync(Payment payment)
        {
            var sql = @"INSERT INTO Payments (SaleId, Type, Amount, CardLastFour, CreatedAt)
                        VALUES (@SaleId, @Type, @Amount, @CardLastFour, @CreatedAt);
                        SELECT CAST(SCOPE_IDENTITY() as int)";

            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, payment);
            payment.Id = id;
            return payment;
        }

        public async Task<IEnumerable<Payment>> GetBySaleIdAsync(int saleId)
        {
            var sql = "SELECT * FROM Payments WHERE SaleId = @SaleId";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Payment>(sql, new { SaleId = saleId });
        }

        public async Task DeleteBySaleIdAsync(int saleId)
        {
            var sql = "DELETE FROM Payments WHERE SaleId = @SaleId";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { SaleId = saleId });
        }
    }
}
