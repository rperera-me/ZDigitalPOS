using Dapper;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace PosSystem.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly DapperContext _context;

        public ProductRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<Product> AddAsync(Product product)
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from insert
            var sql = @"INSERT INTO Products 
                        (Barcode, Name, CategoryId, DefaultSupplierId, StockQuantity, HasMultipleProductPrices)
                        VALUES 
                        (@Barcode, @Name, @CategoryId, @DefaultSupplierId, @StockQuantity, @HasMultipleProductPrices);
                        SELECT CAST(SCOPE_IDENTITY() as int)";

            using var connection = _context.CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, product);
            product.Id = id;
            return product;
        }

        public async Task DeleteAsync(int id)
        {
            var sql = "DELETE FROM Products WHERE Id = @Id";
            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id });
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from select
            var sql = @"SELECT Id, Barcode, Name, CategoryId, DefaultSupplierId, 
                        StockQuantity, HasMultipleProductPrices 
                        FROM Products 
                        ORDER BY Name";

            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Product>(sql);
        }

        public async Task<Product?> GetByBarcodeAsync(string barcode)
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from select
            var sql = @"SELECT Id, Barcode, Name, CategoryId, DefaultSupplierId, 
                        StockQuantity, HasMultipleProductPrices 
                        FROM Products 
                        WHERE Barcode = @Barcode";

            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Product>(sql, new { Barcode = barcode });
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from select
            var sql = @"SELECT Id, Barcode, Name, CategoryId, DefaultSupplierId, 
                        StockQuantity, HasMultipleProductPrices 
                        FROM Products 
                        WHERE Id = @Id";

            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Product>(sql, new { Id = id });
        }

        public async Task<IEnumerable<Product>> GetByCategoryIdAsync(int categoryId)
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from select
            var sql = @"SELECT Id, Barcode, Name, CategoryId, DefaultSupplierId, 
                        StockQuantity, HasMultipleProductPrices 
                        FROM Products 
                        WHERE CategoryId = @CategoryId
                        ORDER BY Name";

            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Product>(sql, new { CategoryId = categoryId });
        }

        public async Task<Product> UpdateAsync(Product product)
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from update
            var sql = @"UPDATE Products 
                        SET Barcode = @Barcode, 
                            Name = @Name, 
                            CategoryId = @CategoryId,
                            DefaultSupplierId = @DefaultSupplierId,
                            StockQuantity = @StockQuantity,
                            HasMultipleProductPrices = @HasMultipleProductPrices
                        WHERE Id = @Id";

            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, product);
            return product;
        }

        public async Task<IEnumerable<Product>> GetByIdsAsync(IEnumerable<int> productIds)
        {
            // ✅ REMOVED: PriceRetail and PriceWholesale from select
            var sql = @"SELECT Id, Barcode, Name, CategoryId, DefaultSupplierId, 
                        StockQuantity, HasMultipleProductPrices 
                        FROM Products 
                        WHERE Id IN @Ids";

            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<Product>(sql, new { Ids = productIds });
        }
    }
}
