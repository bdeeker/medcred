namespace MedCred.Api.Models;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StaffMember> StaffMembers { get; set; } = new List<StaffMember>();
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
