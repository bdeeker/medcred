using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedCred.Api.Data;
using System.Security.Claims;

namespace MedCred.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReportController(AppDbContext db) { _db = db; }

    private Guid OrgId => Guid.Parse(User.FindFirstValue("orgId")!);

    [HttpGet("compliance")]
    public async Task<IActionResult> GetCompliance()
    {
        var staff = await _db.StaffMembers
            .Include(s => s.Credentials)
            .Where(s => s.OrganizationId == OrgId && s.IsActive)
            .ToListAsync();

        var report = staff.Select(s => new
        {
            s.Id,
            Name = $"{s.FirstName} {s.LastName}",
            s.Department,
            Total = s.Credentials.Count,
            Active = s.Credentials.Count(c => c.Status == "Active"),
            Expiring = s.Credentials.Count(c => c.Status == "Expiring"),
            Expired = s.Credentials.Count(c => c.Status == "Expired"),
            ComplianceScore = s.Credentials.Count == 0
                ? 100
                : (int)((double)s.Credentials.Count(c => c.Status == "Active") / s.Credentials.Count * 100)
        }).OrderBy(s => s.ComplianceScore);

        return Ok(report);
    }

    [HttpGet("expiring")]
    public async Task<IActionResult> GetExpiring([FromQuery] int days = 30)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(days));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var credentials = await _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .Where(c =>
                c.StaffMember.OrganizationId == OrgId &&
                c.ExpiryDate >= today &&
                c.ExpiryDate <= cutoff)
            .OrderBy(c => c.ExpiryDate)
            .Select(c => new
            {
                c.Id,
                StaffMember = $"{c.StaffMember.FirstName} {c.StaffMember.LastName}",
                c.StaffMember.Department,
                CredentialType = c.CredentialType.Name,
                c.ExpiryDate,
                DaysUntilExpiry = c.ExpiryDate.DayNumber - today.DayNumber
            })
            .ToListAsync();

        return Ok(credentials);
    }

    [HttpGet("department")]
    public async Task<IActionResult> GetByDepartment()
    {
        var data = await _db.StaffMembers
            .Include(s => s.Credentials)
            .Where(s => s.OrganizationId == OrgId && s.IsActive)
            .GroupBy(s => s.Department)
            .Select(g => new
            {
                Department = g.Key,
                StaffCount = g.Count(),
                Expired = g.Sum(s => s.Credentials.Count(c => c.Status == "Expired")),
                Expiring = g.Sum(s => s.Credentials.Count(c => c.Status == "Expiring")),
                Active = g.Sum(s => s.Credentials.Count(c => c.Status == "Active"))
            })
            .OrderBy(d => d.Department)
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLog([FromQuery] int page = 1)
    {
        var pageSize = 50;
        var logs = await _db.AuditLogs
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("compliance/export")]
    public async Task<IActionResult> ExportCompliance()
    {
        var staff = await _db.StaffMembers
            .Include(s => s.Credentials)
            .Where(s => s.OrganizationId == OrgId && s.IsActive)
            .ToListAsync();

        var rows = staff.Select(s => new
        {
            Name = $"{s.FirstName} {s.LastName}",
            s.Department,
            Total = s.Credentials.Count,
            Active = s.Credentials.Count(c => c.Status == "Active"),
            Expiring = s.Credentials.Count(c => c.Status == "Expiring"),
            Expired = s.Credentials.Count(c => c.Status == "Expired"),
            ComplianceScore = s.Credentials.Count == 0
                ? 100
                : (int)((double)s.Credentials.Count(c => c.Status == "Active") / s.Credentials.Count * 100)
        }).OrderBy(s => s.ComplianceScore);

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Name,Department,Total,Active,Expiring,Expired,Compliance Score");
        foreach (var r in rows)
            csv.AppendLine($"{r.Name},{r.Department},{r.Total},{r.Active},{r.Expiring},{r.Expired},{r.ComplianceScore}%");

        return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()),
            "text/csv", $"compliance-{DateTime.UtcNow:yyyy-MM-dd}.csv");
    }

    [HttpGet("expiring/export")]
    public async Task<IActionResult> ExportExpiring([FromQuery] int days = 30)
    {
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(days));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var rows = await _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .Where(c =>
                c.StaffMember.OrganizationId == OrgId &&
                c.ExpiryDate >= today &&
                c.ExpiryDate <= cutoff)
            .OrderBy(c => c.ExpiryDate)
            .Select(c => new
            {
                StaffMember = $"{c.StaffMember.FirstName} {c.StaffMember.LastName}",
                c.StaffMember.Department,
                CredentialType = c.CredentialType.Name,
                c.ExpiryDate,
                DaysUntilExpiry = c.ExpiryDate.DayNumber - today.DayNumber
            })
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Staff Member,Department,Credential Type,Expiry Date,Days Until Expiry");
        foreach (var r in rows)
            csv.AppendLine($"{r.StaffMember},{r.Department},{r.CredentialType},{r.ExpiryDate},{r.DaysUntilExpiry}");

        return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()),
            "text/csv", $"expiring-{DateTime.UtcNow:yyyy-MM-dd}.csv");
    }

    [HttpGet("department/export")]
    public async Task<IActionResult> ExportDepartment()
    {
        var rows = await _db.StaffMembers
            .Include(s => s.Credentials)
            .Where(s => s.OrganizationId == OrgId && s.IsActive)
            .GroupBy(s => s.Department)
            .Select(g => new
            {
                Department = g.Key,
                StaffCount = g.Count(),
                Active = g.Sum(s => s.Credentials.Count(c => c.Status == "Active")),
                Expiring = g.Sum(s => s.Credentials.Count(c => c.Status == "Expiring")),
                Expired = g.Sum(s => s.Credentials.Count(c => c.Status == "Expired"))
            })
            .OrderBy(d => d.Department)
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Department,Staff Count,Active,Expiring,Expired");
        foreach (var r in rows)
            csv.AppendLine($"{r.Department},{r.StaffCount},{r.Active},{r.Expiring},{r.Expired}");

        return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()),
            "text/csv", $"department-{DateTime.UtcNow:yyyy-MM-dd}.csv");
    }
}
