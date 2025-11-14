using Dapper;
using POS.Domain.Entities;
using POS.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace POS.Infrastructure.Repositories
{
    public class ProductBatchRepository : IProductBatchRepository
    {
        private readonly DapperContext _context;

        public ProductBatchRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<ProductBatch> AddAsync(ProductBatch batch)
        {
            var sql = @"INSERT INTO ProductBatches 
                        (ProductId, BatchNumber, SupplierId, CostPrice, ProductPrice, SellingPrice, 
                         WholesalePrice, Quantity, RemainingQuantity, ManufactureDate, ExpiryDate, 
                         ReceivedDate, GRNId, IsActive)
                        VALUES 
                        (@ProductId, @BatchNumber, @SupplierId, @CostPrice, @ProductPrice, @SellingPrice, 
                         @WholesalePrice, @Quantity, @RemainingQuantity, @ManufactureDate, @ExpiryDate, 
                         @ReceivedDate, @GRNId, @IsActive);
                        SELECT CAST(SCOPE_IDENTITY() as int)";
            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, batch);
            batch.Id = id;
            return batch;
        }

        public async Task DeleteAsync(int id)
        {
            var sql = "UPDATE ProductBatches SET IsActive = 0 WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<IEnumerable<ProductBatch>> GetActiveBatchesByProductIdAsync(int productId)
        {
            var sql = @"SELECT * FROM ProductBatches 
                        WHERE ProductId = @ProductId AND IsActive = 1 AND RemainingQuantity > 0
                        ORDER BY ReceivedDate DESC";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<ProductBatch>(sql, new { ProductId = productId });
        }

        public async Task<ProductBatch?> GetByIdAsync(int id)
        {
            var sql = "SELECT * FROM ProductBatches WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<ProductBatch>(sql, new { Id = id });
        }

        public async Task<IEnumerable<ProductBatch>> GetByProductIdAsync(int productId)
        {
            var sql = "SELECT * FROM ProductBatches WHERE ProductId = @ProductId ORDER BY ReceivedDate DESC";
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<ProductBatch>(sql, new { ProductId = productId });
        }

        public async Task<ProductBatch> UpdateAsync(ProductBatch batch)
        {
            var sql = @"UPDATE ProductBatches SET 
                        RemainingQuantity = @RemainingQuantity, IsActive = @IsActive 
                        WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, batch);
            return batch;
        }

        public async Task<ProductBatch> UpdatePricesAsync(ProductBatch batch)
        {
            var sql = @"UPDATE ProductBatches SET 
                        SellingPrice = @SellingPrice, WholesalePrice = @WholesalePrice
                        WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, batch);
            return batch;
        }
    }
}
