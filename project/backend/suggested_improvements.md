### Suggested System Improvements

During the creation of the E2E tests for the `relationships` module, a bug was identified in the `createMany` method of the `RelationshipService`. This bug currently causes all relationship creation attempts via the API to fail.

*   **Issue:** The raw SQL query within `src/modules/relationships/relationships.service.ts` uses an incorrect table name for validation. The query references `"FamilyMember"` (PascalCase with quotes) instead of the correct, mapped table name `"family_member"` (snake_case with quotes).

*   **File:** `src/modules/relationships/relationships.service.ts`
*   **Line:** Approximately line 80 (inside the `$queryRawUnsafe` template literal).
*   **Incorrect Code Snippet:**
    ```sql
    -- 1. Check member in family
    SELECT 'MEMBER_NOT_IN_FAMILY' as error FROM new_rels nr
    WHERE 
      (SELECT COUNT(*) FROM "FamilyMember" fm 
       WHERE fm."familyId" = nr.family_id AND fm.id IN (nr.from_id, nr.to_id)) < 2
    ```

*   **Rationale:** The Prisma schema for the `FamilyMember` model uses `@@map("family_member")`, which directs Prisma to interact with a database table named `family_member`. Raw SQL queries, however, do not automatically respect this mapping. Because PostgreSQL treats quoted identifiers as case-sensitive, the query fails with a "relation does not exist" error because the table is named `family_member`, not `FamilyMember`.

*   **Proposed Impact:** Correcting the table name in the raw query from `"FamilyMember"` to `"family_member"` will fix the SQL error. This will allow the `createMany` method to execute its business logic validation correctly and enable the successful creation of relationships through the API. The E2E tests that are currently commented to expect a `500` error can then be updated to assert their intended success or validation-failure status codes.