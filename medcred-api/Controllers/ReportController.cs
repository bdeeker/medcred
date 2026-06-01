using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MedCred.Api.Data;

namespace MedCred.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportController(AppDbContext db)
    {
        _db = db;
    }

    private Guid OrgId => Guid.Parse(User.FindFirstValue("orgId")!);

    // GET api/report/compliance
    [HttpGet("compliance")]
    public async Task<IActionResult> GetComplianceReport()
    {
        var staff = await _db.StaffMembers
            .Include(s => s.Credentials)
                .ThenInclude(c => c.CredentialType)
            .Where(s => s.OrganizationId == OrgId && s.IsActive)
            .OrderBy(s => s.LastName)
            .ToListAsync();

        var requiredTypes = await _db.CredentialTypes
            .Where(ct => ct.IsRequired)
            .ToListAsync();

        var report = staff.Select(s => new
        {
            s.Id,
            s.FirstName,
            s.LastName,
            s.Department,
            ComplianceStatus = s.Credentials.Any(c => c.Status == "Expired") ? "Non-Compliant"
                : s.Credentials.Any(c => c.Status == "Expiring") ? "At Risk"
                : "Compliant",
            MissingCredentials = requiredTypes
                .Where(rt => !s.Credentials.Any(c => c.CredentialTypeId == rt.Id))
                .Select(rt => rt.Name)
                .ToList(),
            Credentials = s.Credentials.Select(c => new
            {
                c.Id,
                Type = c.CredentialType.Name,
                c.ExpiryDate,
                c.Status
            })
        });

        var summary = new
        {
            TotalStaff = staff.Count,
            Compliant = report.Count(r => r.ComplianceStatus == "Compliant"),
            AtRisk = report.Count(r => r.ComplianceStatus == "At Risk"),
            NonCompliant = report.Count(r => r.ComplianceStatus == "Non-Compliant"),
            GeneratedAt = DateTime.UtcNow
        };

        return Ok(new { summary, staff = report });
    }

    // GET api/report/expiring?days=30
    [HttpGet("expiring")]
    public async Task<IActionResult> GetExpiringReport([FromQuery] int days = 30)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var cutoff = today.AddDays(days);

        var expiring = await _db.Credentials
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
                DaysUntilExpiry = c.ExpiryDate.DayNumber - today.DayNumber,
                c.Status
            })
            .ToListAsync();

        return Ok(new
        {
            GeneratedAt = DateTime.UtcNow,
            DaysAhead = days,
            Count = expiring.Count,
            Items = expiring
        });
    }

    // GET api/report/department
    [HttpGet("department")]
    public async Task<IActionResult> GetDepartmentReport()
    {
        var report = await _db.StaffMembers
            .Include(s => s.Credentials)
            .Where(s => s.OrganizationId == OrgId && s.IsActive)
            .GroupBy(s => s.Department)
            .Select(g => new
            {
                Department = g.Key,
                TotalStaff = g.Count(),
                TotalCredentials = g.Sum(s => s.Credentials.Count),
                Expired = g.Sum(s => s.Credentials.Count(c => c.Status == "Expired")),
                Expiring = g.Sum(s => s.Credentials.Count(c => c.Status == "Expiring")),
                Active = g.Sum(s => s.Credentials.Count(c => c.Status == "Active"))
            })
            .OrderBy(r => r.Department)
            .ToListAsync();

        return Ok(new { GeneratedAt = DateTime.UtcNow, Departments = report });
    }

    // GET api/report/audit
    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLog([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var total = await _db.AuditLogs.CountAsync();

        var logs = await _db.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize),
            Items = logs
        });
    }
}
