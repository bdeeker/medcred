using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedCred.Api.Data;
using MedCred.Api.Models;
using System.Security.Claims;

namespace MedCred.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CredentialController : ControllerBase
{
    private readonly AppDbContext _db;

    public CredentialController(AppDbContext db)
    {
        _db = db;
    }

    private Guid OrgId => Guid.Parse(User.FindFirstValue("orgId")!);

    // GET api/credential
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var query = _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .Where(c => c.StaffMember.OrganizationId == OrgId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        var credentials = await query
            .OrderBy(c => c.ExpiryDate)
            .Select(c => new
            {
                c.Id,
                c.Status,
                c.IssuedDate,
                c.ExpiryDate,
                c.FileUrl,
                StaffMember = $"{c.StaffMember.FirstName} {c.StaffMember.LastName}",
                StaffMemberId = c.StaffMember.Id,
                CredentialType = c.CredentialType.Name,
                CredentialTypeId = c.CredentialType.Id,
                DaysUntilExpiry = c.ExpiryDate.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber
            })
            .ToListAsync();

        return Ok(credentials);
    }

    // GET api/credential/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var credential = await _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .Include(c => c.AlertLogs)
            .FirstOrDefaultAsync(c => c.Id == id && c.StaffMember.OrganizationId == OrgId);

        if (credential == null) return NotFound();
        return Ok(credential);
    }

    // POST api/credential
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CredentialDto dto)
    {
        var staff = await _db.StaffMembers
            .FirstOrDefaultAsync(s => s.Id == dto.StaffMemberId && s.OrganizationId == OrgId);

        if (staff == null) return NotFound(new { message = "Staff member not found" });

        var credType = await _db.CredentialTypes.FindAsync(dto.CredentialTypeId);
        if (credType == null) return NotFound(new { message = "Credential type not found" });

        var status = CalculateStatus(dto.ExpiryDate, credType.WarnDaysAhead);

        var credential = new Credential
        {
            StaffMemberId = dto.StaffMemberId,
            CredentialTypeId = dto.CredentialTypeId,
            IssuedDate = dto.IssuedDate,
            ExpiryDate = dto.ExpiryDate,
            Status = status,
            FileUrl = dto.FileUrl
        };

        _db.Credentials.Add(credential);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
            Action = "Created",
            Entity = "Credential",
            Details = $"{credType.Name} for {staff.FirstName} {staff.LastName}"
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = credential.Id }, credential);
    }

    // PUT api/credential/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CredentialDto dto)
    {
        var credential = await _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .FirstOrDefaultAsync(c => c.Id == id && c.StaffMember.OrganizationId == OrgId);

        if (credential == null) return NotFound();

        credential.IssuedDate = dto.IssuedDate;
        credential.ExpiryDate = dto.ExpiryDate;
        credential.FileUrl = dto.FileUrl;
        credential.Status = CalculateStatus(dto.ExpiryDate, credential.CredentialType.WarnDaysAhead);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
            Action = "Updated",
            Entity = "Credential",
            Details = $"{credential.CredentialType.Name} for {credential.StaffMember.FirstName} {credential.StaffMember.LastName}"
        });

        await _db.SaveChangesAsync();
        return Ok(credential);
    }

    // GET api/credential/types
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes()
    {
        var types = await _db.CredentialTypes.OrderBy(t => t.Name).ToListAsync();
        return Ok(types);
    }

    // POST api/credential/types
    [HttpPost("types")]
    public async Task<IActionResult> CreateType([FromBody] CredentialTypeDto dto)
    {
        var type = new CredentialType
        {
            Name = dto.Name,
            WarnDaysAhead = dto.WarnDaysAhead,
            IsRequired = dto.IsRequired
        };
        _db.CredentialTypes.Add(type);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTypes), new { id = type.Id }, type);
    }

    // DELETE api/credential/types/{id}
    [HttpDelete("types/{id}")]
    public async Task<IActionResult> DeleteType(Guid id)
    {
        var type = await _db.CredentialTypes.FindAsync(id);
        if (type == null) return NotFound();
        _db.CredentialTypes.Remove(type);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET api/credential/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var summary = await _db.Credentials
            .Include(c => c.StaffMember)
            .Where(c => c.StaffMember.OrganizationId == OrgId)
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var expiringSoon = await _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .Where(c => c.StaffMember.OrganizationId == OrgId && c.Status == "Expiring")
            .OrderBy(c => c.ExpiryDate)
            .Take(10)
            .Select(c => new
            {
                c.Id,
                StaffMember = $"{c.StaffMember.FirstName} {c.StaffMember.LastName}",
                CredentialType = c.CredentialType.Name,
                c.ExpiryDate,
                DaysUntilExpiry = c.ExpiryDate.DayNumber - today.DayNumber
            })
            .ToListAsync();

        return Ok(new { summary, expiringSoon });
    }

    private static string CalculateStatus(DateOnly expiryDate, int warnDaysAhead)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntilExpiry = expiryDate.DayNumber - today.DayNumber;

        if (daysUntilExpiry < 0) return "Expired";
        if (daysUntilExpiry <= warnDaysAhead) return "Expiring";
        return "Active";
    }
}

public record CredentialDto(
    Guid StaffMemberId,
    Guid CredentialTypeId,
    DateOnly IssuedDate,
    DateOnly ExpiryDate,
    string? FileUrl = null);

public record CredentialTypeDto(string Name, int WarnDaysAhead, bool IsRequired);