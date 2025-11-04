using MediatR;
using POS.Application.DTOs;

namespace POS.Application.Commands.GRN
{
    public class CreateGRNCommand : IRequest<GRNDto>
    {
        public int SupplierId { get; set; }
        public int ReceivedBy { get; set; }
        public string? Notes { get; set; }
        public List<GRNItemDto> Items { get; set; } = new List<GRNItemDto>();
    }
}
