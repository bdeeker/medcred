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
public class StaffController : ControllerBase
{
    private readonly AppDbContext _db;
    public StaffController(AppDbContext db) { _db = db; }

    private Guid OrgId => Guid.Parse(User.FindFirstValue("orgId")!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var staff = await _db.StaffMembers
            .Where(s => s.OrganizationId == OrgId)
            .Select(s => new
            {
                s.Id,
                s.FirstName,
                s.LastName,
                s.Department,
                s.LicenseNumber,
                s.IsActive,
                CredentialCount = s.Credentials.Count,
                ExpiringCount = s.Credentials.Count(c => c.Status == "Expiring"),
                ExpiredCount = s.Credentials.Count(c => c.Status == "Expired")
            })
            .OrderBy(s => s.LastName)
            .ToListAsync();

        return Ok(staff);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var staff = await _db.StaffMembers
            .Include(s => s.Credentials)
                .ThenInclude(c => c.CredentialType)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == OrgId);

        if (staff == null) return NotFound();

        return Ok(new
        {
            staff.Id,
            staff.FirstName,
            staff.LastName,
            staff.Department,
            staff.LicenseNumber,
            staff.IsActive,
            Credentials = staff.Credentials.Select(c => new
            {
                c.Id,
                c.Status,
                c.IssuedDate,
                c.ExpiryDate,
                c.FileUrl,
                CredentialType = new
                {
                    c.CredentialType.Id,
                    c.CredentialType.Name
                }
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] StaffDto dto)
    {
        var staff = new StaffMember
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Department = dto.Department,
            LicenseNumber = dto.LicenseNumber,
            OrganizationId = OrgId,
            IsActive = true
        };

        _db.StaffMembers.Add(staff);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
            Action = "Created",
            Entity = "StaffMember",
            Details = $"{dto.FirstName} {dto.LastName}"
        });

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] StaffDto dto)
    {
        var staff = await _db.StaffMembers
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == OrgId);

        if (staff == null) return NotFound();

        staff.FirstName = dto.FirstName;
        staff.LastName = dto.LastName;
        staff.Department = dto.Department;
        staff.LicenseNumber = dto.LicenseNumber;
        staff.IsActive = dto.IsActive;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
            Action = "Updated",
            Entity = "StaffMember",
            Details = $"{dto.FirstName} {dto.LastName}"
        });

        await _db.SaveChangesAsync();
        return Ok(staff);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var staff = await _db.StaffMembers
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == OrgId);

        if (staff == null) return NotFound();

        staff.IsActive = false;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
            Action = "Deactivated",
            Entity = "StaffMember",
            Details = $"{staff.FirstName} {staff.LastName}"
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record StaffDto(
    string FirstName,
    string LastName,
    string Department,
    string LicenseNumber,
    bool IsActive = true);
