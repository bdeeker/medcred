using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MedCred.Api.Models;

namespace MedCred.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<StaffMember> StaffMembers => Set<StaffMember>();
    public DbSet<CredentialType> CredentialTypes => Set<CredentialType>();
    public DbSet<Credential> Credentials => Set<Credential>();
    public DbSet<AlertLog> AlertLogs => Set<AlertLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Organization
        builder.Entity<Organization>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.Slug).IsUnique();
            e.Property(o => o.Name).IsRequired().HasMaxLength(200);
            e.Property(o => o.Slug).IsRequired().HasMaxLength(100);
            e.Property(o => o.ContactEmail).IsRequired().HasMaxLength(256);
        });

        // AppUser → Organization
        builder.Entity<AppUser>(e =>
        {
            e.HasOne(u => u.Organization)
             .WithMany(o => o.Users)
             .HasForeignKey(u => u.OrganizationId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // StaffMember
        builder.Entity<StaffMember>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.FirstName).IsRequired().HasMaxLength(100);
            e.Property(s => s.LastName).IsRequired().HasMaxLength(100);
            e.Property(s => s.Department).HasMaxLength(100);
            e.Property(s => s.LicenseNumber).HasMaxLength(100);
            e.HasOne(s => s.Organization)
             .WithMany(o => o.StaffMembers)
             .HasForeignKey(s => s.OrganizationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // CredentialType
        builder.Entity<CredentialType>(e =>
        {
            e.HasKey(ct => ct.Id);
            e.Property(ct => ct.Name).IsRequired().HasMaxLength(200);
        });

        // Credential
        builder.Entity<Credential>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Status).IsRequired().HasMaxLength(20);
            e.Property(c => c.FileUrl).HasMaxLength(500);
            e.HasOne(c => c.StaffMember)
             .WithMany(s => s.Credentials)
             .HasForeignKey(c => c.StaffMemberId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.CredentialType)
             .WithMany(ct => ct.Credentials)
             .HasForeignKey(c => c.CredentialTypeId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // AlertLog
        builder.Entity<AlertLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Channel).IsRequired().HasMaxLength(20);
            e.HasOne(a => a.Credential)
             .WithMany(c => c.AlertLogs)
             .HasForeignKey(a => a.CredentialId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog
        builder.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Action).IsRequired().HasMaxLength(100);
            e.Property(a => a.Entity).IsRequired().HasMaxLength(100);
            e.HasIndex(a => a.CreatedAt);
        });

        // Seed default CredentialTypes
        builder.Entity<CredentialType>().HasData(
            new CredentialType { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "RN License", WarnDaysAhead = 60, IsRequired = true },
            new CredentialType { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "BLS Certification", WarnDaysAhead = 30, IsRequired = true },
            new CredentialType { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "ACLS Certification", WarnDaysAhead = 30, IsRequired = false },
            new CredentialType { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "DEA Registration", WarnDaysAhead = 90, IsRequired = false },
            new CredentialType { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "Malpractice Insurance", WarnDaysAhead = 60, IsRequired = true }
        );
    }
}
