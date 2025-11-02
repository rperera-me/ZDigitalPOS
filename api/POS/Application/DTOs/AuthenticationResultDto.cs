namespace PosSystem.Application.DTOs
{
    public class AuthenticationResultDto
    {
        public bool IsSuccess { get; set; }
        public string Token { get; set; } = string.Empty; // JWT or similar
        public string? ErrorMessage { get; set; }
    }
}
