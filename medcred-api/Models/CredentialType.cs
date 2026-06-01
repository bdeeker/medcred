namespace MedCred.Api.Models;

public class CredentialType
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public int WarnDaysAhead { get; set; } = 30;
    public bool IsRequired { get; set; } = true;

    public ICollection<Credential> Credentials { get; set; } = new List<Credential>();
}
