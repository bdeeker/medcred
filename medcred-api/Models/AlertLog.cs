namespace MedCred.Api.Models;

public class AlertLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CredentialId { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string Channel { get; set; } = "Email"; // Email, SMS

    public Credential Credential { get; set; } = null!;
}
