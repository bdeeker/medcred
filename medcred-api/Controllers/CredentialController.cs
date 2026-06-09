using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedCred.Api.Data;
using MedCred.Api.Models;
using System.Security.Claims;
using Amazon;
using Amazon.S3;
using Amazon.Runtime;

namespace MedCred.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CredentialController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public CredentialController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    private Guid OrgId => Guid.Parse(User.FindFirstValue("orgId")!);

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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var credential = await _db.Credentials
            .Include(c => c.StaffMember)
            .Include(c => c.CredentialType)
            .Include(c => c.AlertLogs)
            .FirstOrDefaultAsync(c => c.Id == id && c.StaffMember.OrganizationId == OrgId);

        if (credential == null) return NotFound();

        return Ok(new
        {
            credential.Id,
            credential.Status,
            credential.IssuedDate,
            credential.ExpiryDate,
            credential.FileUrl,
            CredentialType = credential.CredentialType?.Name,
            CredentialTypeId = credential.CredentialType?.Id,
            StaffMemberName = $"{credential.StaffMember?.FirstName} {credential.StaffMember?.LastName}",
            StaffMemberId = credential.StaffMember?.Id,
            AlertLogs = credential.AlertLogs?.Select(a => new { a.Id, a.SentAt, a.Channel })
        });
    }

    [HttpPost("upload-url")]
    public IActionResult GetUploadUrl([FromBody] UploadUrlDto dto)
    {
        var accessKey = Environment.GetEnvironmentVariable("Aws__AccessKey")
            ?? _config["Aws:AccessKey"];
        var secretKey = Environment.GetEnvironmentVariable("Aws__SecretKey")
            ?? _config["Aws:SecretKey"];
        var region = _config["Aws:Region"] ?? "us-east-1";
        var bucketName = Environment.GetEnvironmentVariable("Aws__BucketName")
            ?? _config["Aws:BucketName"];

        var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png" };
        if (!allowedTypes.Contains(dto.ContentType))
            return BadRequest(new { message = "Only PDF, JPG, and PNG files are allowed." });

        var credentials = new BasicAWSCredentials(accessKey, secretKey);
        using var s3Client = new AmazonS3Client(credentials, RegionEndpoint.GetBySystemName(region));

        var key = $"credentials/{OrgId}/{Guid.NewGuid()}-{dto.FileName}";

        var request = new Amazon.S3.Model.GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = key,
            Verb = Amazon.S3.HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(5),
            ContentType = dto.ContentType
        };

        var presignedUrl = s3Client.GetPreSignedURL(request);
        var fileUrl = $"https://{bucketName}.s3.{region}.amazonaws.com/{key}";

        return Ok(new { presignedUrl, fileUrl });
    }

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

        return Ok(new
        {
            credential.Id,
            credential.Status,
            credential.IssuedDate,
            credential.ExpiryDate,
            credential.FileUrl,
            CredentialType = credType.Name,
            CredentialTypeId = credType.Id,
            StaffMemberName = $"{staff.FirstName} {staff.LastName}",
            StaffMemberId = staff.Id
        });
    }

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

        return Ok(new
        {
            credential.Id,
            credential.Status,
            credential.IssuedDate,
            credential.ExpiryDate,
            credential.FileUrl,
            CredentialType = credential.CredentialType.Name,
            CredentialTypeId = credential.CredentialType.Id,
            StaffMemberName = $"{credential.StaffMember.FirstName} {credential.StaffMember.LastName}",
            StaffMemberId = credential.StaffMember.Id
        });
    }

    [HttpGet("types")]
    public async Task<IActionResult> GetTypes()
    {
        var types = await _db.CredentialTypes.OrderBy(t => t.Name).ToListAsync();
        return Ok(types);
    }

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

    [HttpDelete("types/{id}")]
    public async Task<IActionResult> DeleteType(Guid id)
    {
        var type = await _db.CredentialTypes.FindAsync(id);
        if (type == null) return NotFound();
        _db.CredentialTypes.Remove(type);
        await _db.SaveChangesAsync();
        return NoContent();
    }

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

    // TEMPORARY — remove after running once
    [HttpDelete("types/cleanup-duplicates")]
    public async Task<IActionResult> CleanupDuplicateTypes()
    {
        var allTypes = await _db.CredentialTypes.OrderBy(t => t.Name).ToListAsync();

        var toDelete = allTypes
            .GroupBy(t => t.Name)
            .Where(g => g.Count() > 1)
            .SelectMany(g => g.Skip(1))
            .ToList();

        _db.CredentialTypes.RemoveRange(toDelete);
        await _db.SaveChangesAsync();

        return Ok(new { deleted = toDelete.Count, message = "Duplicates removed." });
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
public record UploadUrlDto(string FileName, string ContentType);