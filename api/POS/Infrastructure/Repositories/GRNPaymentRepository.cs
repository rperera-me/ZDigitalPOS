using Dapper;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace POS.Infrastructure.Repositories
{
    public class GRNPaymentRepository : IGRNPaymentRepository
    {
        private readonly DapperContext _context;

        public GRNPaymentRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<GRNPayment> AddAsync(GRNPayment payment)
        {
            var sql = @"INSERT INTO GRNPayments 
                        (GRNId, PaymentDate, PaymentType, Amount, ChequeNumber, ChequeDate, Notes, RecordedBy)
                        VALUES 
                        (@GRNId, @PaymentDate, @PaymentType, @Amount, @ChequeNumber, @ChequeDate, @Notes, @RecordedBy);
                        SELECT CAST(SCOPE_IDENTITY() as int)";

            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, payment);
            payment.Id = id;
            return payment;
        }

        public async Task<IEnumerable<GRNPayment>> GetByGRNIdAsync(int grnId)
        {
            var sql = "SELECT * FROM GRNPayments WHERE GRNId = @GRNId ORDER BY PaymentDate DESC";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<GRNPayment>(sql, new { GRNId = grnId });
        }

        public async Task<GRNPayment?> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM GRNPayments WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<GRNPayment>(sql, new { Id = id });
        }
    }
}
