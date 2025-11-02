using MediatR;
using Microsoft.IdentityModel.Tokens;
using PosSystem.Application.Commands.Users;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace POS.Application.Handlers.Command
{
    public class AuthenticateUserCommandHandler : IRequestHandler<AuthenticateUserCommand, AuthenticationResultDto>
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthenticateUserCommandHandler(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthenticationResultDto> Handle(AuthenticateUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByUsernameAsync(request.Username);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return new AuthenticationResultDto { IsSuccess = false, ErrorMessage = "Invalid credentials" };
            }

            // Generate JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            }),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpireMinutes"])),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return new AuthenticationResultDto
            {
                IsSuccess = true,
                Token = tokenString,
                // other user details can be sent here as needed
            };
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(storedHash))
                return false;

            // storedHash format: {iterations}.{salt}.{hash} (all base64 strings)
            var parts = storedHash.Split('.');
            if (parts.Length != 3)
                return false;

            int iterations = int.Parse(parts[0]);
            byte[] salt = Convert.FromBase64String(parts[1]);
            byte[] storedSubKey = Convert.FromBase64String(parts[2]);

            using (var deriveBytes = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256))
            {
                byte[] generatedSubKey = deriveBytes.GetBytes(storedSubKey.Length);
                return CryptographicOperations.FixedTimeEquals(generatedSubKey, storedSubKey);
            }
        }
    }
}
