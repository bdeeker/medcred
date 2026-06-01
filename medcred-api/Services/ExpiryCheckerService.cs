using Microsoft.EntityFrameworkCore;
using MedCred.Api.Data;
using MedCred.Api.Models;

namespace MedCred.Api.Services;

public class ExpiryCheckerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpiryCheckerService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

    public ExpiryCheckerService(
        IServiceScopeFactory scopeFactory,
        ILogger<ExpiryCheckerService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Expiry Checker Service started.");

        // Run immediately on startup then every 24 hours
        while (!stoppingToken.IsCancellationRequested)
        {
            await RunCheckAsync();
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task RunCheckAsync()
    {
        _logger.LogInformation("Running credential expiry check at {Time}", DateTime.UtcNow);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var alertService = scope.ServiceProvider.GetRequiredService<AlertService>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var credentials = await db.Credentials
            .Include(c => c.CredentialType)
            .Include(c => c.StaffMember)
                .ThenInclude(s => s.Organization)
            .ToListAsync();

        int updated = 0;
        var toAlert = new List<Credential>();

        foreach (var credential in credentials)
        {
            var daysUntilExpiry = credential.ExpiryDate.DayNumber - today.DayNumber;
            var newStatus = daysUntilExpiry < 0 ? "Expired"
                : daysUntilExpiry <= credential.CredentialType.WarnDaysAhead ? "Expiring"
                : "Active";

            if (credential.Status != newStatus)
            {
                credential.Status = newStatus;
                updated++;
            }

            // Alert if expiring and not alerted in last 7 days
            if (newStatus == "Expiring" || newStatus == "Expired")
            {
                var recentAlert = await db.AlertLogs
                    .AnyAsync(a =>
                        a.CredentialId == credential.Id &&
                        a.SentAt >= DateTime.UtcNow.AddDays(-7));

                if (!recentAlert)
                    toAlert.Add(credential);
            }
        }

        await db.SaveChangesAsync();
        _logger.LogInformation("Updated {Count} credential statuses.", updated);

        // Send alerts
        foreach (var credential in toAlert)
        {
            await alertService.SendExpiryAlertAsync(credential, db);
        }

        _logger.LogInformation("Expiry check complete. Alerts sent: {Count}", toAlert.Count);
    }
}
