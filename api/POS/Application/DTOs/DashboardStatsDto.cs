namespace POS.Application.DTOs
{
    public class DashboardStatsDto
    {
        public decimal TodaySale { get; set; }
        public string LastInvoice { get; set; } = string.Empty;
    }
}
