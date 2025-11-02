using Dapper;
using POS.Application.DTOs;
using PosSystem.Domain.Entities;
using PosSystem.Domain.Repositories;
using PosSystem.Infrastructure.Context;

namespace PosSystem.Infrastructure.Repositories
{
    public class SaleRepository : ISaleRepository
    {
        private readonly DapperContext _context;

        public SaleRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<Sale> AddAsync(Sale sale)
        {
            var sqlSale = @"INSERT INTO Sales (CashierId, CustomerId, SaleDate, IsHeld, TotalAmount, PaymentType, AmountPaid)
                            VALUES (@CashierId, @CustomerId, @SaleDate, @IsHeld, @TotalAmount, @PaymentType, @AmountPaid);
                            SELECT CAST(SCOPE_IDENTITY() as int)";

            using var connection = _context.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                var saleId = await connection.QuerySingleAsync<int>(sqlSale, new
                {
                    sale.CashierId,
                    sale.CustomerId,
                    sale.SaleDate,
                    sale.IsHeld,
                    sale.TotalAmount,
                    sale.PaymentType,
                    sale.AmountPaid
                }, transaction);

                var sqlItems = @"INSERT INTO SaleItems (SaleId, ProductId, Quantity, Price)
                                 VALUES (@SaleId, @ProductId, @Quantity, @Price)";

                foreach (var item in sale.SaleItems)
                {
                    await connection.ExecuteAsync(sqlItems, new
                    {
                        SaleId = saleId,
                        item.ProductId,
                        item.Quantity,
                        item.Price
                    }, transaction);
                }

                transaction.Commit();
                sale.Id = saleId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
            return sale;
        }

        public async Task<Sale> UpdateAsync(Sale sale)
        {
            var sqlSaleUpdate = @"UPDATE Sales SET IsHeld = @IsHeld, TotalAmount = @TotalAmount,
                                  PaymentType = @PaymentType, AmountPaid = @AmountPaid WHERE Id = @Id";

            var sqlDeleteItems = "DELETE FROM SaleItems WHERE SaleId = @SaleId";
            var sqlInsertItem = @"INSERT INTO SaleItems (SaleId, ProductId, Quantity, Price)
                                  VALUES (@SaleId, @ProductId, @Quantity, @Price)";

            using var connection = _context.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                await connection.ExecuteAsync(sqlSaleUpdate, new
                {
                    sale.IsHeld,
                    sale.TotalAmount,
                    sale.PaymentType,
                    sale.AmountPaid,
                    sale.Id
                }, transaction);

                await connection.ExecuteAsync(sqlDeleteItems, new { SaleId = sale.Id }, transaction);

                foreach (var item in sale.SaleItems)
                {
                    await connection.ExecuteAsync(sqlInsertItem, new
                    {
                        SaleId = sale.Id,
                        item.ProductId,
                        item.Quantity,
                        item.Price
                    }, transaction);
                }
                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
            return sale;
        }

        public async Task<Sale?> GetByIdAsync(int id)
        {
            var sqlSale = "SELECT * FROM Sales WHERE Id = @Id";
            var sqlItems = "SELECT * FROM SaleItems WHERE SaleId = @SaleId";

            using var connection = _context.CreateConnection();

            var sale = await connection.QuerySingleOrDefaultAsync<Sale>(sqlSale, new { Id = id });
            if (sale == null) return null;

            var items = await connection.QueryAsync<SaleItem>(sqlItems, new { SaleId = id });
            sale.SaleItems = items.ToList();

            return sale;
        }

        public async Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime start, DateTime end)
        {
            var sqlSale = "SELECT * FROM Sales WHERE SaleDate BETWEEN @Start AND @End";
            var sqlItems = "SELECT * FROM SaleItems WHERE SaleId = @SaleId";

            using var connection = _context.CreateConnection();
            var sales = await connection.QueryAsync<Sale>(sqlSale, new { Start = start, End = end });

            foreach (var sale in sales)
            {
                var items = await connection.QueryAsync<SaleItem>(sqlItems, new { SaleId = sale.Id });
                sale.SaleItems = items.ToList();
            }
            return sales;
        }

        public async Task<IEnumerable<Sale>> GetSalesByCashierAsync(int cashierId)
        {
            var sqlSale = "SELECT * FROM Sales WHERE CashierId = @CashierId";
            var sqlItems = "SELECT * FROM SaleItems WHERE SaleId = @SaleId";

            using var connection = _context.CreateConnection();
            var sales = await connection.QueryAsync<Sale>(sqlSale, new { CashierId = cashierId });

            foreach (var sale in sales)
            {
                var items = await connection.QueryAsync<SaleItem>(sqlItems, new { SaleId = sale.Id });
                sale.SaleItems = items.ToList();
            }
            return sales;
        }

        public async Task<IEnumerable<Sale>> GetHeldSalesAsync()
        {
            var sqlSale = "SELECT * FROM Sales WHERE IsHeld = 1";
            var sqlItems = "SELECT * FROM SaleItems WHERE SaleId = @SaleId";

            using var connection = _context.CreateConnection();
            var sales = await connection.QueryAsync<Sale>(sqlSale);

            foreach (var sale in sales)
            {
                var items = await connection.QueryAsync<SaleItem>(sqlItems, new { SaleId = sale.Id });
                sale.SaleItems = items.ToList();
            }
            return sales;
        }

        public async Task<decimal> GetTodaySalesAsync()
        {
            var sql = "SELECT ISNULL(SUM(TotalAmount), 0) FROM Sales WHERE CAST(SaleDate as DATE) = CAST(GETDATE() as DATE) AND IsHeld = 0";

            using var connection = _context.CreateConnection();
            var result = await connection.ExecuteScalarAsync<decimal>(sql);

            return result;
        }

        public async Task<string> GetLastInvoiceNumberAsync()
        {
            var sql = "SELECT TOP 1 Id FROM Sales ORDER BY Id DESC";

            using var connection = _context.CreateConnection();
            var lastId = await connection.QuerySingleOrDefaultAsync<int?>(sql);

            return lastId.HasValue ? lastId.Value.ToString("D6") : "000000";
        }

        public async Task<List<BestSellerDto>> GetBestSellersAsync()
        {
            var sql = @"
                        SELECT TOP 10 p.Name, SUM(si.Quantity) Qty
                        FROM SaleItems si
                        INNER JOIN Products p ON si.ProductId = p.Id
                        GROUP BY p.Name
                        ORDER BY Qty DESC";

            using var connection = _context.CreateConnection();
            var bestSellers = (await connection.QueryAsync<BestSellerDto>(sql)).ToList();

            return bestSellers;
        }

        public async Task ReleaseHeldSaleAsync(int saleId)
        {
            var sql = @"UPDATE Sales SET IsHeld = 0 WHERE Id = @SaleId AND IsHeld = 1";

            using var connection = _context.CreateConnection();
            await connection.ExecuteAsync(sql, new { SaleId = saleId });
        }
    }
}
