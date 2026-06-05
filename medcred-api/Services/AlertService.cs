using Amazon;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Amazon.Runtime;
using MedCred.Api.Data;
using MedCred.Api.Models;

namespace MedCred.Api.Services;

public class AlertService
{
    private readonly IConfiguration _config;
    private readonly ILogger<AlertService> _logger;

    public AlertService(IConfiguration config, ILogger<AlertService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendExpiryAlertAsync(Credential credential, AppDbContext db)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntilExpiry = credential.ExpiryDate.DayNumber - today.DayNumber;
        var staffName = $"{credential.StaffMember.FirstName} {credential.StaffMember.LastName}";
        var credType = credential.CredentialType.Name;
        var orgEmail = credential.StaffMember.Organization.ContactEmail;

        var subject = daysUntilExpiry < 0
            ? $"[MedCred] EXPIRED: {credType} for {staffName}"
            : $"[MedCred] Expiring in {daysUntilExpiry} days: {credType} for {staffName}";

        var body = daysUntilExpiry < 0
            ? $@"<h2>Credential Expired</h2>
                 <p><strong>{staffName}</strong>'s <strong>{credType}</strong> expired on <strong>{credential.ExpiryDate}</strong>.</p>
                 <p>Please take immediate action to renew this credential.</p>
                 <p><a href='https://medcred.app/credentials/{credential.Id}'>View in MedCred</a></p>"
            : $@"<h2>Credential Expiring Soon</h2>
                 <p><strong>{staffName}</strong>'s <strong>{credType}</strong> expires in <strong>{daysUntilExpiry} days</strong> on <strong>{credential.ExpiryDate}</strong>.</p>
                 <p>Please arrange renewal before the expiry date.</p>
                 <p><a href='https://medcred.app/credentials/{credential.Id}'>View in MedCred</a></p>";

        try
        {
            var accessKey = Environment.GetEnvironmentVariable("Aws__AccessKey")
                ?? _config["Aws:AccessKey"];
            var secretKey = Environment.GetEnvironmentVariable("Aws__SecretKey")
                ?? _config["Aws:SecretKey"];
            var region = _config["Aws:Region"] ?? "us-east-1";
            var fromEmail = _config["Aws:SesFromEmail"];

            var credentials = new BasicAWSCredentials(accessKey, secretKey);
            using var client = new AmazonSimpleEmailServiceClient(
                credentials,
                RegionEndpoint.GetBySystemName(region));

            var request = new SendEmailRequest
            {
                Source = fromEmail,
                Destination = new Destination { ToAddresses = new List<string> { orgEmail } },
                Message = new Message
                {
                    Subject = new Content(subject),
                    Body = new Body { Html = new Content(body) }
                }
            };

            await client.SendEmailAsync(request);

            db.AlertLogs.Add(new AlertLog
            {
                CredentialId = credential.Id,
                Channel = "Email",
                SentAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            _logger.LogInformation("Alert sent for credential {Id}", credential.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send alert for credential {Id}", credential.Id);
        }
    }
}