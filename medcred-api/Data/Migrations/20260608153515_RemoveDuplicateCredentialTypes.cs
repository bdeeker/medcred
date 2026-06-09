using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCred.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDuplicateCredentialTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Reassign credentials from duplicates to the keeper (MIN id per name)
            migrationBuilder.Sql(@"
                UPDATE ""Credentials""
                SET ""CredentialTypeId"" = keeper.""KeeperId""
                FROM (
                    SELECT MIN(""Id""::text)::uuid AS ""KeeperId"", ""Name""
                    FROM ""CredentialTypes""
                    GROUP BY ""Name""
                ) AS keeper
                INNER JOIN ""CredentialTypes"" ct ON ct.""Name"" = keeper.""Name""
                WHERE ""Credentials"".""CredentialTypeId"" = ct.""Id""
                  AND ct.""Id"" != keeper.""KeeperId"";
            ");

            // Step 2: Now safe to delete the duplicates
            migrationBuilder.Sql(@"
                DELETE FROM ""CredentialTypes""
                WHERE ""Id"" NOT IN (
                    SELECT MIN(""Id""::text)::uuid
                    FROM ""CredentialTypes""
                    GROUP BY ""Name""
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Cannot restore deleted duplicates
        }
    }
}