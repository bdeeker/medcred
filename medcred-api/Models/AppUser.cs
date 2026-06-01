using Microsoft.AspNetCore.Identity;

namespace MedCred.Api.Models;

public class AppUser : IdentityUser
{
    public Guid OrganizationId { get; set; }
    public string Role { get; set; } = "Staff"; // Admin, Manager, Staff
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
}
