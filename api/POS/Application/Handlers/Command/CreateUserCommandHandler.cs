namespace POS.Application.Handlers.Command
{
    using MediatR;
    using PosSystem.Application.Commands.Users;
    using PosSystem.Application.DTOs;
    using PosSystem.Domain.Entities;
    using PosSystem.Domain.Repositories;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;

    public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserDto>
    {
        private readonly IUserRepository _userRepository;

        public CreateUserCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            // Here you would hash password, validate input, map to entity, etc.
            var userEntity = new User
            {
                Username = request.Username,
                PasswordHash = HashPassword(request.Password), // implement securely
                Role = request.Role
            };

            var createdUser = await _userRepository.AddAsync(userEntity);

            // Map to DTO and return
            return new UserDto
            {
                Id = createdUser.Id,
                Username = createdUser.Username,
                Role = createdUser.Role
            };
        }

        private string HashPassword(string password, int iterations = 10000)
        {
            if (string.IsNullOrEmpty(password))
                throw new ArgumentException("Password cannot be null or empty.", nameof(password));

            // Generate a 16-byte salt using a secure PRNG
            byte[] salt = RandomNumberGenerator.GetBytes(16);

            // Derive a 32-byte subkey (hash) using PBKDF2-SHA256
            using (var deriveBytes = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256))
            {
                byte[] subKey = deriveBytes.GetBytes(32);

                // Format: {iterations}.{salt in base64}.{hash in base64}
                return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(subKey)}";
            }
        }
    }

}
