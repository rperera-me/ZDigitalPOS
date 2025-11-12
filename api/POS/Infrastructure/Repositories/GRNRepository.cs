using Dapper;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace POS.Infrastructure.Repositories
{
    public class GRNRepository : IGRNRepository
    {
        private readonly DapperContext _context;

        public GRNRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<GRN> AddAsync(GRN grn)
        {
            var sqlGRN = @"INSERT INTO GRNs (GRNNumber, SupplierId, ReceivedDate, ReceivedBy, TotalAmount, Notes)
                           VALUES (@GRNNumber, @SupplierId, @ReceivedDate, @ReceivedBy, @TotalAmount, @Notes);
                           SELECT CAST(SCOPE_IDENTITY() as int)";

            var sqlItem = @"INSERT INTO GRNItems 
                            (GRNId, ProductId, BatchNumber, Quantity, CostPrice, ProductPrice, SellingPrice, 
                             WholesalePrice, ManufactureDate, ExpiryDate)
                            VALUES 
                            (@GRNId, @ProductId, @BatchNumber, @Quantity, @CostPrice, @ProductPrice, @SellingPrice, 
                             @WholesalePrice, @ManufactureDate, @ExpiryDate)";

            using var connection = _context.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                var grnId = await connection.QuerySingleAsync<int>(sqlGRN, new
                {
                    grn.GRNNumber,
                    grn.SupplierId,
                    grn.ReceivedDate,
                    grn.ReceivedBy,
                    grn.TotalAmount,
                    grn.Notes
                }, transaction);

                foreach (var item in grn.Items)
                {
                    await connection.ExecuteAsync(sqlItem, new
                    {
                        GRNId = grnId,
                        item.ProductId,
                        item.BatchNumber,
                        item.Quantity,
                        item.CostPrice,
                        item.ProductPrice,
                        item.SellingPrice,
                        item.WholesalePrice,
                        item.ManufactureDate,
                        item.ExpiryDate
                    }, transaction);
                }

                transaction.Commit();
                grn.Id = grnId;
                return grn;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<string> GenerateGRNNumberAsync()
        {
            var sql = "SELECT TOP 1 Id FROM GRNs ORDER BY Id DESC";
            using var connection = _context.CreateConnection();
            var lastId = await connection.QuerySingleOrDefaultAsync<int?>(sql);
            var nextId = (lastId ?? 0) + 1;
            return $"GRN{DateTime.Now:yyyyMMdd}{nextId:D4}";
        }

        public async Task<IEnumerable<GRN>> GetAllAsync()
        {
            var sql = "SELECT * FROM GRNs ORDER BY ReceivedDate DESC";
            var sqlItems = "SELECT * FROM GRNItems WHERE GRNId = @GRNId";

            using var connection = _context.CreateConnection();
            var grns = await connection.QueryAsync<GRN>(sql);

            foreach (var grn in grns)
            {
                var items = await connection.QueryAsync<GRNItem>(sqlItems, new { GRNId = grn.Id });
                grn.Items = items.ToList();
            }

            return grns;
        }

        public async Task<GRN?> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM GRNs WHERE Id = @Id";
            var sqlItems = "SELECT * FROM GRNItems WHERE GRNId = @GRNId";

            using var connection = _context.CreateConnection();
            var grn = await connection.QuerySingleOrDefaultAsync<GRN>(sql, new { Id = id });

            if (grn != null)
            {
                var items = await connection.QueryAsync<GRNItem>(sqlItems, new { GRNId = grn.Id });
                grn.Items = items.ToList();
            }

            return grn;
        }

        public async Task<IEnumerable<GRN>> GetBySupplierIdAsync(int supplierId)
        {
            var sql = "SELECT * FROM GRNs WHERE SupplierId = @SupplierId ORDER BY ReceivedDate DESC";
            var sqlItems = "SELECT * FROM GRNItems WHERE GRNId = @GRNId";

            using var connection = _context.CreateConnection();
            var grns = await connection.QueryAsync<GRN>(sql, new { SupplierId = supplierId });

            foreach (var grn in grns)
            {
                var items = await connection.QueryAsync<GRNItem>(sqlItems, new { GRNId = grn.Id });
                grn.Items = items.ToList();
            }

            return grns;
        }
    }
}
