using MediatR;
using PosSystem.Application.Commands.Users;
using PosSystem.Application.DTOs;
using PosSystem.Domain.Repositories;
using System.Security.Cryptography;

namespace POS.Application.Handlers.Command
{
    public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, UserDto>
    {
        private readonly IUserRepository _userRepository;

        public UpdateUserCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserDto> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        {
            var existingUser = await _userRepository.GetByIdAsync(request.Id);
            if (existingUser == null)
                throw new KeyNotFoundException("User not found");

            existingUser.Username = request.Username;
            existingUser.Role = request.Role;

            // Only update password if provided
            if (!string.IsNullOrEmpty(request.Password))
            {
                existingUser.PasswordHash = HashPassword(request.Password);
            }

            await _userRepository.UpdateAsync(existingUser);

            return new UserDto
            {
                Id = existingUser.Id,
                Username = existingUser.Username,
                Role = existingUser.Role
            };
        }

        private string HashPassword(string password, int iterations = 10000)
        {
            if (string.IsNullOrEmpty(password))
                throw new ArgumentException("Password cannot be null or empty.", nameof(password));

            byte[] salt = RandomNumberGenerator.GetBytes(16);

            using (var deriveBytes = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256))
            {
                byte[] subKey = deriveBytes.GetBytes(32);
                return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(subKey)}";
            }
        }
    }
}
