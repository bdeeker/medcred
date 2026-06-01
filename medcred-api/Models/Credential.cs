namespace MedCred.Api.Models;

public class Credential
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StaffMemberId { get; set; }
    public Guid CredentialTypeId { get; set; }
    public DateOnly IssuedDate { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Expiring, Expired
    public string? FileUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StaffMember StaffMember { get; set; } = null!;
    public CredentialType CredentialType { get; set; } = null!;
    public ICollection<AlertLog> AlertLogs { get; set; } = new List<AlertLog>();
}
