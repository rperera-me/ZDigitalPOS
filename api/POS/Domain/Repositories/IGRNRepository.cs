using POS.Domain.Entities;

namespace POS.Domain.Repositories
{
    public interface IGRNRepository
    {
        Task<GRN?> GetByIdAsync(int id);
        Task<IEnumerable<GRN>> GetAllAsync();
        Task<IEnumerable<GRN>> GetBySupplierIdAsync(int supplierId);
        Task<GRN> AddAsync(GRN grn);
        Task<string> GenerateGRNNumberAsync();
        Task UpdatePaymentStatusAsync(int grnId, string status, decimal paidAmount, decimal creditAmount);
    }

    public interface IGRNPaymentRepository
    {
        Task<GRNPayment> AddAsync(GRNPayment payment);
        Task<IEnumerable<GRNPayment>> GetByGRNIdAsync(int grnId);
        Task<GRNPayment?> GetByIdAsync(int id);
    }
}
